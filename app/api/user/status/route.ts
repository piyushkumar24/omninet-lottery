import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dbQueryWithRetry } from "@/lib/db-utils";
import logger from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Get complete user details
    const userRecord = await dbQueryWithRetry(
      () => db.user.findUnique({
        where: { id: user.id },
        select: { 
          socialMediaFollowed: true,
          availableTickets: true,
          totalTicketsEarned: true,
        },
      }),
      'getUserRecord'
    );

    // Get ticket counts by source
    const [surveyTicketCount, referralTicketCount, socialTicketCount] = await Promise.all([
      dbQueryWithRetry(
        () => db.ticket.count({
          where: {
            userId: user.id,
            source: "SURVEY",
          },
        }),
        'getSurveyTicketCount'
      ),
      dbQueryWithRetry(
        () => db.ticket.count({
          where: {
            userId: user.id,
            source: "REFERRAL",
          },
        }),
        'getReferralTicketCount'
      ),
      dbQueryWithRetry(
        () => db.ticket.count({
          where: {
            userId: user.id,
            source: "SOCIAL",
          },
        }),
        'getSocialTicketCount'
      ),
    ]);

    // Get successful referrals (users who signed up using this user's code)
    const referralCount = await dbQueryWithRetry(
      () => db.user.count({
        where: {
          referredBy: user.id,
        },
      }),
      'getReferralCount'
    );

    // Get detailed referral information
    const referrals = await dbQueryWithRetry(
      () => db.user.findMany({
        where: {
          referredBy: user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          tickets: {
            where: {
              source: "SURVEY",
            },
            select: {
              id: true,
              createdAt: true,
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      'getDetailedReferrals'
    );

    // Calculate how many referrals have completed surveys (and thus earned the referrer a ticket)
    const qualifiedReferrals = referrals.filter(referral => referral.tickets.length > 0);

    logger.debug(`User status: survey=${surveyTicketCount}, referral=${referralTicketCount}, social=${socialTicketCount}, referrals=${referralCount}, available=${userRecord?.availableTickets}, total=${userRecord?.totalTicketsEarned}`, 'API');

    return NextResponse.json({
      success: true,
      socialMediaFollowed: userRecord?.socialMediaFollowed || false,
      hasSurveyTicket: surveyTicketCount > 0,
      surveyTicketCount,
      referralTicketCount,
      socialTicketCount,
      // Use the actual available tickets from user record, which accounts for all sources
      availableTickets: userRecord?.availableTickets || 0,
      // Total tickets earned (lifetime)
      totalTicketsEarned: userRecord?.totalTicketsEarned || 0,
      // For backward compatibility
      totalTickets: surveyTicketCount + referralTicketCount + socialTicketCount,
      referralStats: {
        totalReferrals: referralCount,
        qualifiedReferrals: qualifiedReferrals.length,
        pendingReferrals: referralCount - qualifiedReferrals.length,
      },
      referrals: referrals.map(referral => ({
        id: referral.id,
        name: referral.name,
        email: referral.email,
        createdAt: referral.createdAt,
        hasCompletedSurvey: referral.tickets.length > 0,
        surveyCompletedAt: referral.tickets[0]?.createdAt || null,
      })),
    });
  } catch (error) {
    logger.error("Error getting user status", error, 'API');
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 }
    );
  }
} 