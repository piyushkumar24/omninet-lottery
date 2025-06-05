import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * Synchronize ticket data to fix any discrepancies between
 * the dashboard and admin panel.
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
    const { userId } = requestData;

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required",
      }, { status: 400 });
    }

    // Get user information
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        availableTickets: true,
        totalTicketsEarned: true,
        tickets: {
          select: {
            id: true,
            source: true,
            isUsed: true,
            drawId: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      }, { status: 404 });
    }

    // Calculate actual ticket counts from ticket records
    const unusedTickets = user.tickets.filter(ticket => !ticket.isUsed && !ticket.drawId).length;
    const totalTickets = user.tickets.length;

    // Check if there's a discrepancy
    const availableTicketsDiscrepancy = user.availableTickets !== unusedTickets;
    const totalTicketsDiscrepancy = user.totalTicketsEarned !== totalTickets;

    console.log(`Ticket sync for user ${userId}:`, {
      currentAvailable: user.availableTickets,
      actualUnused: unusedTickets,
      availableDiscrepancy: availableTicketsDiscrepancy,
      currentTotal: user.totalTicketsEarned,
      actualTotal: totalTickets,
      totalDiscrepancy: totalTicketsDiscrepancy
    });

    // Update user if there's a discrepancy
    if (availableTicketsDiscrepancy || totalTicketsDiscrepancy) {
      await db.user.update({
        where: { id: userId },
        data: {
          availableTickets: unusedTickets,
          totalTicketsEarned: totalTickets,
        }
      });

      return NextResponse.json({
        success: true,
        message: "Ticket data synchronized successfully",
        data: {
          previousAvailable: user.availableTickets,
          newAvailable: unusedTickets,
          previousTotal: user.totalTicketsEarned,
          newTotal: totalTickets,
          changes: {
            availableTickets: availableTicketsDiscrepancy,
            totalTickets: totalTicketsDiscrepancy
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Ticket data is already in sync",
      data: {
        availableTickets: user.availableTickets,
        totalTicketsEarned: user.totalTicketsEarned,
        changes: {
          availableTickets: false,
          totalTickets: false
        }
      }
    });
  } catch (error) {
    console.error("Error synchronizing ticket data:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
}

/**
 * Sync all users' ticket data
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

    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        availableTickets: true,
        totalTicketsEarned: true,
      }
    });

    // Sync count for each user
    const results = [];
    for (const user of users) {
      // Count tickets for this user
      const ticketCounts = await db.ticket.groupBy({
        by: ['isUsed'],
        where: { userId: user.id },
        _count: { id: true },
      });

      // Calculate actual ticket counts
      const totalTickets = ticketCounts.reduce((sum, group) => sum + group._count.id, 0);
      const unusedTickets = ticketCounts.find(g => !g.isUsed)?._count.id || 0;

      // Check if there's a discrepancy
      const availableTicketsDiscrepancy = user.availableTickets !== unusedTickets;
      const totalTicketsDiscrepancy = user.totalTicketsEarned !== totalTickets;

      // Update user if there's a discrepancy
      if (availableTicketsDiscrepancy || totalTicketsDiscrepancy) {
        await db.user.update({
          where: { id: user.id },
          data: {
            availableTickets: unusedTickets,
            totalTicketsEarned: totalTickets,
          }
        });

        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          changes: {
            availableTickets: {
              before: user.availableTickets,
              after: unusedTickets
            },
            totalTickets: {
              before: user.totalTicketsEarned,
              after: totalTickets
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronized ticket data for ${results.length} users`,
      data: {
        totalUsers: users.length,
        usersUpdated: results.length,
        updates: results
      }
    });
  } catch (error) {
    console.error("Error synchronizing all users' ticket data:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
} 