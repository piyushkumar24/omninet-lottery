import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";
import { sendNonWinnerEmail } from "@/lib/mail";
import { resetAllAvailableTickets } from "@/lib/ticket-utils";
import { getConnectionMetrics, checkConnectionHealth } from "@/lib/db-monitor";
import logger from "@/lib/logger";

// Define interfaces for result types
interface DatabaseHealthResult {
  success: boolean;
  timestamp: string;
  status?: string;
  metrics?: {
    checkCount: number;
    successCount: number;
    failureCount: number;
    successRate: string;
    averageLatency: string;
    lastChecked: Date;
  };
  message?: string;
  error?: string;
}

interface WeeklyDrawResult {
  success: boolean;
  message: string;
  winner?: {
    name: string;
    email: string;
    ticketCount: number;
    prizeAmount: number;
  };
  drawStats?: {
    participantCount: number;
    totalTicketsInDraw: number;
    drawDate: Date;
  };
  error?: string;
}

interface CronResults {
  success: boolean;
  weeklyDraw: WeeklyDrawResult | null;
  databaseHealth: DatabaseHealthResult | null;
}

export async function POST(req: Request) {
  try {
    // Check for secret token to ensure this is a valid request
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const task = searchParams.get("task") || "all"; // Default to running all tasks
    
    if (secret !== process.env.CRON_SECRET) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }
    
    const results: CronResults = {
      success: true,
      weeklyDraw: null,
      databaseHealth: null,
    };
    
    // Database health check (run this first as it's more critical)
    if (task === "all" || task === "database") {
      try {
        logger.info('Cron: Database health check started', 'CRON');
        
        // Perform a real-time connection check
        await checkConnectionHealth();
        
        // Get current metrics
        const metrics = getConnectionMetrics();
        
        results.databaseHealth = {
          success: true,
          timestamp: new Date().toISOString(),
          status: metrics.status,
          metrics: {
            checkCount: metrics.checkCount,
            successCount: metrics.successCount,
            failureCount: metrics.failureCount,
            successRate: metrics.successRate.toFixed(2) + '%',
            averageLatency: metrics.averageLatency.toFixed(2) + 'ms',
            lastChecked: metrics.lastChecked,
          }
        };
        
        logger.info(`Cron: Database health check result: ${metrics.status}`, 'CRON');
      } catch (error) {
        logger.error("Cron: Database health check failed", error, 'CRON');
        results.databaseHealth = {
          success: false,
          message: "Database health check failed",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    // Check if it's Sunday (day 0) to run the weekly draw
    const now = new Date();
    const isWeeklyDrawDay = now.getDay() === 0;
    
    // Weekly lottery draw - run if explicitly requested or if it's Sunday and task=all
    if (task === "draw" || (task === "all" && isWeeklyDrawDay)) {
      try {
        logger.info('Cron: Weekly draw check started', 'CRON');
        
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
          results.weeklyDraw = {
            success: false,
            message: "No active draw found to process",
          };
          logger.info('Cron: No active draw found to process', 'CRON');
        } else {
          // Check if anyone has actually participated
          if (activeDraw.participants.length === 0) {
            // Mark draw as cancelled if no one participated
            await db.draw.update({
              where: { id: activeDraw.id },
              data: { status: DrawStatus.CANCELLED },
            });

            results.weeklyDraw = {
              success: false,
              message: "Draw cancelled: No users participated in this lottery",
            };
            logger.info('Cron: Draw cancelled due to no participants', 'CRON');
          } else {
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
              logger.info(`Cron: Using ${allEligibleTickets.length} virtual tickets from ${activeDraw.participants.length} participants`, 'CRON');
            } else {
              allEligibleTickets = participationTickets;
              logger.info(`Cron: Using ${allEligibleTickets.length} actual tickets from database`, 'CRON');
            }

            if (allEligibleTickets.length === 0) {
              results.weeklyDraw = {
                success: false,
                message: "No valid tickets found for this draw. Cannot proceed with lottery.",
              };
              logger.warn('Cron: No valid tickets found for draw', 'CRON');
            } else {
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
                logger.info(`Cron: Resetting all users' available tickets after lottery draw`, 'CRON');
                const resetCount = await resetAllAvailableTickets();
                logger.info(`Cron: Reset available tickets for ${resetCount} users`, 'CRON');
              } catch (resetError) {
                logger.error(`Cron: Failed to reset available tickets:`, resetError, 'CRON');
              }
              
              // Send non-winner emails to all participants who didn't win
              try {
                const nonWinners = activeDraw.participants.filter(
                  p => p.userId !== result.winnerId && p.user.email
                );
                
                logger.info(`Cron: Sending non-winner emails to ${nonWinners.length} participants`, 'CRON');
                
                // Send emails in parallel (don't wait for all to complete)
                const emailPromises = nonWinners.map(async (participant) => {
                  try {
                    await sendNonWinnerEmail(
                      participant.user.email!,
                      participant.user.name || "User",
                      activeDraw.drawDate,
                      participant.userId
                    );
                    logger.info(`Cron: Non-winner email sent to ${participant.user.email}`, 'CRON');
                  } catch (emailError) {
                    logger.error(`Cron: Failed to send non-winner email to ${participant.user.email}:`, emailError, 'CRON');
                  }
                });
                
                // Don't await all emails - let them send in background
                Promise.allSettled(emailPromises);
              } catch (error) {
                logger.error("Cron: Error sending non-winner emails:", error, 'CRON');
                // Don't fail the entire operation if emails fail
              }
              
              results.weeklyDraw = {
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
              };
              
              logger.info('Cron: Weekly draw completed successfully', 'CRON');
            }
          }
        }
      } catch (error) {
        logger.error("Cron: Error running weekly draw:", error, 'CRON');
        
        results.weeklyDraw = {
          success: false,
          message: "Internal error running weekly draw",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    logger.error("Cron: Error in master cron job:", error, 'CRON');
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error in master cron job",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
} 