import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";
import { sendNonWinnerEmail, sendWinnerNotificationEmail } from "@/lib/mail";
import { resetAllAvailableTickets } from "@/lib/ticket-utils";

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

    console.log(`[SELECT_WINNER] Attempting to select user ${userId} as winner`);
    
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
      console.log(`[SELECT_WINNER] No active draw found`);
      return NextResponse.json({
        success: false,
        message: "No active draw found. Please create a draw first.",
      });
    }

    console.log(`[SELECT_WINNER] Found active draw: ${activeDraw.id}`);
    console.log(`[SELECT_WINNER] Total participants: ${activeDraw.participants.length}`);
    
    // Log all participants for debugging
    console.log(`[SELECT_WINNER] All participants:`);
    activeDraw.participants.forEach(p => {
      console.log(`- User ${p.userId}: ${p.ticketsUsed} tickets`);
    });

    // Filter participants with active tickets
    const activeParticipants = activeDraw.participants.filter(p => p.ticketsUsed > 0);
    console.log(`[SELECT_WINNER] Active participants with tickets: ${activeParticipants.length}`);

    // Find the selected user's participation - ensure we're comparing strings to strings
    const selectedParticipation = activeParticipants.find(
      p => p.userId === userId || p.userId.toString() === userId.toString()
    );

    if (!selectedParticipation) {
      console.log(`[SELECT_WINNER] Could not find participation for user ${userId} with active tickets`);
      
      // Try to find the user in the database
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      if (!user) {
        console.log(`[SELECT_WINNER] User ${userId} not found in database`);
        return NextResponse.json({
          success: false,
          message: "Could not find the selected user in the database.",
        }, { status: 400 });
      }
      
      console.log(`[SELECT_WINNER] Found user in database: ${user.name || user.email || user.id}`);
      
      // Check if this user has any participation records for this draw
      const participationRecord = await db.drawParticipation.findFirst({
        where: {
          userId: user.id,
          drawId: activeDraw.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
      
      if (!participationRecord) {
        console.log(`[SELECT_WINNER] No participation record found for user ${user.id}`);
        return NextResponse.json({
          success: false,
          message: `The selected user (${user.name || user.email || user.id}) has not participated in the current draw.`,
        }, { status: 400 });
      }
      
      console.log(`[SELECT_WINNER] Found participation record: ${participationRecord.id}, tickets: ${participationRecord.ticketsUsed}`);
      
      // Check if the user has active tickets
      if (participationRecord.ticketsUsed <= 0) {
        console.log(`[SELECT_WINNER] User ${user.id} has 0 tickets in the current draw`);
        return NextResponse.json({
          success: false,
          message: `The selected user (${user.name || user.email || user.id}) has 0 active tickets in the current draw.`,
        }, { status: 400 });
      }
      
      console.log(`[SELECT_WINNER] User ${user.id} has ${participationRecord.ticketsUsed} active tickets`);
      
      // Run the lottery draw in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create a winner record
        const winner = await tx.winner.create({
          data: {
            userId: user.id,
            ticketCount: participationRecord.ticketsUsed,
            prizeAmount: activeDraw.prizeAmount,
            drawDate: new Date(),
            claimed: false,
          },
        });

        console.log(`[SELECT_WINNER] Created winner record: ${winner.id}`);

        // Update the winner's participation record
        await tx.drawParticipation.update({
          where: { id: participationRecord.id },
          data: { isWinner: true },
        });

        console.log(`[SELECT_WINNER] Updated participation record: ${participationRecord.id}`);

        // Mark the draw as completed
        await tx.draw.update({
          where: { id: activeDraw.id },
          data: { 
            status: DrawStatus.COMPLETED,
            winnerId: user.id,
          },
        });

        console.log(`[SELECT_WINNER] Marked draw ${activeDraw.id} as completed`);

        // Update winner user record
        await tx.user.update({
          where: { id: user.id },
          data: {
            hasWon: true,
            lastWinDate: new Date(),
          },
        });

        console.log(`[SELECT_WINNER] Updated user record: ${user.id}`);

        return {
          winner,
          winnerUser: participationRecord.user,
          participantCount: activeParticipants.length,
          totalTicketsInDraw: activeParticipants.reduce((sum, p) => sum + p.ticketsUsed, 0),
          winnerId: user.id,
        };
      });
      
      console.log(`[SELECT_WINNER] Transaction completed successfully`);
      
      // Reset ALL users' available tickets to 0 (new system)
      try {
        console.log(`[SELECT_WINNER] Resetting all users' available tickets after lottery draw`);
        const resetCount = await resetAllAvailableTickets();
        console.log(`[SELECT_WINNER] Reset available tickets for ${resetCount} users`);
      } catch (resetError) {
        console.error(`[SELECT_WINNER] Failed to reset available tickets:`, resetError);
      }

      // Send winner notification email
      try {
        if (result.winnerUser?.email) {
          console.log(`[SELECT_WINNER] Sending winner notification email to ${result.winnerUser.email}`);
          
          // Send initial winner notification without coupon code
          await sendWinnerNotificationEmail(
            result.winnerUser.email,
            result.winnerUser.name || "User",
            result.winner.prizeAmount,
            "PENDING - ADMIN WILL ISSUE SOON",
            result.winner.drawDate
          );
          
          console.log(`[SELECT_WINNER] Winner notification email sent to ${result.winnerUser.email}`);
        } else {
          console.warn("[SELECT_WINNER] Winner has no email address, skipping notification");
        }
      } catch (emailError) {
        console.error("[SELECT_WINNER] Failed to send winner notification email:", emailError);
        // Don't fail the entire operation if email fails
      }

      // Send non-winner emails to all participants who didn't win
      try {
        // Only send to participants with active tickets
        const nonWinners = activeParticipants.filter(
          p => p.ticketsUsed > 0 && p.userId !== result.winnerId && p.user.email
        );
        
        console.log(`[SELECT_WINNER] Sending non-winner emails to ${nonWinners.length} participants`);
        
        // Send emails in parallel (don't wait for all to complete)
        const emailPromises = nonWinners.map(async (participant) => {
          try {
            await sendNonWinnerEmail(
              participant.user.email!,
              participant.user.name || "User",
              activeDraw.drawDate,
              participant.userId
            );
            console.log(`[SELECT_WINNER] Non-winner email sent to ${participant.user.email}`);
          } catch (emailError) {
            console.error(`[SELECT_WINNER] Failed to send non-winner email to ${participant.user.email}:`, emailError);
          }
        });
        
        // Don't await all emails - let them send in background
        Promise.allSettled(emailPromises);
      } catch (error) {
        console.error("[SELECT_WINNER] Error sending non-winner emails:", error);
        // Don't fail the entire operation if emails fail
      }

      return NextResponse.json({
        success: true,
        message: "Winner selected successfully!",
        winner: {
          id: result.winnerUser?.id || "",
          name: result.winnerUser?.name || "Unknown",
          email: result.winnerUser?.email || "",
          image: result.winnerUser?.image || "",
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
    }

    console.log(`[SELECT_WINNER] Found direct participation match for user ${userId} with ${selectedParticipation.ticketsUsed} tickets`);

    // Check if the selected participant has active tickets
    if (selectedParticipation.ticketsUsed <= 0) {
      console.log(`[SELECT_WINNER] User ${userId} has 0 tickets in the current draw`);
      return NextResponse.json({
        success: false,
        message: `The selected user (${selectedParticipation.user.name || selectedParticipation.user.email || selectedParticipation.userId}) has 0 active tickets in the current draw.`,
      }, { status: 400 });
    }

    // If we found a direct participation match, proceed with the original flow
    // Run the lottery draw in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create a winner record
      const winner = await tx.winner.create({
        data: {
          userId: userId,
          ticketCount: selectedParticipation.ticketsUsed,
          prizeAmount: activeDraw.prizeAmount,
          drawDate: new Date(),
          claimed: false,
        },
      });

      console.log(`[SELECT_WINNER] Created winner record: ${winner.id}`);

      // Update the winner's participation record
      await tx.drawParticipation.update({
        where: { id: selectedParticipation.id },
        data: { isWinner: true },
      });

      console.log(`[SELECT_WINNER] Updated participation record: ${selectedParticipation.id}`);

      // Mark the draw as completed
      await tx.draw.update({
        where: { id: activeDraw.id },
        data: { 
          status: DrawStatus.COMPLETED,
          winnerId: userId,
        },
      });

      console.log(`[SELECT_WINNER] Marked draw ${activeDraw.id} as completed`);

      // Update winner user record
      await tx.user.update({
        where: { id: userId },
        data: {
          hasWon: true,
          lastWinDate: new Date(),
        },
      });

      console.log(`[SELECT_WINNER] Updated user record: ${userId}`);

      const winnerUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      return {
        winner,
        winnerUser,
        participantCount: activeParticipants.length,
        totalTicketsInDraw: activeParticipants.reduce((sum, p) => sum + p.ticketsUsed, 0),
        winnerId: userId,
      };
    });

    console.log(`[SELECT_WINNER] Transaction completed successfully`);

    // Reset ALL users' available tickets to 0 (new system)
    try {
      console.log(`[SELECT_WINNER] Resetting all users' available tickets after lottery draw`);
      const resetCount = await resetAllAvailableTickets();
      console.log(`[SELECT_WINNER] Reset available tickets for ${resetCount} users`);
    } catch (resetError) {
      console.error(`[SELECT_WINNER] Failed to reset available tickets:`, resetError);
    }

    // Send winner notification email
    try {
      if (result.winnerUser?.email) {
        console.log(`[SELECT_WINNER] Sending winner notification email to ${result.winnerUser.email}`);
        
        // Send initial winner notification without coupon code
        await sendWinnerNotificationEmail(
          result.winnerUser.email,
          result.winnerUser.name || "User",
          result.winner.prizeAmount,
          "PENDING - ADMIN WILL ISSUE SOON",
          result.winner.drawDate
        );
        
        console.log(`[SELECT_WINNER] Winner notification email sent to ${result.winnerUser.email}`);
      } else {
        console.warn("[SELECT_WINNER] Winner has no email address, skipping notification");
      }
    } catch (emailError) {
      console.error("[SELECT_WINNER] Failed to send winner notification email:", emailError);
      // Don't fail the entire operation if email fails
    }

    // Send non-winner emails to all participants who didn't win
    try {
      // Only send to participants with active tickets
      const nonWinners = activeParticipants.filter(
        p => p.ticketsUsed > 0 && p.userId !== result.winnerId && p.user.email
      );
      
      console.log(`[SELECT_WINNER] Sending non-winner emails to ${nonWinners.length} participants`);
      
      // Send emails in parallel (don't wait for all to complete)
      const emailPromises = nonWinners.map(async (participant) => {
        try {
          await sendNonWinnerEmail(
            participant.user.email!,
            participant.user.name || "User",
            activeDraw.drawDate,
            participant.userId
          );
          console.log(`[SELECT_WINNER] Non-winner email sent to ${participant.user.email}`);
        } catch (emailError) {
          console.error(`[SELECT_WINNER] Failed to send non-winner email to ${participant.user.email}:`, emailError);
        }
      });
      
      // Don't await all emails - let them send in background
      Promise.allSettled(emailPromises);
    } catch (error) {
      console.error("[SELECT_WINNER] Error sending non-winner emails:", error);
      // Don't fail the entire operation if emails fail
    }

    return NextResponse.json({
      success: true,
      message: "Winner selected successfully!",
      winner: {
        id: result.winnerUser?.id || "",
        name: result.winnerUser?.name || "Unknown",
        email: result.winnerUser?.email || "",
        image: result.winnerUser?.image || "",
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
    console.error("[SELECT_WINNER] Error selecting winner:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while selecting the winner.",
      }),
      { status: 500 }
    );
  }
} 