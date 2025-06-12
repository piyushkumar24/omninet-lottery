import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";

export async function GET() {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 403 }
      );
    }
    
    // Fetch all draws with participants and winners
    const draws = await db.draw.findMany({
      orderBy: {
        drawDate: "desc"
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
              }
            }
          },
          orderBy: {
            ticketsUsed: "desc"
          }
        },
        // Include winners through a separate query since it's not directly related
      }
    });

    // Get winners for each draw
    const drawsWithWinners = await Promise.all(
      draws.map(async (draw) => {
        const winners = await db.winner.findMany({
          where: {
            drawDate: draw.drawDate
          },
          select: {
            id: true,
            userId: true,
            ticketCount: true,
            prizeAmount: true,
            claimed: true,
            couponCode: true,
            drawDate: true,
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

        return {
          ...draw,
          winners
        };
      })
    );

    // Get the current active draw
    const activeDraw = await db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
      },
      orderBy: {
        drawDate: "asc",
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
                availableTickets: true,
              }
            }
          },
          orderBy: {
            ticketsUsed: "desc"
          }
        }
      }
    });

    // Calculate total tickets from all participations for active draw
    let activeDrawTotalTickets = 0;
    if (activeDraw) {
      const totalParticipations = await db.drawParticipation.aggregate({
        where: {
          drawId: activeDraw.id,
        },
        _sum: {
          ticketsUsed: true,
        },
      });
      activeDrawTotalTickets = totalParticipations._sum.ticketsUsed || 0;
      
      // Update the draw with accurate total
      activeDraw.totalTickets = activeDrawTotalTickets;
    }

    return NextResponse.json({
      success: true,
      data: {
        draws: drawsWithWinners,
        activeDraw: activeDraw ? {
          ...activeDraw,
          totalTickets: activeDrawTotalTickets
        } : null,
      }
    });
  } catch (error) {
    console.error("Error fetching draws:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
} 