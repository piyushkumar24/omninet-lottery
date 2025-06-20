import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log(`[LOTTERY_STATUS] Fetching lottery status for user ${user.id}`);

    // Get current active draw
    const currentDraw = await db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
      },
      orderBy: {
        drawDate: "asc",
      },
    });

    if (!currentDraw) {
      console.log(`[LOTTERY_STATUS] No active draw found`);
      return NextResponse.json({
        success: false,
        message: "No active draw found",
        data: {
          userTicketsInDraw: 0,
          userAvailableTickets: 0,
          totalTicketsInDraw: 0,
          winningChancePercent: 0,
          drawId: null,
          hasParticipation: false,
        }
      });
    }

    console.log(`[LOTTERY_STATUS] Found active draw: ${currentDraw.id}`);

    // Get user's participation in current draw
    const userParticipation = await db.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: user.id,
          drawId: currentDraw.id,
        },
      },
    });

    console.log(`[LOTTERY_STATUS] User participation found: ${!!userParticipation}`);
    if (userParticipation) {
      console.log(`[LOTTERY_STATUS] User tickets in draw: ${userParticipation.ticketsUsed}`);
    }

    // Get user's available tickets
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: {
        availableTickets: true,
        totalTicketsEarned: true,
      },
    });

    console.log(`[LOTTERY_STATUS] User available tickets: ${userRecord?.availableTickets || 0}`);

    // Calculate total tickets in current draw from all participations with tickets > 0
    const totalParticipations = await db.drawParticipation.aggregate({
      where: {
        drawId: currentDraw.id,
        ticketsUsed: { gt: 0 },
      },
      _sum: {
        ticketsUsed: true,
      },
    });

    // Get tickets that are specifically applied to the current draw
    const userTicketsInDraw = userParticipation?.ticketsUsed || 0;
    const userAvailableTickets = userRecord?.availableTickets || 0;
    const totalTicketsInDraw = totalParticipations._sum.ticketsUsed || 0;

    console.log(`[LOTTERY_STATUS] Total tickets in draw: ${totalTicketsInDraw}`);

    // Calculate winning chance percentage
    let winningChancePercent = 0;
    if (userTicketsInDraw > 0 && totalTicketsInDraw > 0) {
      winningChancePercent = (userTicketsInDraw / totalTicketsInDraw) * 100;
      // Ensure minimum 0.1% for users with tickets
      winningChancePercent = Math.max(winningChancePercent, 0.1);
      // Cap at 100%
      winningChancePercent = Math.min(winningChancePercent, 100);
    }

    console.log(`[LOTTERY_STATUS] User winning chance: ${winningChancePercent}%`);

    // Force clear any cached data by adding a timestamp
    const timestamp = Date.now();
    
    return NextResponse.json({
      success: true,
      timestamp,
      data: {
        userTicketsInDraw,
        userAvailableTickets,
        userTotalTicketsEarned: userRecord?.totalTicketsEarned || 0,
        totalTicketsInDraw,
        winningChancePercent,
        drawId: currentDraw.id,
        drawDate: currentDraw.drawDate,
        prizeAmount: currentDraw.prizeAmount,
        hasParticipation: userTicketsInDraw > 0,
      }
    });
  } catch (error) {
    console.error("[DASHBOARD_LOTTERY_STATUS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 