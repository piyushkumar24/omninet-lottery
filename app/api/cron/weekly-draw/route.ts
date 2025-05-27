import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // Check for secret token to ensure this is a valid request
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    if (secret !== process.env.CRON_SECRET) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }
    
    // Get the current active draw that should be completed
    const activeDraw = await db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
        drawDate: {
          lte: new Date(), // Draw date has passed
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        drawDate: 'asc',
      },
    });

    if (!activeDraw) {
      return NextResponse.json({
        success: false,
        message: "No active draw found to process",
      });
    }

    // Check if anyone has actually participated
    if (activeDraw.participants.length === 0) {
      // Mark draw as cancelled if no one participated
      await db.draw.update({
        where: { id: activeDraw.id },
        data: { status: DrawStatus.CANCELLED },
      });

      return NextResponse.json({
        success: false,
        message: "Draw cancelled: No users participated in this lottery",
      });
    }

    // Get all tickets that were used for this specific draw
    const participationTickets = await db.ticket.findMany({
      where: {
        drawId: activeDraw.id,
        isUsed: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (participationTickets.length === 0) {
      // Mark draw as cancelled if no valid tickets
      await db.draw.update({
        where: { id: activeDraw.id },
        data: { status: DrawStatus.CANCELLED },
      });

      return NextResponse.json({
        success: false,
        message: "Draw cancelled: No valid participation tickets found",
      });
    }

    // Use database transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Select a random winning ticket from participation tickets only
      const winningTicketIndex = Math.floor(Math.random() * participationTickets.length);
      const winningTicket = participationTickets[winningTicketIndex];
      
      // Get the winning user's participation details
      const winnerParticipation = activeDraw.participants.find(
        p => p.userId === winningTicket.userId
      );

      if (!winnerParticipation) {
        throw new Error("Winner participation not found");
      }

      // Create a winner record
      const winner = await tx.winner.create({
        data: {
          userId: winningTicket.userId,
          ticketCount: winnerParticipation.ticketsUsed,
          prizeAmount: activeDraw.prizeAmount,
          drawDate: new Date(),
          claimed: false,
        },
      });

      // Update the winner's participation record
      await tx.drawParticipation.update({
        where: { id: winnerParticipation.id },
        data: { isWinner: true },
      });

      // Mark the draw as completed
      await tx.draw.update({
        where: { id: activeDraw.id },
        data: { 
          status: DrawStatus.COMPLETED,
          winnerId: winningTicket.userId,
        },
      });

      return {
        winner,
        winnerUser: winningTicket.user,
        participantCount: activeDraw.participants.length,
        totalTicketsInDraw: activeDraw.totalTickets,
      };
    });
    
    return NextResponse.json({
      success: true,
      message: "Weekly draw completed successfully",
      winner: {
        name: result.winnerUser.name,
        email: result.winnerUser.email,
        ticketCount: result.winner.ticketCount,
        prizeAmount: result.winner.prizeAmount,
      },
      drawStats: {
        participantCount: result.participantCount,
        totalTicketsInDraw: result.totalTicketsInDraw,
        drawDate: result.winner.drawDate,
      },
    });
  } catch (error) {
    console.error("Error running weekly draw:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 