import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 403 }
      );
    }
    
    // Get total users
    const totalUsers = await db.user.count();
    
    // Get users active in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const activeUsers = await db.user.count({
      where: {
        updatedAt: {
          gte: oneWeekAgo
        }
      }
    });
    
    // Get ticket stats
    const totalTickets = await db.ticket.count();
    const activeTickets = await db.ticket.count({
      where: {
        isUsed: false
      }
    });
    
    // Get tickets by source
    const surveyTickets = await db.ticket.count({
      where: {
        source: "SURVEY"
      }
    });
    
    const referralTickets = await db.ticket.count({
      where: {
        source: "REFERRAL"
      }
    });
    
    const socialTickets = await db.ticket.count({
      where: {
        source: "SOCIAL"
      }
    });
    
    // Get winner stats
    const totalWinners = await db.winner.count();
    const unclaimedPrizes = await db.winner.count({
      where: {
        claimed: false
      }
    });
    
    // Calculate total prize amount
    const totalPrizeAmount = await db.winner.aggregate({
      _sum: {
        prizeAmount: true
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          activeThisWeek: activeUsers
        },
        tickets: {
          total: totalTickets,
          active: activeTickets,
          bySources: {
            survey: surveyTickets,
            referral: referralTickets,
            social: socialTickets
          }
        },
        winners: {
          total: totalWinners,
          unclaimedPrizes,
          totalPrizeAmount: totalPrizeAmount._sum.prizeAmount || 0
        }
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 