import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserAppliedTickets, getUserTotalTickets } from "@/lib/ticket-utils";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Enhanced Ticket Verification Endpoint
 * 
 * This endpoint provides detailed information about a user's tickets,
 * bypassing all caching to ensure fresh data is returned.
 */
export async function GET(request: NextRequest) {
  try {
    // Timestamp for tracking performance
    const requestId = nanoid(6);
    const startTime = Date.now();
    console.log(`[${requestId}] Starting ticket verification at ${new Date().toISOString()}`);
    
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Get current active draw
    const currentDraw = await createOrGetNextDraw();
    
    // Get user's participation in current draw
    const userParticipation = await db.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: user.id,
          drawId: currentDraw.id,
        },
      },
    });
    
    // Get total tickets and breakdown by source
    const [totalTickets, surveyTickets, socialTickets, referralTickets] = await Promise.all([
      db.ticket.count({
        where: { userId: user.id },
      }),
      db.ticket.count({
        where: { userId: user.id, source: "SURVEY" },
      }),
      db.ticket.count({
        where: { userId: user.id, source: "SOCIAL" },
      }),
      db.ticket.count({
        where: { userId: user.id, source: "REFERRAL" },
      }),
    ]);
    
    // Get recent tickets with detailed information
    const recentTickets = await db.ticket.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    
    // Applied tickets is from current draw participation
    const appliedTickets = userParticipation?.ticketsUsed || 0;
    
    // Format recent tickets with time information
    const formattedRecentTickets = recentTickets.map(ticket => ({
      id: ticket.id,
      source: ticket.source,
      createdAt: ticket.createdAt,
      isUsed: ticket.isUsed,
      drawId: ticket.drawId,
      timeAgo: getTimeAgo(ticket.createdAt),
    }));
    
    const endTime = Date.now();
    console.log(`[${requestId}] Ticket verification completed in ${endTime - startTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        appliedTickets,
        totalTickets,
        surveyTickets,
        socialTickets,
        referralTickets,
        userParticipation: userParticipation ? {
          ticketsUsed: userParticipation.ticketsUsed,
          participatedAt: userParticipation.participatedAt,
        } : null,
        currentDraw: {
          id: currentDraw.id,
          drawDate: currentDraw.drawDate,
          totalTickets: currentDraw.totalTickets,
        },
        recentTickets: formattedRecentTickets,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in ticket verification:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
}

/**
 * Helper function to get human-readable time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Force Ticket Verification & Award Endpoint
 * 
 * This endpoint fixes any discrepancies between tickets and draw participation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Get all user tickets
    const tickets = await db.ticket.findMany({
      where: { 
        userId: user.id,
        isUsed: true,
      },
      select: {
        id: true,
        drawId: true,
      }
    });

    // Get current draw
    const currentDraw = await db.draw.findFirst({
      where: { status: "PENDING" },
      orderBy: { drawDate: 'asc' },
    });

    if (!currentDraw) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "No active draw found",
        }),
        { status: 404 }
      );
    }

    // Count tickets per draw
    const ticketsByDraw = tickets.reduce((acc, ticket) => {
      if (ticket.drawId) {
        acc[ticket.drawId] = (acc[ticket.drawId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get all user participations
    const participations = await db.drawParticipation.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        drawId: true,
        ticketsUsed: true,
      }
    });

    // Calculate total tickets from both sources
    const totalTickets = tickets.length;
    const totalParticipationTickets = participations.reduce(
      (sum, p) => sum + p.ticketsUsed, 0
    );

    // Fix discrepancies
    const fixedDraws = [];
    
    // 1. First, update existing participations to match actual ticket counts
    for (const [drawId, ticketCount] of Object.entries(ticketsByDraw)) {
      // Get existing participation
      const participation = participations.find(p => p.drawId === drawId);

      if (!participation) {
        // Create missing participation
        await db.drawParticipation.create({
          data: {
            userId: user.id,
            drawId,
            ticketsUsed: ticketCount,
          },
        });
        fixedDraws.push({ drawId, action: 'created', ticketCount });
      } else if (participation.ticketsUsed !== ticketCount) {
        // Fix incorrect ticket count
        await db.drawParticipation.update({
          where: { id: participation.id },
          data: { ticketsUsed: ticketCount },
        });
        fixedDraws.push({ 
          drawId, 
          action: 'updated', 
          oldCount: participation.ticketsUsed, 
          newCount: ticketCount 
        });
      }
    }

    // 2. Check for orphaned participations (no matching tickets)
    for (const participation of participations) {
      const actualTicketCount = ticketsByDraw[participation.drawId] || 0;
      
      if (actualTicketCount === 0) {
        // This participation has no matching tickets
        await db.drawParticipation.delete({
          where: { id: participation.id }
        });
        
        fixedDraws.push({
          drawId: participation.drawId,
          action: 'deleted_orphaned',
          oldCount: participation.ticketsUsed
        });
      }
    }

    // 3. Create missing draw participation for the current draw if needed
    let currentDrawParticipation = participations.find(
      p => p.drawId === currentDraw.id
    );
    
    if (!currentDrawParticipation && totalTickets > 0) {
      // Make sure user has a participation in the current draw
      // This ensures they show up in the dashboard
      const emergencyTicket = await db.ticket.create({
        data: {
          userId: user.id,
          source: "SURVEY",
          isUsed: true,
          drawId: currentDraw.id,
          confirmationCode: `emergency_verify_${Date.now()}`,
        },
      });

      // Create participation
      await db.drawParticipation.create({
        data: {
          userId: user.id,
          drawId: currentDraw.id,
          ticketsUsed: 1,
        },
      });

      // Update draw total tickets
      await db.draw.update({
        where: { id: currentDraw.id },
        data: {
          totalTickets: {
            increment: 1,
          },
        },
      });

      // Log emergency ticket
      await db.settings.create({
        data: {
          key: `emergency_verify_${emergencyTicket.id}`,
          value: JSON.stringify({
            userId: user.id,
            ticketId: emergencyTicket.id,
            timestamp: new Date().toISOString(),
          }),
          description: "Emergency ticket awarded during verification",
        },
      });

      fixedDraws.push({ 
        drawId: currentDraw.id, 
        action: 'emergency_ticket_awarded',
        ticketId: emergencyTicket.id,
      });
    }

    // Re-check final counts after all fixes
    const updatedTickets = await db.ticket.count({
      where: { userId: user.id }
    });
    
    const updatedParticipations = await db.drawParticipation.findMany({
      where: { userId: user.id },
      select: { ticketsUsed: true }
    });
    
    const updatedParticipationTotal = updatedParticipations.reduce(
      (sum, p) => sum + p.ticketsUsed, 0
    );

    return NextResponse.json({
      success: true,
      message: fixedDraws.length > 0 
        ? "Ticket verification and fixes completed" 
        : "No ticket discrepancies found",
      data: {
        userId: user.id,
        originalTickets: totalTickets,
        originalParticipation: totalParticipationTickets,
        currentTickets: updatedTickets,
        currentParticipation: updatedParticipationTotal,
        fixedDraws,
        updatedDraws: fixedDraws.length,
      },
    });
  } catch (error) {
    console.error("Error verifying and fixing tickets:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
} 