import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";
import { sendNonWinnerEmail } from "@/lib/mail";
import { resetUserTicketsForNextLottery } from "@/lib/ticket-utils";

export async function POST() {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized. Only administrators can trigger draws.",
        }),
        { status: 403 }
      );
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

    // Check if anyone has actually participated
    if (activeDraw.participants.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Cannot run lottery draw: No users have participated in this lottery. At least 1 user must manually participate to run the draw.",
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
      return NextResponse.json({
        success: false,
        message: "No valid participation tickets found for this draw.",
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
        winnerId: winningTicket.userId,
      };
    });

    // Reset tickets for non-winners so they can participate in the next lottery
    try {
      const nonWinnerUserIds = activeDraw.participants
        .filter(p => p.userId !== result.winnerId)
        .map(p => p.userId);
      
      console.log(`Resetting tickets for ${nonWinnerUserIds.length} non-winners`);
      
      // Process in parallel
      const resetPromises = nonWinnerUserIds.map(async (userId) => {
        try {
          const resetCount = await resetUserTicketsForNextLottery(userId);
          console.log(`Reset ${resetCount} tickets for user ${userId}`);
          return resetCount;
        } catch (resetError) {
          console.error(`Failed to reset tickets for user ${userId}:`, resetError);
          return 0;
        }
      });
      
      // Wait for all resets to complete
      await Promise.all(resetPromises);
    } catch (error) {
      console.error("Error resetting non-winner tickets:", error);
      // Don't fail the entire operation if ticket reset fails
    }

    // Send non-winner emails to all participants who didn't win
    try {
      const nonWinners = activeDraw.participants.filter(
        p => p.userId !== result.winnerId && p.user.email
      );
      
      console.log(`Sending non-winner emails to ${nonWinners.length} participants`);
      
      // Send emails in parallel (don't wait for all to complete)
      const emailPromises = nonWinners.map(async (participant) => {
        try {
          await sendNonWinnerEmail(
            participant.user.email!,
            participant.user.name || "User",
            activeDraw.drawDate,
            participant.userId
          );
          console.log(`Non-winner email sent to ${participant.user.email}`);
        } catch (emailError) {
          console.error(`Failed to send non-winner email to ${participant.user.email}:`, emailError);
        }
      });
      
      // Don't await all emails - let them send in background
      Promise.allSettled(emailPromises);
    } catch (error) {
      console.error("Error sending non-winner emails:", error);
      // Don't fail the entire operation if emails fail
    }

    return NextResponse.json({
      success: true,
      message: "Lottery draw completed successfully!",
      winner: {
        name: result.winnerUser.name,
        email: result.winnerUser.email,
        image: result.winnerUser.image,
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
    console.error("Error running manual draw:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while running the draw.",
      }),
      { status: 500 }
    );
  }
} 