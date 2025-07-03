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
  // Log every incoming request for debugging
  console.log('🚨🚨🚨 CPX POSTBACK RECEIVED 🚨🚨🚨');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📌 Request URL:', request.url);
  console.log('📌 User Agent:', request.headers.get('user-agent'));
  console.log('📌 IP Address:', request.headers.get('x-forwarded-for') || 'unknown');

  // Log request to database immediately to capture all incoming requests
  try {
    await db.settings.create({
      data: {
        key: `cpx_raw_request_${Date.now()}`,
        value: JSON.stringify({
          url: request.url,
          timestamp: new Date().toISOString(),
          headers: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            referer: request.headers.get('referer') || 'none',
          },
        }),
        description: 'Raw CPX postback request received',
      },
    });
  } catch (logError) {
    console.error('❌ Failed to log raw request:', logError);
  }

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
  const receivedHash = searchParams.get('hash');
  const testMode = searchParams.get('test_mode');
  
  console.log('📩 CPX Postback received:', {
    userId,
    transId,
    status,
    currencyName,
    currencyAmount,
    ip,
    subId1,
    subId2,
    receivedHash: receivedHash ? '***' + receivedHash.slice(-4) : 'none',
    testMode,
    url: request.url,
    timestamp: new Date().toISOString(),
  });

  // Enhanced parameter validation with detailed logging
  if (!userId || !transId || !status) {
    const missingParams = {
      userId: !userId ? 'MISSING' : 'OK',
      transId: !transId ? 'MISSING' : 'OK',
      status: !status ? 'MISSING' : 'OK',
    };
    
    console.error('❌ CRITICAL: Missing required parameters in CPX postback:', missingParams);
    
    // Log to database for debugging
    try {
      await db.settings.create({
        data: {
          key: `cpx_missing_params_${Date.now()}`,
          value: JSON.stringify({
            missingParams,
            allParams: {
              userId,
              transId,
              status,
              currencyName,
              currencyAmount,
              ip,
              receivedHash: receivedHash ? '***' + receivedHash.slice(-4) : 'none',
            },
            url: request.url,
            timestamp: new Date().toISOString(),
          }),
          description: `CPX postback missing parameters`,
        },
      });
    } catch (logError) {
      console.error('❌ Failed to log missing parameters:', logError);
    }
    
    return new NextResponse("Missing required parameters", { status: 400 });
  }

  // Enhanced hash validation with detailed debugging
  if (!testMode && receivedHash) {
    const expectedHash = generateCPXSecureHash(userId);
    const isValidHash = receivedHash === expectedHash;
    
    if (!isValidHash) {
      console.error('❌ CRITICAL: Hash validation failed in CPX postback:', {
        userId,
        receivedHash: receivedHash ? '***' + receivedHash.slice(-4) : 'none',
        expectedHash: '***' + expectedHash.slice(-4),
        hashInput: `${userId}-[SECURE_KEY]`,
        isValidHash,
      });
      
      // Log hash validation failure
      try {
        await db.settings.create({
          data: {
            key: `cpx_hash_failure_${transId}`,
            value: JSON.stringify({
              userId,
              transId,
              receivedHash: receivedHash ? '***' + receivedHash.slice(-4) : 'none',
              expectedHash: '***' + expectedHash.slice(-4),
              timestamp: new Date().toISOString(),
            }),
            description: `CPX hash validation failure for transaction ${transId}`,
          },
        });
      } catch (logError) {
        console.error('❌ Failed to log hash failure:', logError);
      }
      
      return new NextResponse("Invalid hash", { status: 403 });
    }
    console.log('✅ Hash validation passed for user:', userId);
  } else if (!testMode && !receivedHash) {
    console.warn('⚠️ No hash provided in non-test mode - this should not happen in production');
  }

  // CRITICAL CHECK: Only award tickets for completed surveys (status=1)
  if (status !== '1') {
    console.log(`⚠️ Survey not completed (status=${status}), no ticket will be awarded for user ${userId}, transaction ${transId}`);
    
    // Enhanced logging for incomplete surveys
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
            statusDescription: status === '0' ? 'User was disqualified during survey' : `Survey incomplete (status: ${status})`,
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
    // Enhanced duplicate transaction check
    const existingTransaction = await db.settings.findUnique({
      where: { key: `cpx_transaction_${transId}` },
    });

    if (existingTransaction) {
      console.log('⚠️ Transaction already processed:', transId);
      
      const transactionData = JSON.parse(existingTransaction.value);
      console.log('📋 Existing transaction details:', {
        userId: transactionData.userId,
        ticketIds: transactionData.ticketIds,
        emailSent: transactionData.emailSent,
        processedAt: transactionData.processedAt,
      });
      
      // Check if we need to retry email sending
      try {
        if (transactionData.emailSent === false && transactionData.ticketIds?.length > 0) {
          console.log('📧 Retrying email for previously processed transaction:', transId);
          
          // Find user for email
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          });
          
          if (user?.email) {
            const draw = await createOrGetNextDraw();
            
            // Send email with retry
            await sendEmailWithRetry(
              user.email,
              {
                name: user.name || "User",
                ticketCount: 1,
                drawDate: draw.drawDate,
                confirmationCode: `SURVEY_${transactionData.ticketIds[0]}`,
              }
            );
            
            // Update transaction record to mark email as sent
            await db.settings.update({
              where: { key: `cpx_transaction_${transId}` },
              data: {
                value: JSON.stringify({
                  ...transactionData,
                  emailSent: true,
                  emailRetryAt: new Date().toISOString(),
                }),
              },
            });
            
            console.log('📧 Successfully sent email on retry for transaction:', transId);
          }
        }
      } catch (retryError) {
        console.error('📧 Failed to retry email sending:', retryError);
      }
      
      return new NextResponse("Transaction already processed", { status: 200 });
    }

    // Enhanced user lookup with detailed validation
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referredBy: true,
        availableTickets: true,
        totalTicketsEarned: true,
        isBlocked: true,
      },
    });

    if (!user) {
      console.error('❌ CRITICAL: User not found for CPX postback:', userId);
      
      // Log user not found error
      try {
        await db.settings.create({
          data: {
            key: `cpx_user_not_found_${transId}`,
            value: JSON.stringify({
              userId,
              transId,
              status,
              timestamp: new Date().toISOString(),
              error: 'User not found in database',
            }),
            description: `CPX postback error: User ${userId} not found`,
          },
        });
      } catch (logError) {
        console.error('❌ Failed to log user not found error:', logError);
      }
      
      return new NextResponse("User not found", { status: 404 });
    }

    if (user.isBlocked) {
      console.error('❌ CRITICAL: User is blocked, cannot award ticket:', userId);
      
      // Log blocked user attempt
      try {
        await db.settings.create({
          data: {
            key: `cpx_blocked_user_${transId}`,
            value: JSON.stringify({
              userId,
              transId,
              status,
              timestamp: new Date().toISOString(),
              error: 'User is blocked',
            }),
            description: `CPX postback error: User ${userId} is blocked`,
          },
        });
      } catch (logError) {
        console.error('❌ Failed to log blocked user error:', logError);
      }
      
      return new NextResponse("User is blocked", { status: 403 });
    }

    console.log('👤 User found and validated:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      referredBy: user.referredBy,
      currentAvailableTickets: user.availableTickets,
      totalTicketsEarned: user.totalTicketsEarned,
      isBlocked: user.isBlocked,
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

    // Get current draw
    const draw = await createOrGetNextDraw();

    // Award survey ticket and handle referral logic - ONLY for completed surveys (status=1)
    const result = await db.$transaction(async (tx) => {
      // RULE ENFORCEMENT: CPX survey completion = EXACTLY 1 ticket (NEVER use currencyAmount)
      const SURVEY_TICKETS_TO_AWARD = 1; // FIXED VALUE - NOT BASED ON CURRENCY AMOUNT
      
      console.log(`🎫 CPX Postback: Awarding EXACTLY ${SURVEY_TICKETS_TO_AWARD} ticket for COMPLETED survey (status=1, ignoring currencyAmount: ${currencyAmount})`);
      
      // Enhanced ticket awarding with detailed error handling
      let surveyAwardResult;
      try {
        surveyAwardResult = await awardTicketsToUser(user.id, SURVEY_TICKETS_TO_AWARD, "SURVEY");
        
        console.log('🎯 Ticket award result:', {
          success: surveyAwardResult.success,
          ticketIds: surveyAwardResult.ticketIds,
          availableTickets: surveyAwardResult.availableTickets,
          totalTickets: surveyAwardResult.totalTickets,
          ticketCount: surveyAwardResult.ticketIds.length,
        });
        
        // CRITICAL: Verify ticket was actually created in database
        const ticketVerification = await db.ticket.findFirst({
          where: {
            id: surveyAwardResult.ticketIds[0],
            userId: user.id,
          },
        });
        
        if (!ticketVerification) {
          throw new Error(`Ticket with ID ${surveyAwardResult.ticketIds[0]} not found in database despite successful award result`);
        }
        
        console.log('✅ Ticket creation verified in database:', ticketVerification.id);
        
      } catch (awardError) {
        console.error('❌ CRITICAL: Exception during ticket awarding:', awardError);
        
        // Log ticket awarding failure
        await tx.settings.create({
          data: {
            key: `cpx_award_error_${transId}`,
            value: JSON.stringify({
              userId: user.id,
              transId,
              status,
              error: awardError instanceof Error ? awardError.message : String(awardError),
              stack: awardError instanceof Error ? awardError.stack : undefined,
              timestamp: new Date().toISOString(),
            }),
            description: `CPX ticket awarding error for transaction ${transId}`,
          },
        });
        
        throw new Error(`Ticket awarding failed: ${awardError instanceof Error ? awardError.message : String(awardError)}`);
      }
      
      if (!surveyAwardResult.success) {
        console.error('❌ CRITICAL: Failed to award survey ticket:', {
          userId: user.id,
          transId,
          result: surveyAwardResult,
        });
        
        // Log ticket awarding failure
        await tx.settings.create({
          data: {
            key: `cpx_award_failed_${transId}`,
            value: JSON.stringify({
              userId: user.id,
              transId,
              status,
              awardResult: surveyAwardResult,
              timestamp: new Date().toISOString(),
            }),
            description: `CPX ticket awarding failed for transaction ${transId}`,
          },
        });
        
        throw new Error("Failed to award survey ticket");
      }
      
      // VERIFICATION: Confirm exact ticket count was awarded
      if (surveyAwardResult.ticketIds.length !== SURVEY_TICKETS_TO_AWARD) {
        const errorMsg = `TICKET COUNT MISMATCH: Expected ${SURVEY_TICKETS_TO_AWARD}, but awarded ${surveyAwardResult.ticketIds.length}`;
        console.error('❌ CRITICAL:', errorMsg);
        
        // Log ticket count mismatch
        await tx.settings.create({
          data: {
            key: `cpx_count_mismatch_${transId}`,
            value: JSON.stringify({
              userId: user.id,
              transId,
              expected: SURVEY_TICKETS_TO_AWARD,
              actual: surveyAwardResult.ticketIds.length,
              ticketIds: surveyAwardResult.ticketIds,
              timestamp: new Date().toISOString(),
            }),
            description: `CPX ticket count mismatch for transaction ${transId}`,
          },
        });
        
        throw new Error(errorMsg);
      }

      // Enhanced lottery application with detailed logging
      let appliedTickets = 0;
      try {
        console.log('🎯 Applying tickets to lottery for user:', user.id);
        appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);
        
        // CRITICAL: Verify tickets were actually applied to lottery
        const drawVerification = await db.drawParticipation.findUnique({
          where: {
            userId_drawId: {
              userId: user.id,
              drawId: draw.id,
            },
          },
        });
        
        if (!drawVerification || drawVerification.ticketsUsed < 1) {
          console.error('⚠️ Draw participation verification failed:', {
            userId: user.id,
            drawId: draw.id,
            foundParticipation: !!drawVerification,
            ticketsUsed: drawVerification?.ticketsUsed || 0,
          });
          
          // Retry applying tickets once more
          console.log('🔄 Retrying ticket application to lottery...');
          appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);
          
          // Re-verify after retry
          const retryVerification = await db.drawParticipation.findUnique({
            where: {
              userId_drawId: {
                userId: user.id,
                drawId: draw.id,
              },
            },
          });
          
          if (!retryVerification || retryVerification.ticketsUsed < 1) {
            throw new Error(`Failed to apply tickets to lottery for user ${user.id} even after retry`);
          } else {
            console.log('✅ Ticket application successful on retry:', retryVerification.ticketsUsed);
          }
        } else {
          console.log('✅ Draw participation verified:', {
            userId: user.id,
            drawId: draw.id,
            ticketsApplied: drawVerification.ticketsUsed,
          });
        }
        
        console.log('🎯 Survey ticket awarded and applied for COMPLETED survey:', {
          userId: user.id,
          ticketIds: surveyAwardResult.ticketIds,
          availableTickets: surveyAwardResult.availableTickets,
          totalTickets: surveyAwardResult.totalTickets,
          appliedTickets,
          drawId: draw.id,
          status: 'completed',
          transactionId: transId,
        });
        
      } catch (applyError) {
        console.error('❌ Warning: Failed to apply tickets to lottery (continuing with ticket award):', applyError);
        
        // Log lottery application failure (non-critical)
        await tx.settings.create({
          data: {
            key: `cpx_apply_error_${transId}`,
            value: JSON.stringify({
              userId: user.id,
              transId,
              ticketIds: surveyAwardResult.ticketIds,
              error: applyError instanceof Error ? applyError.message : String(applyError),
              timestamp: new Date().toISOString(),
            }),
            description: `CPX lottery application error for transaction ${transId}`,
          },
        });
        
        // Don't throw here - tickets are still awarded
        appliedTickets = 0;
      }

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
                  await sendEmailWithRetry(
                    referrer.email,
                    {
                      name: referrer.name || "User",
                      ticketCount: 1,
                      drawDate: draw.drawDate,
                      confirmationCode: `REFERRAL_${referralTicketId}`,
                    }
                  );
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

      // Enhanced email notification with detailed error handling and retry mechanism
      let emailSent = false;
      let emailError = null;

      try {
        if (user.email) {
          console.log('📧 Attempting to send survey completion email to:', user.email);
          
          // Send immediate confirmation email with enhanced retry
          await sendEmailWithRetry(
            user.email,
            {
              name: user.name || "User",
              ticketCount: 1,
              drawDate: draw.drawDate,
              confirmationCode: `SURVEY_${surveyAwardResult.ticketIds[0]}`,
            },
            5 // Increased retries for reliability
          );
          
          emailSent = true;
          console.log('📧 ✅ Survey completion email sent successfully to:', user.email);
          
          // Add record of email being sent to database for verification
          await tx.settings.create({
            data: {
              key: `email_sent_${transId}_${Date.now()}`,
              value: JSON.stringify({
                userId: user.id,
                email: user.email,
                ticketId: surveyAwardResult.ticketIds[0],
                drawId: draw.id,
                sentAt: new Date().toISOString(),
              }),
              description: `CPX survey completion email sent successfully`,
            },
          });
        } else {
          const warningMsg = `User ${user.id} has no email address, skipping email notification`;
          console.warn('⚠️', warningMsg);
          emailError = warningMsg;
        }
      } catch (error) {
        const errorMsg = `Failed to send survey completion email: ${error instanceof Error ? error.message : String(error)}`;
        console.error('📧 ❌', errorMsg);
        emailError = errorMsg;
        
        // Log email failure (non-critical)
        await tx.settings.create({
          data: {
            key: `cpx_email_error_${transId}`,
            value: JSON.stringify({
              userId: user.id,
              userEmail: user.email,
              transId,
              error: errorMsg,
              timestamp: new Date().toISOString(),
            }),
            description: `CPX email error for transaction ${transId}`,
          },
        });
      }

      // Enhanced transaction recording with comprehensive data
      await tx.settings.create({
        data: {
          key: `cpx_transaction_${transId}`,
          value: JSON.stringify({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            transId,
            status,
            currencyName,
            currencyAmount,
            ip,
            ticketIds: surveyAwardResult.ticketIds,
            ticketsAwarded: surveyAwardResult.ticketIds.length,
            availableTicketsAfter: surveyAwardResult.availableTickets,
            totalTicketsAfter: surveyAwardResult.totalTickets,
            appliedTickets,
            drawId: draw.id,
            isFirstSurvey,
            referralTicketAwarded,
            referralTicketId,
            processedAt: new Date().toISOString(),
            emailSent,
            emailError,
            processingSuccess: true,
          }),
          description: `CPX Research transaction ${transId} processed successfully`,
        },
      });

      // Create instant notification for frontend with enhanced data
      try {
        await tx.settings.create({
          data: {
            key: `instant_notification_${user.id}_${Date.now()}`,
            value: JSON.stringify({
              userId: user.id,
              type: 'TICKET_AWARDED',
              source: 'SURVEY',
              ticketCount: 1,
              ticketIds: surveyAwardResult.ticketIds,
              transactionId: transId,
              availableTicketsAfter: surveyAwardResult.availableTickets,
              totalTicketsAfter: surveyAwardResult.totalTickets,
              appliedTickets,
              drawId: draw.id,
              timestamp: new Date().toISOString(),
              message: '🎉 Survey completed! Your ticket has been instantly credited.',
            }),
            description: 'Instant ticket delivery notification',
          },
        });
        console.log('🔔 Instant notification created for user:', user.id);
      } catch (notificationError) {
        console.error('🔔 Failed to create instant notification (non-critical):', notificationError);
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
        completionType: status === '1' ? 'completed' : 'participation',
        emailSent,
        emailError,
        processingSuccess: true,
      };
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 15000, // 15 seconds
    });

    console.log('✅ ✅ ✅ CPX TRANSACTION COMPLETED SUCCESSFULLY ✅ ✅ ✅');
    console.log('📊 Final Results:', {
      transactionId: transId,
      userId: result.userId,
      ticketIds: result.ticketIds,
      ticketsAwarded: result.ticketIds.length,
      availableTicketsAfter: result.availableTickets,
      totalTicketsAfter: result.totalTickets,
      appliedToLottery: result.appliedTickets,
      drawId: result.drawId,
      emailSent: result.emailSent,
      referralTicketAwarded: result.referralTicketAwarded,
      processingSuccess: result.processingSuccess,
    });

    // If email failed, schedule a retry
    if (!result.emailSent && user.email && result.ticketIds?.length > 0) {
      console.log('📧 Scheduling email retry for failed email delivery');
      scheduleEmailRetry({
        id: user.id,
        name: user.name,
        email: user.email as string // Type assertion since we already checked it's not null
      }, result.ticketIds[0], draw.drawDate, transId);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error('❌ ❌ ❌ CRITICAL ERROR processing CPX postback ❌ ❌ ❌');
    console.error('💥 Error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      transId,
      status,
      timestamp: new Date().toISOString(),
    });
    
    // EMERGENCY MECHANISM: Award emergency ticket if main transaction fails
    console.log('🚨 Attempting emergency ticket award due to transaction failure...');
    
    try {
      const emergencyTicket = await awardEmergencyTicket(userId, transId);
      
      if (emergencyTicket) {
        console.log('✅ Emergency ticket awarded successfully:', emergencyTicket.id);
        
        // Try to send confirmation email for emergency ticket
        try {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });
          
          if (user?.email) {
            const draw = await createOrGetNextDraw();
            await sendEmailWithRetry(
              user.email,
              {
                name: user.name || "User",
                ticketCount: 1,
                drawDate: draw.drawDate,
                confirmationCode: `EMERGENCY_${emergencyTicket.id}`,
              }
            );
            console.log('📧 Emergency ticket confirmation email sent');
          }
        } catch (emergencyEmailError) {
          console.error('📧 Failed to send emergency ticket email:', emergencyEmailError);
        }
        
        return new NextResponse("Emergency ticket awarded", { status: 200 });
      } else {
        console.error('❌ Emergency ticket award also failed');
      }
    } catch (emergencyError) {
      console.error('❌ Emergency ticket award failed:', emergencyError);
    }
    
    // Enhanced error logging
    try {
      await db.settings.create({
        data: {
          key: `cpx_critical_error_${transId}_${Date.now()}`,
          value: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            transId,
            status,
            currencyAmount,
            currencyName,
            ip,
            timestamp: new Date().toISOString(),
            processingFailed: true,
          }),
          description: `CPX Research critical error ${transId}`,
        },
      });
    } catch (logError) {
      console.error('❌ Failed to log critical error:', logError);
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

/**
 * Send email with improved retry mechanism
 */
async function sendEmailWithRetry(
  email: string,
  data: {
    name: string;
    ticketCount: number;
    drawDate: Date;
    confirmationCode?: string;
  },
  maxRetries = 3
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} to ${email}...`);
      
      // Add additional flags to email to make it more visible and avoid spam filters
      const enhancedData = {
        ...data,
        name: data.name || "User",
        isUrgent: true,
        isPriority: true,
        isTicketConfirmation: true,
        attemptNumber: attempt
      };
      
      await sendTicketApplicationEmail(email, enhancedData);
      console.log(`📧 Email attempt ${attempt} succeeded`);
      return true;
    } catch (error) {
      console.error(`📧 Email attempt ${attempt}/${maxRetries} failed:`, error);
      lastError = error;
      
      // Log email failure to database for monitoring
      try {
        await db.settings.create({
          data: {
            key: `email_retry_${Date.now()}_attempt_${attempt}`,
            value: JSON.stringify({
              email,
              data,
              attemptNumber: attempt,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }),
            description: `Email retry attempt ${attempt} failed`
          }
        });
      } catch (logError) {
        console.error('Failed to log email retry:', logError);
      }
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.log(`📧 Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all attempts failed
  console.error(`📧 All ${maxRetries} email attempts failed`);
  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError}`);
}

/**
 * Schedule email retry for failed emails
 */
function scheduleEmailRetry(
  user: { id: string; name?: string | null; email: string },
  ticketId: string,
  drawDate: Date,
  transId: string
) {
  setTimeout(async () => {
    try {
      console.log(`📧 Attempting scheduled email retry for transaction ${transId}`);
      
      await sendEmailWithRetry(
        user.email,
        {
          name: user.name || "User",
          ticketCount: 1,
          drawDate: drawDate,
          confirmationCode: `SURVEY_${ticketId}`,
        }
      );
      
      // Update transaction record to mark email as sent
      await db.settings.update({
        where: { key: `cpx_transaction_${transId}` },
        data: {
          value: JSON.stringify({
            userId: user.id,
            transId,
            ticketIds: [ticketId],
            emailSent: true,
            emailRetryAt: new Date().toISOString(),
          }),
        },
      });
      
      console.log('📧 Successfully sent email on scheduled retry for transaction:', transId);
    } catch (error) {
      console.error('📧 Scheduled email retry failed:', error);
    }
  }, 30000); // Retry after 30 seconds
}

// Function to award emergency ticket
async function awardEmergencyTicket(userId: string, transId: string) {
  try {
    console.log('🚨 Starting emergency ticket award for user:', userId);
    
    // Create emergency ticket directly
    const emergencyTicket = await db.ticket.create({
      data: {
        userId,
        source: "SURVEY",
        isUsed: false,
        confirmationCode: `EMERGENCY_${transId}_${Date.now()}`,
      },
    });
    
    // Update user's ticket counts
    await db.user.update({
      where: { id: userId },
      data: {
        availableTickets: {
          increment: 1,
        },
        totalTicketsEarned: {
          increment: 1,
        },
      },
    });
    
    // Get current draw
    const draw = await createOrGetNextDraw();
    
    // Apply ticket to lottery
    await applyAllTicketsToLottery(userId, draw.id);
    
    // Log emergency ticket award
    await db.settings.create({
      data: {
        key: `cpx_emergency_${transId}`,
        value: JSON.stringify({
          userId,
          transId,
          ticketId: emergencyTicket.id,
          timestamp: new Date().toISOString(),
        }),
        description: "Emergency ticket awarded due to transaction failure",
      },
    });
    
    console.log('✅ Emergency ticket awarded and applied to lottery:', emergencyTicket.id);
    return emergencyTicket;
  } catch (error) {
    console.error('❌ Error awarding emergency ticket:', error);
    return null;
  }
} 