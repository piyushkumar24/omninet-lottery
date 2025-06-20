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

    // Find the selected user's participation - ensure we're comparing strings to strings
    const selectedParticipation = activeDraw.participants.find(
      p => p.userId === userId || p.userId.toString() === userId.toString()
    );

    if (!selectedParticipation) {
      // If no direct match, try to find by user ID in a more flexible way
      console.log(`Could not find direct participation match for user ID: ${userId}`);
      console.log(`Available participant IDs: ${activeDraw.participants.map(p => p.userId).join(', ')}`);
      
      // Attempt to find the user in the database
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      if (!user) {
        return NextResponse.json({
          success: false,
          message: "Could not find the selected user in the database.",
        }, { status: 400 });
      }
      
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
        return NextResponse.json({
          success: false,
          message: `The selected user (${user.name || user.email || user.id}) has not participated in the current draw.`,
        }, { status: 400 });
      }
      
      // Use the found participation record
      console.log(`Found participation record through database lookup for user: ${user.name || user.email || user.id}`);
      
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

        // Update the winner's participation record
        await tx.drawParticipation.update({
          where: { id: participationRecord.id },
          data: { isWinner: true },
        });

        // Mark the draw as completed
        await tx.draw.update({
          where: { id: activeDraw.id },
          data: { 
            status: DrawStatus.COMPLETED,
            winnerId: user.id,
          },
        });

        // Update winner user record
        await tx.user.update({
          where: { id: user.id },
          data: {
            hasWon: true,
            lastWinDate: new Date(),
          },
        });

        return {
          winner,
          winnerUser: participationRecord.user,
          participantCount: activeDraw.participants.length,
          totalTicketsInDraw: activeDraw.totalTickets,
          winnerId: user.id,
        };
      });
      
      // Continue with the rest of the function (email sending, etc.)
      // Reset ALL users' available tickets to 0 (new system)
      try {
        console.log(`Resetting all users' available tickets after lottery draw`);
        const resetCount = await resetAllAvailableTickets();
        console.log(`Reset available tickets for ${resetCount} users`);
      } catch (resetError) {
        console.error(`Failed to reset available tickets:`, resetError);
      }

      // Send winner notification email
      try {
        if (result.winnerUser?.email) {
          console.log(`Sending winner notification email to ${result.winnerUser.email}`);
          
          // Send initial winner notification without coupon code
          await sendWinnerNotificationEmail(
            result.winnerUser.email,
            result.winnerUser.name || "User",
            result.winner.prizeAmount,
            "PENDING - ADMIN WILL ISSUE SOON",
            result.winner.drawDate
          );
          
          console.log(`Winner notification email sent to ${result.winnerUser.email}`);
        } else {
          console.warn("Winner has no email address, skipping notification");
        }
      } catch (emailError) {
        console.error("Failed to send winner notification email:", emailError);
        // Don't fail the entire operation if email fails
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
          winnerId: userId,
        },
      });

      // Update winner user record
      await tx.user.update({
        where: { id: userId },
        data: {
          hasWon: true,
          lastWinDate: new Date(),
        },
      });

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
        participantCount: activeDraw.participants.length,
        totalTicketsInDraw: activeDraw.totalTickets,
        winnerId: userId,
      };
    });

    // Reset ALL users' available tickets to 0 (new system)
    try {
      console.log(`Resetting all users' available tickets after lottery draw`);
      const resetCount = await resetAllAvailableTickets();
      console.log(`Reset available tickets for ${resetCount} users`);
    } catch (resetError) {
      console.error(`Failed to reset available tickets:`, resetError);
    }

    // Send winner notification email
    try {
      if (result.winnerUser?.email) {
        console.log(`Sending winner notification email to ${result.winnerUser.email}`);
        
        // Send initial winner notification without coupon code
        await sendWinnerNotificationEmail(
          result.winnerUser.email,
          result.winnerUser.name || "User",
          result.winner.prizeAmount,
          "PENDING - ADMIN WILL ISSUE SOON",
          result.winner.drawDate
        );
        
        console.log(`Winner notification email sent to ${result.winnerUser.email}`);
      } else {
        console.warn("Winner has no email address, skipping notification");
      }
    } catch (emailError) {
      console.error("Failed to send winner notification email:", emailError);
      // Don't fail the entire operation if email fails
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