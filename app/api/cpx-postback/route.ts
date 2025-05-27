import { NextRequest, NextResponse } from "next/server";
import { validateCPXPostbackHash, generateCPXSecureHash } from "@/lib/cpx-utils";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { nanoid } from "nanoid";

/**
 * CPX Research Postback Handler
 * 
 * This endpoint receives notifications from CPX Research when a user completes a survey.
 * It validates the request, awards tickets to the user, and automatically applies them to the current lottery.
 * 
 * Expected parameters from CPX:
 * - status: 1 (completed) or 0 (not completed)
 * - trans_id: unique transaction ID
 * - user_id: our ext_user_id (user ID from our database)
 * - amount_usd: amount earned in USD
 * - hash: secure hash for validation
 * - ip_click: IP address of the user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract parameters from CPX postback
  const status = searchParams.get('status');
  const transId = searchParams.get('trans_id');
  const userId = searchParams.get('user_id');
  const amountUsd = searchParams.get('amount_usd');
  const hash = searchParams.get('hash');
  const ipClick = searchParams.get('ip_click');
  const offerId = searchParams.get('offer_id');
  const subid = searchParams.get('sub_id');
  const subid2 = searchParams.get('sub_id_2');

  // Test mode for easy debugging
  const isTestMode = searchParams.get('test_mode') === '1';

  // Enhanced logging for debugging
  console.log('🔔 CPX Postback received:', {
    timestamp: new Date().toISOString(),
    status,
    transId,
    userId,
    amountUsd,
    hash: hash ? `${hash.substring(0, 8)}...` : 'missing',
    ipClick,
    offerId,
    subid,
    subid2,
    isTestMode,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  // Validate required parameters
  if (!status || !transId || !userId) {
    console.error('❌ Missing required parameters in CPX postback:', {
      status: !!status,
      transId: !!transId,
      userId: !!userId,
    });
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  // Special test mode for debugging
  if (isTestMode) {
    console.log('🧪 Test mode active, skipping hash validation');
    
    // For test mode requests, calculate what the expected hash would be
    const expectedHash = generateCPXSecureHash(userId);
    console.log('🔑 Expected hash:', expectedHash);
    console.log('🔑 Received hash:', hash);
    
    // Process test postback without hash validation
    return new NextResponse(JSON.stringify({
      success: true,
      message: "Test postback received",
      expectedHash: expectedHash,
      receivedHash: hash,
      userId: userId,
      status: status
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate the secure hash
  if (!hash || !validateCPXPostbackHash(userId, hash)) {
    console.error('🚫 Invalid hash in CPX postback:', { 
      userId, 
      receivedHash: hash ? hash.substring(0, 8) + '...' : 'missing',
      expectedHash: generateCPXSecureHash(userId).substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    });
    return new NextResponse('Invalid hash', { status: 403 });
  }

  console.log('✅ Hash validation passed for user:', userId);

  // Check if survey was completed successfully
  if (status !== '1') {
    console.log('⏸️ Survey not completed (status !== 1):', {
      status,
      userId,
      transId,
    });
    return new NextResponse('Survey not completed', { status: 200 });
  }

  console.log('🎯 Processing successful survey completion for user:', userId);

  try {
    // Check if this transaction has already been processed by looking for existing tickets
    // We'll use a simple approach of checking if a ticket was recently created for this user
    const recentTicket = await db.ticket.findFirst({
      where: {
        userId: userId,
        source: "SURVEY",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Extended to 5 minutes for safety
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentTicket) {
      console.log('⚠️ Recent survey ticket found - possible duplicate transaction:', {
        transId,
        userId,
        recentTicketId: recentTicket.id,
        recentTicketTime: recentTicket.createdAt,
        timeDiff: Date.now() - recentTicket.createdAt.getTime(),
      });
      return new NextResponse(JSON.stringify({
        success: true,
        message: "Duplicate transaction - ticket already awarded",
        ticketId: recentTicket.id
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user exists
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
      console.error('👤 User not found:', userId);
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('👤 User found:', {
      userId: user.id,
      name: user.name,
      hasReferrer: !!user.referredBy,
    });

    // Check if this is the user's first survey
    const existingSurveyTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
      },
    });

    const isFirstSurvey = existingSurveyTickets === 0;

    console.log('📊 Survey analysis:', {
      userId: user.id,
      existingSurveyTickets,
      isFirstSurvey,
      transId,
    });

    // Get or create the current lottery draw
    const draw = await createOrGetNextDraw();

    // Use transaction to handle survey completion, potential referral reward, and auto-apply to lottery
    const result = await db.$transaction(async (tx) => {
      // Award survey ticket to the user and immediately apply to lottery
      const confirmationCode = nanoid(10);
      const newTicket = await tx.ticket.create({
        data: {
          userId: user.id,
          source: "SURVEY",
          isUsed: true, // Automatically mark as used since we're applying to lottery
          drawId: draw.id,
          confirmationCode: confirmationCode,
        },
      });

      console.log('🎫 Survey ticket created and applied to lottery:', {
        ticketId: newTicket.id,
        userId: user.id,
        drawId: draw.id,
        confirmationCode,
        transId,
      });

      // Update or create draw participation
      const existingParticipation = await tx.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: user.id,
            drawId: draw.id,
          },
        },
      });

      let totalUserTickets = 1;
      if (existingParticipation) {
        totalUserTickets = existingParticipation.ticketsUsed + 1;
        await tx.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: {
            ticketsUsed: totalUserTickets,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.drawParticipation.create({
          data: {
            userId: user.id,
            drawId: draw.id,
            ticketsUsed: 1,
          },
        });
      }

      // Update draw total tickets
      await tx.draw.update({
        where: { id: draw.id },
        data: {
          totalTickets: {
            increment: 1,
          },
        },
      });

      let referralTicketAwarded = false;
      let referralConfirmationCode = '';

      // If this is the user's first survey and they were referred, award referral ticket
      if (isFirstSurvey && user.referredBy) {
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
          // Award referral ticket to the referrer and apply to lottery
          referralConfirmationCode = nanoid(10);
          const referralTicket = await tx.ticket.create({
            data: {
              userId: user.referredBy,
              source: "REFERRAL",
              isUsed: true, // Automatically apply to lottery
              drawId: draw.id,
              confirmationCode: referralConfirmationCode,
            },
          });

          // Update referrer's draw participation
          const referrerParticipation = await tx.drawParticipation.findUnique({
            where: {
              userId_drawId: {
                userId: user.referredBy,
                drawId: draw.id,
              },
            },
          });

          if (referrerParticipation) {
            await tx.drawParticipation.update({
              where: { id: referrerParticipation.id },
              data: {
                ticketsUsed: referrerParticipation.ticketsUsed + 1,
                updatedAt: new Date(),
              },
            });
          } else {
            await tx.drawParticipation.create({
              data: {
                userId: user.referredBy,
                drawId: draw.id,
                ticketsUsed: 1,
              },
            });
          }

          // Update draw total tickets again for referral
          await tx.draw.update({
            where: { id: draw.id },
            data: {
              totalTickets: {
                increment: 1,
              },
            },
          });

          referralTicketAwarded = true;

          console.log('🎁 Referral ticket awarded and applied to lottery:', {
            referralTicketId: referralTicket.id,
            referrerId: user.referredBy,
            newUserId: user.id,
            drawId: draw.id,
            confirmationCode: referralConfirmationCode,
            transId,
          });
        } else {
          console.log('❌ Referrer not eligible (no survey tickets):', {
            referrerId: user.referredBy,
            referrerSurveyTickets,
          });
        }
      }

      // Email notification
      try {
        // Only send email for the first ticket
        if (isFirstSurvey && user.email) {
          await sendTicketApplicationEmail(
            user.email,
            {
              name: user.name || "User",
              ticketCount: 1,
              drawDate: draw.drawDate,
            }
          );
          console.log('📧 Survey completion email sent to:', user.email);
        }
      } catch (emailError) {
        console.error('📧 Failed to send survey completion email:', emailError);
      }

      return {
        userId: user.id,
        ticketId: newTicket.id,
        drawId: draw.id,
        totalUserTickets,
        isFirstSurvey,
      };
    });

    // Return success response
    return new NextResponse(JSON.stringify({
      success: true,
      message: "Survey completed and ticket awarded",
      data: result
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('💥 Error processing CPX postback:', error);
    
    // Return error response
    return new NextResponse(JSON.stringify({
      success: false,
      message: "Error processing survey completion",
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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