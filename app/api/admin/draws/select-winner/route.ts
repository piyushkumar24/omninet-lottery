import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized. Only administrators can select winners.",
        }),
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required to select a winner.",
      }, { status: 400 });
    }
    
    // Get the current active draw
    const activeDraw = await db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
        drawDate: {
          gte: new Date(),
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
        message: "No active draw found. Please create a draw first.",
      });
    }

    // Find the selected user's participation
    const selectedParticipation = activeDraw.participants.find(
      p => p.userId === userId
    );

    if (!selectedParticipation) {
      return NextResponse.json({
        success: false,
        message: "The selected user has not participated in the current draw.",
      }, { status: 400 });
    }

    // Use database transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Get the selected user's details
      const selectedUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      });

      if (!selectedUser) {
        throw new Error("Selected user not found");
      }

      // Create a winner record
      const winner = await tx.winner.create({
        data: {
          userId: selectedUser.id,
          ticketCount: selectedParticipation.ticketsUsed,
          prizeAmount: activeDraw.prizeAmount,
          drawDate: new Date(),
          claimed: false,
        },
      });

      // Update the winner's participation record
      await tx.drawParticipation.update({
        where: { id: selectedParticipation.id },
        data: { isWinner: true },
      });

      // Mark the draw as completed
      await tx.draw.update({
        where: { id: activeDraw.id },
        data: { 
          status: DrawStatus.COMPLETED,
          winnerId: selectedUser.id,
        },
      });

      return {
        winner,
        winnerUser: selectedUser,
        participantCount: activeDraw.participants.length,
        totalTicketsInDraw: activeDraw.totalTickets,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Winner selected successfully!",
      winner: {
        id: result.winnerUser.id,
        name: result.winnerUser.name,
        email: result.winnerUser.email,
        image: result.winnerUser.image,
        ticketCount: result.winner.ticketCount,
        prizeAmount: result.winner.prizeAmount,
        winnerId: result.winner.id
      },
      drawStats: {
        participantCount: result.participantCount,
        totalTicketsInDraw: result.totalTicketsInDraw,
        drawDate: result.winner.drawDate,
      },
    });
  } catch (error) {
    console.error("Error selecting winner:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while selecting the winner.",
      }),
      { status: 500 }
    );
  }
} 