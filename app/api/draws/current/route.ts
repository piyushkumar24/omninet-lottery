import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // Get current user for authentication
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the current active draw
    const currentDraw = await db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
      },
      orderBy: {
        drawDate: "asc",
      },
    });

    if (!currentDraw) {
      return NextResponse.json({
        success: false,
        message: "No active draw found",
        totalTickets: 0,
        userTickets: 0
      });
    }

    // Get user's participation in the current draw
    const userParticipation = await db.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: user.id,
          drawId: currentDraw.id,
        },
      },
    });

    // Get the actual total tickets in the draw from all participations
    const totalParticipations = await db.drawParticipation.aggregate({
      where: {
        drawId: currentDraw.id,
      },
      _sum: {
        ticketsUsed: true,
      },
    });

    // Use the actual sum from participations
    let actualTotalTickets = totalParticipations._sum.ticketsUsed || 0;
    
    // If no participations yet, get available tickets for context
    if (actualTotalTickets === 0) {
      const availableTickets = await db.ticket.count({
        where: {
          isUsed: false,
        },
      });
      actualTotalTickets = availableTickets;
    }
    
    // Make sure we have at least 1 ticket in the draw to avoid division by zero
    const safeTicketCount = Math.max(actualTotalTickets, 1);
    
    // Get user's current participation tickets
    const userTicketsInDraw = userParticipation?.ticketsUsed || 0;
    
    // Get user's available tickets that could be applied to the draw
    const userAvailableTickets = await db.ticket.count({
      where: {
        userId: user.id,
        isUsed: false,
      }
    });

    // Return the draw data
    return NextResponse.json({
      success: true,
      id: currentDraw.id,
      drawDate: currentDraw.drawDate,
      prizeAmount: currentDraw.prizeAmount,
      totalTickets: safeTicketCount,
      status: currentDraw.status,
      userTickets: userTicketsInDraw,
      userAvailableTickets: userAvailableTickets,
      hasParticipations: (totalParticipations._sum.ticketsUsed || 0) > 0
    });
  } catch (error) {
    console.error("[DRAW_CURRENT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 