import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetWinnerTickets } from "@/lib/ticket-utils";
import { sendNonWinnerEmail } from "@/lib/mail";

/**
 * Mark User as Winner Endpoint
 * 
 * This endpoint allows admins to mark a user as a winner and reset all their tickets
 */
export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized. Only administrators can access this endpoint.",
        }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, drawId } = body;

    if (!userId || !drawId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Missing required parameters: userId and drawId",
        }),
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "User not found",
        }),
        { status: 404 }
      );
    }

    // Check if draw exists
    const draw = await db.draw.findUnique({
      where: { id: drawId },
      select: { id: true, status: true, prizeAmount: true, drawDate: true }
    });

    if (!draw) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Draw not found",
        }),
        { status: 404 }
      );
    }

    // Check if user has a participation record for this draw
    const participation = await db.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId: userId,
          drawId: drawId,
        }
      }
    });

    if (!participation) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "User did not participate in this draw",
        }),
        { status: 400 }
      );
    }

    // Mark user as winner
    await db.$transaction(async (tx) => {
      // Create winner record
      const winner = await tx.winner.create({
        data: {
          userId: userId,
          ticketCount: participation.ticketsUsed,
          prizeAmount: draw.prizeAmount,
          drawDate: new Date(),
          claimed: false,
        }
      });

      // Update participation record
      await tx.drawParticipation.update({
        where: { id: participation.id },
        data: { isWinner: true }
      });

      // Update user record
      await tx.user.update({
        where: { id: userId },
        data: { hasWon: true }
      });

      // Update draw record
      await tx.draw.update({
        where: { id: drawId },
        data: { winnerId: userId }
      });

      // Log the action
      await tx.settings.create({
        data: {
          key: `manual_winner_${userId}_${drawId}`,
          value: JSON.stringify({
            userId,
            drawId,
            winnerId: winner.id,
            timestamp: new Date().toISOString(),
          }),
          description: "User manually marked as winner by admin"
        }
      });
    });

    // Reset ALL tickets for the winner
    const resetCount = await resetWinnerTickets(userId);

    // Send non-winner emails to all participants who didn't win
    try {
      // Get all participants for this draw
      const participants = await db.drawParticipation.findMany({
        where: {
          drawId: drawId,
          userId: {
            not: userId // Exclude the winner
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      console.log(`Sending non-winner emails to ${participants.length} participants`);
      
      // Send emails in parallel (don't wait for all to complete)
      const emailPromises = participants.map(async (participant) => {
        if (participant.user.email) {
          try {
            await sendNonWinnerEmail(
              participant.user.email,
              participant.user.name || "User",
              draw.drawDate,
              participant.userId
            );
            console.log(`Non-winner email sent to ${participant.user.email}`);
          } catch (emailError) {
            console.error(`Failed to send non-winner email to ${participant.user.email}:`, emailError);
          }
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
      message: "User successfully marked as winner",
      data: {
        userId,
        drawId,
        ticketsReset: resetCount
      }
    });
  } catch (error) {
    console.error("Error marking user as winner:", error);
    
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