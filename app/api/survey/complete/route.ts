import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { awardTicketsToUser, applyAllTicketsToLottery } from "@/lib/ticket-utils";
import { nanoid } from "nanoid";

/**
 * Survey Completion Verification Endpoint
 * 
 * This endpoint can be called from the frontend to verify if a user
 * recently completed a survey (useful for showing completion messages)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // This endpoint can be used for additional verification if needed
    // For now, we'll just return success since the survey completion
    // is handled by the CPX postback endpoint
    
    return NextResponse.json({
      success: true,
      message: "Survey completion check successful",
    });
  } catch (error) {
    console.error("Error checking survey completion:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
}

/**
 * Survey Completion Handler
 * 
 * CRITICAL: This endpoint should ONLY be used for:
 * 1. Non-winner email bonus tickets (verified with token)
 * 2. NOT for general "participation" tickets 
 * 
 * Regular survey completion tickets should ONLY come from CPX postback endpoint
 * when status=1 (survey actually completed)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Check for non-winner email tracking token - ONLY valid use case for this endpoint
    const { searchParams } = new URL(request.url);
    const nonWinnerToken = searchParams.get('token');
    let isNonWinnerBonus = false;
    let ticketsToAward = 0; // Default: 0 tickets (no general participation awards)
    let trackingRecord = null;

    // ONLY award tickets for verified non-winner bonus scenarios
    if (nonWinnerToken && nonWinnerToken.startsWith('nw_')) {
      try {
        trackingRecord = await db.settings.findUnique({
          where: { key: `non_winner_email_${nonWinnerToken}` }
        });

        if (trackingRecord) {
          const trackingData = JSON.parse(trackingRecord.value);
          
          if (trackingData.userId === user.id && !trackingData.bonusTicketsAwarded) {
            isNonWinnerBonus = true;
            ticketsToAward = 2; // Non-winner bonus = 2 tickets
            
            console.log(`🎫 Non-winner bonus flow detected for user ${user.id}, awarding ${ticketsToAward} tickets`);
          }
        }
      } catch (error) {
        console.error('Error verifying non-winner token:', error);
        ticketsToAward = 0; // No tickets for invalid tokens
      }
    }

    // CRITICAL: Reject general participation ticket requests
    if (!isNonWinnerBonus) {
      console.log(`🚫 General participation ticket request rejected for user ${user.id} - tickets only awarded for completed surveys via CPX postback`);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Tickets are only awarded for completed surveys verified by CPX Research",
          error: "PARTICIPATION_TICKETS_DISABLED"
        }),
        { status: 403 }
      );
    }

    console.log(`✅ Processing legitimate non-winner bonus ticket award for user ${user.id}`);

    // Get or create the current draw
    const draw = await createOrGetNextDraw();
    
    console.log(`🎫 Processing survey completion for user ${user.id}, awarding EXACTLY ${ticketsToAward} tickets (NO DECIMALS)`);

    const result = await db.$transaction(async (tx) => {
      // Award survey completion tickets - GUARANTEED INTEGER COUNT
      const awardResult = await awardTicketsToUser(user.id, ticketsToAward, "SURVEY");
      
      if (!awardResult.success) {
        throw new Error("Failed to award survey tickets to user");
      }

      // VERIFICATION: Confirm exact ticket count was awarded
      console.log(`✅ VERIFIED: Awarded exactly ${ticketsToAward} survey tickets to user ${user.id} (Expected: ${ticketsToAward}, Actual: ${awardResult.ticketIds.length})`);
      
      if (awardResult.ticketIds.length !== ticketsToAward) {
        throw new Error(`TICKET COUNT MISMATCH: Expected ${ticketsToAward}, but awarded ${awardResult.ticketIds.length}`);
      }

      // Apply all available tickets to the current lottery
      const appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);
      console.log(`🎯 Applied ${appliedTickets} tickets to lottery for user ${user.id}`);

      // Mark non-winner token as used if applicable
      if (isNonWinnerBonus && nonWinnerToken && trackingRecord) {
        await tx.settings.update({
          where: { key: `non_winner_email_${nonWinnerToken}` },
          data: {
            value: JSON.stringify({
              ...JSON.parse(trackingRecord.value),
              bonusTicketsAwarded: true,
              bonusAwardedAt: new Date().toISOString(),
              ticketsAwarded: ticketsToAward
            }),
            updatedAt: new Date(),
          },
        });
      }

      // Handle referral ticket for referrer (if this is user's first survey)
      let referralTicketAwarded = false;
      let referralTicketId = null;
      let referrerInfo = null;
      
      // Count existing survey tickets to determine if this is the first one
      const surveyTicketCount = await tx.ticket.count({
        where: {
          userId: user.id,
          source: "SURVEY",
        },
      });
      
      const isFirstSurvey = surveyTicketCount <= ticketsToAward; // Just awarded tickets
      
      if (isFirstSurvey) {
        try {
          // Get complete user data from database to access referredBy field
          const userDetail = await tx.user.findUnique({
            where: { id: user.id },
            select: { referredBy: true }
          });
          
          if (userDetail?.referredBy) {
            // Check if the referrer exists
            const referrer = await tx.user.findUnique({
              where: { id: userDetail.referredBy },
              select: { id: true, name: true, email: true }
            });
            
            if (referrer) {
              // Check if a referral ticket was already awarded for this user
              const existingReferralTicket = await tx.ticket.findFirst({
                where: {
                  userId: referrer.id,
                  source: "REFERRAL",
                  confirmationCode: {
                    contains: user.id,
                  },
                },
              });
              
              if (!existingReferralTicket) {
                // Award referral ticket to the referrer
                const referralAwardResult = await awardTicketsToUser(
                  referrer.id, 
                  1, 
                  "REFERRAL"
                );
                
                if (referralAwardResult.success) {
                  // Apply the referrer's tickets to the lottery
                  await applyAllTicketsToLottery(referrer.id, draw.id);
                  
                  referralTicketAwarded = true;
                  referralTicketId = referralAwardResult.ticketIds[0];
                  referrerInfo = referrer;
                  
                  // Add confirmation code to the referral ticket
                  await tx.ticket.update({
                    where: { id: referralTicketId },
                    data: {
                      confirmationCode: `REF_${user.id}_${nanoid(6)}`,
                    },
                  });
                  
                  console.log(`🎁 Referral ticket awarded to ${referrer.id} for referring ${user.id}`);
                }
              } else {
                console.log(`Referral ticket already awarded to ${referrer.id} for referring ${user.id}`);
              }
            }
          }
        } catch (referralError) {
          console.error('⚠️ Error awarding referral ticket:', referralError);
          // Continue with the main flow even if referral award fails
        }
      }

      return {
        ticketIds: awardResult.ticketIds,
        drawId: draw.id,
        totalUserTickets: awardResult.totalTickets,
        availableTickets: awardResult.availableTickets,
        appliedTickets,
        ticketsToAward,
        isNonWinnerBonus,
        referralTicketAwarded,
        referralTicketId,
        referrerInfo
      };
    });

    const message = isNonWinnerBonus 
      ? `🎉 Bonus tickets awarded! You received ${ticketsToAward} lottery tickets for completing the survey.`
      : `✅ Survey completed! You received ${ticketsToAward} lottery ticket${ticketsToAward > 1 ? 's' : ''}.`;

    console.log('🎫 Survey completion tickets awarded:', {
      userId: user.id,
      ticketIds: result.ticketIds,
      drawId: result.drawId,
      ticketCount: ticketsToAward,
      appliedTickets: result.appliedTickets,
      isNonWinnerBonus,
      referralTicketAwarded: result.referralTicketAwarded,
    });

    // Send email notification to user
    if (user.email) {
      try {
        await sendTicketApplicationEmail(
          user.email,
          {
            name: user.name || "User",
            ticketCount: ticketsToAward,
            drawDate: draw.drawDate,
            confirmationCode: `SURVEY_${result.ticketIds[0]}`,
          }
        );
        console.log('📧 Survey ticket email sent to user:', user.email);
      } catch (emailError) {
        console.error('📧 Failed to send survey ticket email:', emailError);
      }
    }
    
    // Send email notification to referrer if applicable
    if (result.referralTicketAwarded && result.referrerInfo?.email) {
      try {
        await sendTicketApplicationEmail(
          result.referrerInfo.email,
          {
            name: result.referrerInfo.name || "User",
            ticketCount: 1,
            drawDate: draw.drawDate,
            confirmationCode: `REF_${result.referralTicketId}`,
          }
        );
        console.log('📧 Referral ticket email sent to referrer:', result.referrerInfo.email);
      } catch (emailError) {
        console.error('📧 Failed to send referral ticket email:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message,
      data: {
        ticketIds: result.ticketIds,
        ticketId: result.ticketIds[0], // For backward compatibility
        ticketCount: ticketsToAward,
        drawId: result.drawId,
        totalUserTickets: result.totalUserTickets,
        availableTickets: result.availableTickets,
        appliedTickets: result.appliedTickets,
        source: "SURVEY",
        isNonWinnerBonus,
        appliedToLottery: true,
        referralTicketAwarded: result.referralTicketAwarded,
      },
    });
  } catch (error) {
    console.error("❌ Error awarding survey completion ticket:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "❌ Something went wrong while awarding the ticket.",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
} 