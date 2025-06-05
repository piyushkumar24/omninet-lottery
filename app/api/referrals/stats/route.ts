import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Get fresh user data with ticket information
    const userWithTickets = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        availableTickets: true,
        totalTicketsEarned: true,
      }
    });

    // Fetch referrals for this user
    const referrals = await db.user.findMany({
      where: { referredBy: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tickets: {
          where: { source: 'SURVEY' },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count referral tickets earned from successful referrals
    const referralTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: 'REFERRAL'
      }
    });

    const qualifiedReferrals = referrals.filter(ref => ref.tickets.length > 0);
    const pendingReferrals = referrals.filter(ref => ref.tickets.length === 0);

    const referralStats = {
      totalReferrals: referrals.length,
      qualifiedReferrals: qualifiedReferrals.length,
      pendingReferrals: pendingReferrals.length,
      referralTicketsEarned: referralTickets
    };

    // Map referrals to the expected format
    const mappedReferrals = referrals.map(ref => ({
      id: ref.id,
      name: ref.name || 'Anonymous',
      email: ref.email || '',
      joinedAt: ref.createdAt.toISOString(),
      hasCompletedSurvey: ref.tickets.length > 0,
      surveyCompletedAt: ref.tickets.length > 0 ? ref.createdAt.toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      data: {
        availableTickets: userWithTickets?.availableTickets || 0,
        totalTicketsEarned: userWithTickets?.totalTicketsEarned || 0,
        referralStats,
        referrals: mappedReferrals
      }
    });

  } catch (error) {
    console.error("Error fetching referral stats:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
} 