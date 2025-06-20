import { NextRequest, NextResponse } from "next/server";
import { db, withTransaction } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole, DrawStatus } from "@prisma/client";
import { resetAllAvailableTickets } from "@/lib/ticket-utils";

/**
 * Reset lottery after draw completion
 * This should be called after each lottery draw to:
 * 1. Reset all users' available tickets to 0
 * 2. Mark the draw as completed
 * 3. Prepare for the next lottery
 * 
 * If no drawId is provided, it will only reset all users' available tickets
 * without marking any draw as completed.
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

    const requestData = await request.json().catch(() => ({}));
    const { drawId } = requestData;

    // If drawId is provided, do a full lottery reset
    // Otherwise, just reset all tickets
    const isFullReset = !!drawId;

    console.log(`🔄 ${isFullReset ? 'Starting lottery reset for draw ' + drawId : 'Resetting all active tickets'}`);

    const result = await withTransaction(async (tx) => {
      // Get count of users that will be reset
      const usersToReset = await tx.user.count({
        where: {
          availableTickets: { gt: 0 }
        }
      });

      // Reset all users' available tickets to 0
      await tx.user.updateMany({
        where: {
          availableTickets: { gt: 0 }
        },
        data: {
          availableTickets: 0
        }
      });

      // If doing a full reset, mark the draw as completed
      if (isFullReset && drawId) {
        await tx.draw.update({
          where: { id: drawId },
          data: { 
            status: DrawStatus.COMPLETED,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Draw ${drawId} marked as COMPLETED`);
      }

      // Get the active draw (whether doing full reset or ticket-only reset)
      const activeDraw = await tx.draw.findFirst({
        where: { 
          status: isFullReset ? { not: DrawStatus.COMPLETED } : DrawStatus.PENDING 
        },
        orderBy: { createdAt: 'desc' }
      });

      // If we have an active draw, reset all participation records for it
      if (activeDraw) {
        console.log(`🔄 Resetting participation records for active draw ${activeDraw.id}`);
        
        // Update all participation records to have 0 tickets
        await tx.drawParticipation.updateMany({
          where: { 
            drawId: activeDraw.id,
            ticketsUsed: { gt: 0 }
          },
          data: {
            ticketsUsed: 0
          }
        });
        
        // Count how many participation records were reset
        const participationResetCount = await tx.drawParticipation.count({
          where: { drawId: activeDraw.id }
        });
        
        console.log(`✅ Reset ${participationResetCount} participation records to 0 tickets`);
      }

      // Get stats for response
      const totalUsers = await tx.user.count();
      const totalTicketsEarnedAllTime = await tx.user.aggregate({
        _sum: { totalTicketsEarned: true }
      });

      console.log(`✅ ${isFullReset ? 'Lottery reset' : 'Ticket reset'} completed:`);
      console.log(`   - Reset available tickets for ${usersToReset} users`);
      console.log(`   - Total users: ${totalUsers}`);
      console.log(`   - Total tickets earned all time: ${totalTicketsEarnedAllTime._sum.totalTicketsEarned || 0}`);

      return {
        drawId: isFullReset ? drawId : null,
        drawStatus: isFullReset ? DrawStatus.COMPLETED : null,
        usersReset: usersToReset,
        totalUsers,
        totalTicketsEarnedAllTime: totalTicketsEarnedAllTime._sum.totalTicketsEarned || 0,
      };
    }, {
      timeout: 10000, // 10 second timeout for this operation
      maxWait: 3000,  // 3 second max wait
    });

    return NextResponse.json({
      success: true,
      message: isFullReset 
        ? `Successfully reset lottery after draw completion`
        : `Successfully reset all active tickets`,
      data: result
    });

  } catch (error) {
    console.error("❌ Error resetting lottery:", error);
    
    // Handle specific transaction timeout errors
    if (error instanceof Error && (error.message.includes("timed out") || error.message.includes("timeout"))) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Reset operation timed out. Please try again.",
        }),
        { status: 408 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Failed to reset lottery",
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

    // Get statistics about tickets and users
    const [
      totalAvailableTickets,
      totalEarnedTickets,
      usersWithAvailableTickets,
      totalUsers
    ] = await Promise.all([
      db.user.aggregate({
        _sum: { availableTickets: true }
      }),
      db.user.aggregate({
        _sum: { totalTicketsEarned: true }
      }),
      db.user.count({
        where: {
          availableTickets: { gt: 0 }
        }
      }),
      db.user.count()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalAvailableTickets: totalAvailableTickets._sum.availableTickets || 0,
        totalEarnedTickets: totalEarnedTickets._sum.totalTicketsEarned || 0,
        usersWithAvailableTickets,
        totalUsers,
      }
    });

  } catch (error) {
    console.error("Error fetching lottery reset stats:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 