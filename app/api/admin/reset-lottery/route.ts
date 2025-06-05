import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { resetAllAvailableTickets } from "@/lib/ticket-utils";

/**
 * Reset lottery after draw completion
 * This should be called after each lottery draw to:
 * 1. Reset all users' available tickets to 0
 * 2. Mark the draw as completed
 * 3. Prepare for the next lottery
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin privileges
    const role = await currentRole();
    
    if (role !== UserRole.ADMIN) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized: Admin access required",
        }),
        { status: 401 }
      );
    }

    const requestData = await request.json();
    const { drawId } = requestData;

    if (!drawId) {
      return NextResponse.json({
        success: false,
        message: "Draw ID is required",
      }, { status: 400 });
    }

    console.log(`🔄 Starting lottery reset for draw ${drawId}`);

    const result = await db.$transaction(async (tx) => {
      // 1. Mark the draw as completed
      const draw = await tx.draw.update({
        where: { id: drawId },
        data: { status: 'COMPLETED' }
      });

      // 2. Reset all users' available tickets to 0
      const resetCount = await resetAllAvailableTickets();

      // 3. Get stats for response
      const totalUsers = await tx.user.count();
      const totalTicketsEarnedAllTime = await tx.user.aggregate({
        _sum: { totalTicketsEarned: true }
      });

      console.log(`✅ Lottery reset completed:`);
      console.log(`   - Draw ${drawId} marked as COMPLETED`);
      console.log(`   - Reset available tickets for ${resetCount} users`);
      console.log(`   - Total users: ${totalUsers}`);
      console.log(`   - Total tickets earned all time: ${totalTicketsEarnedAllTime._sum.totalTicketsEarned || 0}`);

      return {
        drawId: draw.id,
        drawStatus: draw.status,
        usersReset: resetCount,
        totalUsers,
        totalTicketsEarnedAllTime: totalTicketsEarnedAllTime._sum.totalTicketsEarned || 0,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reset lottery after draw completion`,
      data: result
    });

  } catch (error) {
    console.error("❌ Error resetting lottery:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}

/**
 * Get lottery reset status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin privileges
    const role = await currentRole();
    
    if (role !== UserRole.ADMIN) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized: Admin access required",
        }),
        { status: 401 }
      );
    }

    // Get current state of the lottery system
    const [totalUsers, usersWithAvailableTickets, totalAvailableTickets, totalEarnedTickets, activeDraw] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: { availableTickets: { gt: 0 } }
      }),
      db.user.aggregate({
        _sum: { availableTickets: true }
      }),
      db.user.aggregate({
        _sum: { totalTicketsEarned: true }
      }),
      db.draw.findFirst({
        where: { status: 'PENDING' },
        orderBy: { drawDate: 'asc' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        usersWithAvailableTickets,
        totalAvailableTickets: totalAvailableTickets._sum.availableTickets || 0,
        totalEarnedTickets: totalEarnedTickets._sum.totalTicketsEarned || 0,
        activeDraw: activeDraw ? {
          id: activeDraw.id,
          drawDate: activeDraw.drawDate,
          status: activeDraw.status,
          totalTickets: activeDraw.totalTickets
        } : null,
        lastResetNeeded: usersWithAvailableTickets > 0 && !activeDraw
      }
    });

  } catch (error) {
    console.error("Error getting lottery reset status:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
} 