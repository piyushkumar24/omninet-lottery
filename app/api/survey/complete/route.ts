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
 * Manual Survey Completion Handler
 * 
 * This can be used as a fallback if the postback fails
 * or for testing purposes. Now includes bonus ticket logic for non-winner emails.
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

    // Check for non-winner email tracking token
    const { searchParams } = new URL(request.url);
    const nonWinnerToken = searchParams.get('token');
    let isNonWinnerBonus = false;
    let bonusTicketsToAward = 1; // Default: 1 ticket for regular survey completion
    let trackingRecord = null;

    if (nonWinnerToken && nonWinnerToken.startsWith('nw_')) {
      // Verify the non-winner token
      try {
        trackingRecord = await db.settings.findUnique({
          where: { key: `non_winner_email_${nonWinnerToken}` }
        });

        if (trackingRecord) {
          const trackingData = JSON.parse(trackingRecord.value);
          
          // Verify the token belongs to this user and hasn't been used
          if (trackingData.userId === user.id && !trackingData.bonusTicketsAwarded) {
            isNonWinnerBonus = true;
            bonusTicketsToAward = 2; // Award 2 bonus tickets for non-winner email flow
            
            console.log(`🎫 Non-winner bonus flow detected for user ${user.id}, awarding ${bonusTicketsToAward} tickets`);
          }
        }
      } catch (error) {
        console.error('Error verifying non-winner token:', error);
      }
    }

    // Check if user already has a recent survey ticket (within last 5 minutes)
    const recentTicket = await db.ticket.findFirst({
      where: {
        userId: user.id,
        source: "SURVEY",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentTicket && !isNonWinnerBonus) {
      console.log('Recent survey ticket already exists for user:', user.id);
      return NextResponse.json({
        success: true,
        message: "Ticket already awarded recently",
        ticketId: recentTicket.id,
        data: {
          ticketId: recentTicket.id,
          ticketCount: 1,
          source: "SURVEY",
          isNonWinnerBonus: false,
        }
      });
    }

    // Award survey completion tickets using the new system
    const draw = await createOrGetNextDraw();
    
    const result = await db.$transaction(async (tx) => {
      // Award tickets to user (increases both available and total counts)
      const awardResult = await awardTicketsToUser(user.id, bonusTicketsToAward, "SURVEY");
      
      if (!awardResult.success) {
        throw new Error("Failed to award tickets to user");
      }

      // Apply all available tickets to the current lottery
      const appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);

      // Mark non-winner token as used if applicable
      if (isNonWinnerBonus && nonWinnerToken && trackingRecord) {
        await tx.settings.update({
          where: { key: `non_winner_email_${nonWinnerToken}` },
          data: {
            value: JSON.stringify({
              ...JSON.parse(trackingRecord.value),
              bonusTicketsAwarded: true,
              bonusAwardedAt: new Date().toISOString(),
              ticketsAwarded: bonusTicketsToAward
            }),
            updatedAt: new Date(),
          },
        });
      }

      // Check if this is the user's first survey and they were referred by someone
      // If so, award a referral ticket to the referrer
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
      
      const isFirstSurvey = surveyTicketCount <= 1; // Count is 1 because we just created a ticket
      
      if (isFirstSurvey) {
        try {
          // Get complete user data from database to access referredBy field
          const userDetail = await tx.user.findUnique({
            where: { id: user.id },
            select: { referredBy: true }
          });
          
          if (userDetail?.referredBy) {
            // Check if the referrer exists and is eligible
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
                  // Apply the referrer's ticket to the lottery
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
                  
                  // Log the referral award
                  await tx.settings.create({
                    data: {
                      key: `referral_ticket_${referralTicketId}`,
                      value: JSON.stringify({
                        referrerId: referrer.id,
                        referredUserId: user.id,
                        ticketId: referralTicketId,
                        timestamp: new Date().toISOString(),
                      }),
                      description: `Referral ticket awarded to ${referrer.email || referrer.id} for referring ${user.email || user.id}`,
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

      // Log the exact award amount
      await tx.settings.create({
        data: {
          key: `survey_ticket_${awardResult.ticketIds[0]}`,
          value: JSON.stringify({
            userId: user.id,
            ticketIds: awardResult.ticketIds,
            ticketCount: bonusTicketsToAward,
            isNonWinnerBonus,
            referralTicketAwarded,
            referralTicketId,
            timestamp: new Date().toISOString(),
          }),
          description: `Survey completion ticket${bonusTicketsToAward > 1 ? 's' : ''} awarded - ${bonusTicketsToAward} ticket${bonusTicketsToAward > 1 ? 's' : ''}`,
        },
      });

      return {
        ticketIds: awardResult.ticketIds,
        drawId: draw.id,
        totalUserTickets: awardResult.totalTickets,
        availableTickets: awardResult.availableTickets,
        appliedTickets,
        bonusTicketsToAward,
        isNonWinnerBonus,
        referralTicketAwarded,
        referralTicketId,
        referrerInfo
      };
    });

    const message = isNonWinnerBonus 
      ? `🎉 Bonus tickets awarded! You received ${bonusTicketsToAward} lottery tickets for completing the survey after the non-winner email.`
      : `Survey completion ticket awarded - ${bonusTicketsToAward} ticket${bonusTicketsToAward > 1 ? 's' : ''}`;

    console.log('🎫 Survey completion tickets awarded:', {
      userId: user.id,
      ticketIds: result.ticketIds,
      drawId: result.drawId,
      ticketCount: bonusTicketsToAward,
      isNonWinnerBonus,
      referralTicketAwarded: result.referralTicketAwarded,
    });

    // Send email notification
    if (user.email) {
      try {
        await sendTicketApplicationEmail(
          user.email,
          {
            name: user.name || "User",
            ticketCount: bonusTicketsToAward,
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
        ticketCount: bonusTicketsToAward,
        drawId: result.drawId,
        totalUserTickets: result.totalUserTickets,
        availableTickets: result.availableTickets,
        appliedTickets: result.appliedTickets,
        source: "SURVEY",
        isNonWinnerBonus,
        bonusTickets: isNonWinnerBonus,
        appliedToLottery: true,
        referralTicketAwarded: result.referralTicketAwarded,
      },
    });
  } catch (error) {
    console.error("Error awarding survey completion ticket:", error);
    
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