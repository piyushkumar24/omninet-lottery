import { NextRequest, NextResponse } from "next/server";
import { validateCPXPostbackHash } from "@/lib/cpx-utils";
import { db } from "@/lib/db";

/**
 * CPX Research Postback Handler
 * 
 * This endpoint receives notifications from CPX Research when a user completes a survey.
 * It validates the request and awards tickets to the user.
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

  // Log the postback for debugging
  console.log('CPX Postback received:', {
    status,
    transId,
    userId,
    amountUsd,
    hash,
    ipClick,
    offerId,
    subid,
    subid2,
  });

  // Validate required parameters
  if (!status || !transId || !userId || !hash) {
    console.error('Missing required parameters in CPX postback');
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  // Validate the secure hash
  if (!validateCPXPostbackHash(userId, hash)) {
    console.error('Invalid hash in CPX postback:', { userId, receivedHash: hash });
    return new NextResponse('Invalid hash', { status: 403 });
  }

  // Check if survey was completed successfully
  if (status !== '1') {
    console.log('Survey not completed (status !== 1):', status);
    return new NextResponse('Survey not completed', { status: 200 });
  }

  try {
    // Check if this transaction has already been processed by looking for existing tickets
    // We'll use a simple approach of checking if a ticket was recently created for this user
    const recentTicket = await db.ticket.findFirst({
      where: {
        userId: userId,
        source: "SURVEY",
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Within the last minute
        },
      },
    });

    if (recentTicket) {
      console.log('Recent survey ticket found - possible duplicate transaction:', transId);
      return new NextResponse('Possible duplicate transaction', { status: 200 });
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
      console.error('User not found:', userId);
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if this is the user's first survey
    const existingSurveyTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
      },
    });

    const isFirstSurvey = existingSurveyTickets === 0;

    // Use transaction to handle both survey completion and potential referral reward
    await db.$transaction(async (tx) => {
      // Award survey ticket to the user
      await tx.ticket.create({
        data: {
          userId: user.id,
          source: "SURVEY",
          isUsed: false,
        },
      });

      // If this is the user's first survey and they were referred, award referral ticket
      if (isFirstSurvey && user.referredBy) {
        // Check if the referrer has completed at least one survey (required for referral system)
        const referrerSurveyTickets = await tx.ticket.count({
          where: {
            userId: user.referredBy,
            source: "SURVEY",
          },
        });

        if (referrerSurveyTickets > 0) {
          // Award referral ticket to the referrer
          await tx.ticket.create({
            data: {
              userId: user.referredBy,
              source: "REFERRAL",
              isUsed: false,
            },
          });

          console.log('Referral ticket awarded to:', user.referredBy);
        }
      }
    });

    console.log('Survey completion processed successfully:', {
      userId: user.id,
      transId,
      isFirstSurvey,
      referredBy: user.referredBy,
      amountUsd,
    });

    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error('Error processing CPX postback:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Handle POST requests as well (some providers send POST)
export async function POST(request: NextRequest) {
  return GET(request);
} 