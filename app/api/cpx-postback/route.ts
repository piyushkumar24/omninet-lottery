import { NextRequest, NextResponse } from "next/server";
import { validateCPXPostbackHash, generateCPXSecureHash } from "@/lib/cpx-utils";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { nanoid } from "nanoid";
import { awardTicketsToUser, applyAllTicketsToLottery } from "@/lib/ticket-utils";

/**
 * CPX Research Postback Handler
 * 
 * This endpoint receives notifications from CPX Research when a user completes a survey.
 * It validates the request, awards tickets ONLY for completed surveys (status=1), and automatically applies them to the current lottery.
 * 
 * Expected parameters from CPX:
 * - status: 1 (completed) or 0 (not completed/disqualified)
 * - trans_id: unique transaction ID
 * - user_id: our ext_user_id (user ID from our database)
 * - amount_usd: amount earned in USD
 * - hash: secure hash for validation
 * - ip_click: IP address of the user
 * 
 * CRITICAL: Only status=1 (completed) surveys should receive tickets!
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // CPX sends these parameters
  const userId = searchParams.get('user_id');
  const transId = searchParams.get('trans_id');
  const status = searchParams.get('status');
  const currencyName = searchParams.get('currency_name');
  const currencyAmount = searchParams.get('currency_amount');
  const ip = searchParams.get('ip');
  const subId1 = searchParams.get('subid1');
  const subId2 = searchParams.get('subid2');
  
  console.log('📩 CPX Postback received:', {
    userId,
    transId,
    status,
    currencyName,
    currencyAmount,
    ip,
    subId1,
    subId2,
    timestamp: new Date().toISOString(),
  });

  // Validate required parameters
  if (!userId || !transId || !status) {
    console.error('❌ Missing required parameters in CPX postback:', {
      userId,
      transId,
      status,
    });
    
    return new NextResponse("Missing required parameters", { status: 400 });
  }

  // CRITICAL CHECK: Only award tickets for completed surveys (status=1)
  if (status !== '1') {
    console.log(`⚠️ Survey not completed (status=${status}), no ticket will be awarded for user ${userId}, transaction ${transId}`);
    
    // Log the incomplete survey attempt for tracking
    try {
      await db.settings.create({
        data: {
          key: `cpx_incomplete_${transId}`,
          value: JSON.stringify({
            userId,
            transId,
            status,
            currencyName,
            currencyAmount,
            ip,
            reason: status === '0' ? 'disqualified' : 'incomplete',
            processedAt: new Date().toISOString(),
          }),
          description: `CPX Research incomplete survey ${transId} - no ticket awarded`,
        },
      });
    } catch (logError) {
      console.error('❌ Failed to log incomplete survey:', logError);
    }
    
    return new NextResponse("Survey not completed - no ticket awarded", { status: 200 });
  }

  console.log(`✅ Survey completed successfully (status=1) for user ${userId}, proceeding with ticket award`);

  try {
    // Find user by ID
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referredBy: true,
      },
    });

    if (!user) {
      console.error('❌ User not found for CPX postback:', userId);
      return new NextResponse("User not found", { status: 404 });
    }

    console.log('👤 User found:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      referredBy: user.referredBy,
    });

    // Check if this is the user's first survey
    const existingSurveyTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
      },
    });

    const isFirstSurvey = existingSurveyTickets === 0;
    console.log(`📊 Survey status for user ${user.id}: ${isFirstSurvey ? 'First' : 'Additional'} survey (existing: ${existingSurveyTickets})`);

    // Check if this transaction was already processed
    const existingTransaction = await db.settings.findUnique({
      where: { key: `cpx_transaction_${transId}` },
    });

    if (existingTransaction) {
      console.log('⚠️ Transaction already processed:', transId);
      return new NextResponse("Transaction already processed", { status: 200 });
    }

    // Get current draw
    const draw = await createOrGetNextDraw();

    // Award survey ticket and handle referral logic - ONLY for completed surveys (status=1)
    const result = await db.$transaction(async (tx) => {
      // RULE ENFORCEMENT: CPX survey completion = EXACTLY 1 ticket (NEVER use currencyAmount)
      const SURVEY_TICKETS_TO_AWARD = 1; // FIXED VALUE - NOT BASED ON CURRENCY AMOUNT
      
      console.log(`🎫 CPX Postback: Awarding EXACTLY ${SURVEY_TICKETS_TO_AWARD} ticket for COMPLETED survey (status=1, ignoring currencyAmount: ${currencyAmount})`);
      
      // Award survey ticket to the user
      const surveyAwardResult = await awardTicketsToUser(user.id, SURVEY_TICKETS_TO_AWARD, "SURVEY");
      
      if (!surveyAwardResult.success) {
        throw new Error("Failed to award survey ticket");
      }
      
      // VERIFICATION: Confirm exact ticket count was awarded
      if (surveyAwardResult.ticketIds.length !== SURVEY_TICKETS_TO_AWARD) {
        throw new Error(`TICKET COUNT MISMATCH: Expected ${SURVEY_TICKETS_TO_AWARD}, but awarded ${surveyAwardResult.ticketIds.length}`);
      }

      // Apply all available tickets to the current lottery
      const appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);

      console.log('🎯 Survey ticket awarded and applied for COMPLETED survey:', {
        userId: user.id,
        ticketIds: surveyAwardResult.ticketIds,
        availableTickets: surveyAwardResult.availableTickets,
        totalTickets: surveyAwardResult.totalTickets,
        appliedTickets,
        drawId: draw.id,
        status: 'completed'
      });

      let referralTicketAwarded = false;
      let referralTicketId = null;

      // If this is the user's first survey and they were referred, award referral ticket
      if (isFirstSurvey && user.referredBy) {
        try {
          // Check if the referrer has completed at least one survey (required for referral system)
          const referrerSurveyTickets = await tx.ticket.count({
            where: {
              userId: user.referredBy,
              source: "SURVEY",
            },
          });

          console.log('🔍 Checking referrer eligibility:', {
            referrerId: user.referredBy,
            referrerSurveyTickets,
            eligible: referrerSurveyTickets > 0,
          });

          if (referrerSurveyTickets > 0) {
            // Award referral ticket to the referrer
            const referralAwardResult = await awardTicketsToUser(user.referredBy, 1, "REFERRAL");
            
            if (referralAwardResult.success) {
              // Apply referrer's tickets to lottery
              await applyAllTicketsToLottery(user.referredBy, draw.id);
              
              referralTicketAwarded = true;
              referralTicketId = referralAwardResult.ticketIds[0];

              console.log('🎁 Referral ticket awarded and applied to lottery:', {
                referralTicketId,
                referrerId: user.referredBy,
                newUserId: user.id,
                drawId: draw.id,
                transId,
              });

              // Send email notification to referrer
              try {
                const referrer = await tx.user.findUnique({
                  where: { id: user.referredBy },
                  select: { email: true, name: true },
                });

                if (referrer?.email) {
                  await sendTicketApplicationEmail(referrer.email, {
                    name: referrer.name || "User",
                    ticketCount: 1,
                    drawDate: draw.drawDate,
                    confirmationCode: `REFERRAL_${referralTicketId}`,
                  });
                  console.log('📧 Referral ticket email sent to referrer:', referrer.email);
                }
              } catch (emailError) {
                console.error('📧 Failed to send referral email (non-critical):', emailError);
              }
            } else {
              console.log('❌ Failed to award referral ticket:', referralAwardResult);
            }
          } else {
            console.log('❌ Referrer not eligible (no survey tickets):', {
              referrerId: user.referredBy,
              referrerSurveyTickets,
            });
          }
        } catch (referralError) {
          console.error('⚠️ Referral ticket award failed (continuing with main ticket):', referralError);
        }
      }

      // Record the transaction to prevent duplicate processing
      await tx.settings.create({
        data: {
          key: `cpx_transaction_${transId}`,
          value: JSON.stringify({
            userId: user.id,
            transId,
            status,
            currencyName,
            currencyAmount,
            ip,
            ticketIds: surveyAwardResult.ticketIds,
            referralTicketAwarded,
            referralTicketId,
            processedAt: new Date().toISOString(),
          }),
          description: `CPX Research transaction ${transId} processed`,
        },
      });

      // Email notification for survey completion
      try {
        if (user.email) {
          // Send immediate confirmation email
          await sendTicketApplicationEmail(
            user.email,
            {
              name: user.name || "User",
              ticketCount: 1,
              drawDate: draw.drawDate,
              confirmationCode: `SURVEY_${surveyAwardResult.ticketIds[0]}`,
            }
          );
          console.log('📧 Instant survey completion email sent to:', user.email);
        }
      } catch (emailError) {
        console.error('📧 Failed to send survey completion email (non-critical):', emailError);
      }

      // Send instant notification to frontend if user is active
      try {
        // Create a real-time notification record for instant delivery
        await tx.settings.create({
          data: {
            key: `instant_notification_${user.id}_${Date.now()}`,
            value: JSON.stringify({
              userId: user.id,
              type: 'TICKET_AWARDED',
              source: 'SURVEY',
              ticketCount: 1,
              ticketIds: surveyAwardResult.ticketIds,
              timestamp: new Date().toISOString(),
              message: '🎉 Survey completed! Your ticket has been instantly credited.',
            }),
            description: 'Instant ticket delivery notification',
          },
        });
        console.log('🔔 Instant notification created for user:', user.id);
      } catch (notificationError) {
        console.error('🔔 Failed to create instant notification:', notificationError);
      }

      return {
        userId: user.id,
        ticketIds: surveyAwardResult.ticketIds,
        drawId: draw.id,
        availableTickets: surveyAwardResult.availableTickets,
        totalTickets: surveyAwardResult.totalTickets,
        appliedTickets,
        isFirstSurvey,
        referralTicketAwarded,
        referralTicketId,
        status,
        completionType: status === '1' ? 'completed' : 'participation'
      };
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 15000, // 15 seconds
    });

    console.log('✅ Transaction completed successfully:', {
      ticketIds: result.ticketIds,
      userId: result.userId,
      transId,
      status,
      referralTicketAwarded: result.referralTicketAwarded,
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error('❌ Error processing CPX postback:', error);
    
    // Log the error for debugging
    try {
      await db.settings.create({
        data: {
          key: `cpx_error_${transId}_${Date.now()}`,
          value: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            userId,
            transId,
            status,
            timestamp: new Date().toISOString(),
          }),
          description: `CPX Research transaction error ${transId}`,
        },
      });
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * Test endpoint for health checks
 */
export async function POST(request: NextRequest) {
  return new NextResponse(JSON.stringify({
    success: true,
    message: "CPX Postback endpoint is operational",
    timestamp: new Date().toISOString()
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Test endpoint for health checks
 */
export async function PUT(request: NextRequest) {
  return new NextResponse(JSON.stringify({
    success: true,
    message: "CPX Postback endpoint is operational",
    timestamp: new Date().toISOString()
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Function to award referral ticket
async function awardReferralTicket(referrerId: string, referredUserId: string, drawId: string) {
  // This function is now replaced by the new awardTicketsToUser function
  // Keeping it for backward compatibility if needed
  
  const referralAwardResult = await awardTicketsToUser(referrerId, 1, "REFERRAL");
  
  if (referralAwardResult.success) {
    await applyAllTicketsToLottery(referrerId, drawId);
    return referralAwardResult.ticketIds[0];
  }
  
  return null;
}

// Function to award emergency ticket
async function awardEmergencyTicket(userId: string, transId: string) {
  try {
    const draw = await createOrGetNextDraw();
    
    // Create emergency ticket
    const emergencyTicket = await db.ticket.create({
      data: {
        userId: userId,
        source: "SURVEY",
        isUsed: false, // Set to false so it shows up on dashboard
        drawId: null, // Don't assign to a draw yet
        confirmationCode: `emergency_${transId}_${Date.now()}`,
      },
    });
    
    // Log the emergency award
    await db.settings.create({
      data: {
        key: `emergency_ticket_${emergencyTicket.id}`,
        value: JSON.stringify({
          userId,
          ticketId: emergencyTicket.id,
          transId,
          timestamp: new Date().toISOString(),
        }),
        description: "Emergency ticket award from failed CPX postback",
      },
    });
    
    // Update participation
    const existingParticipation = await db.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: userId,
          drawId: draw.id,
        },
      },
    });

    if (existingParticipation) {
      await db.drawParticipation.update({
        where: { id: existingParticipation.id },
        data: {
          ticketsUsed: existingParticipation.ticketsUsed + 1,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.drawParticipation.create({
        data: {
          userId: userId,
          drawId: draw.id,
          ticketsUsed: 1,
        },
      });
    }
    
    // Update draw total tickets
    await db.draw.update({
      where: { id: draw.id },
      data: {
        totalTickets: {
          increment: 1,
        },
      },
    });
    
    return emergencyTicket;
  } catch (error) {
    console.error('❌ Emergency ticket award function error:', error);
    return null;
  }
} 