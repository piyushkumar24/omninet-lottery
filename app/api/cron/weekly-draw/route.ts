import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";
import { sendNonWinnerEmail } from "@/lib/mail";
import { resetAllAvailableTickets } from "@/lib/ticket-utils";

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

    // If no tickets are found, use draw participation to create virtual tickets
    let allEligibleTickets = [];
    
    if (participationTickets.length === 0) {
      // Create virtual tickets based on draw participation
      for (const participant of activeDraw.participants) {
        for (let i = 0; i < participant.ticketsUsed; i++) {
          allEligibleTickets.push({
            userId: participant.userId,
            user: participant.user,
          });
        }
      }
      console.log(`Using ${allEligibleTickets.length} virtual tickets from ${activeDraw.participants.length} participants`);
    } else {
      allEligibleTickets = participationTickets;
      console.log(`Using ${allEligibleTickets.length} actual tickets from database`);
    }

    if (allEligibleTickets.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid tickets found for this draw. Cannot proceed with lottery.",
      });
    }

    // Select a random winning ticket
    const randomIndex = Math.floor(Math.random() * allEligibleTickets.length);
    const winningTicketInfo = allEligibleTickets[randomIndex];
    const winnerId = winningTicketInfo.userId;

    // Run the lottery draw in a transaction
    const result = await db.$transaction(
      async (tx) => {
        // Create a winner record
        const winner = await tx.winner.create({
          data: {
            userId: winnerId,
            ticketCount: activeDraw.participants.find(p => p.userId === winnerId)?.ticketsUsed || 1,
            prizeAmount: activeDraw.prizeAmount,
            drawDate: new Date(),
            claimed: false,
          },
        });

        // Update the winner's participation record
        await tx.drawParticipation.updateMany({
          where: {
            userId: winnerId,
            drawId: activeDraw.id,
          },
          data: { isWinner: true },
        });

        // Mark the draw as completed
        await tx.draw.update({
          where: { id: activeDraw.id },
          data: { 
            status: DrawStatus.COMPLETED,
            winnerId: winnerId,
          },
        });

        // Update winner user record
        await tx.user.update({
          where: { id: winnerId },
          data: {
            hasWon: true,
            lastWinDate: new Date(),
          },
        });

        const winnerUser = await tx.user.findUnique({
          where: { id: winnerId },
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
          winnerId: winnerId,
        };
      }
    );
    
    // Reset ALL users' available tickets to 0 (new system)
    try {
      console.log(`Resetting all users' available tickets after lottery draw`);
      const resetCount = await resetAllAvailableTickets();
      console.log(`Reset available tickets for ${resetCount} users`);
    } catch (resetError) {
      console.error(`Failed to reset available tickets:`, resetError);
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
      message: "Weekly draw completed successfully",
      winner: {
        name: result.winnerUser?.name || "Unknown",
        email: result.winnerUser?.email || "",
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