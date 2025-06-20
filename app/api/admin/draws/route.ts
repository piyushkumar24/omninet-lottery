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
    
    console.log(`[ADMIN_DRAWS] Fetching draws data`);
    
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

    console.log(`[ADMIN_DRAWS] Found ${draws.length} draws`);

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
          where: {
            ticketsUsed: { gt: 0 } // Only include participants with tickets > 0
          },
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

    console.log(`[ADMIN_DRAWS] Found active draw: ${activeDraw?.id || 'none'}`);

    // Calculate total tickets from all participations for active draw
    let activeDrawTotalTickets = 0;
    if (activeDraw) {
      // Calculate total tickets from participants (already filtered to have tickets > 0)
      activeDrawTotalTickets = activeDraw.participants.reduce((sum, p) => sum + p.ticketsUsed, 0);
      
      console.log(`[ADMIN_DRAWS] Total active participants: ${activeDraw.participants.length}`);
      console.log(`[ADMIN_DRAWS] Total active tickets: ${activeDrawTotalTickets}`);
      
      // Update the draw with accurate total
      activeDraw.totalTickets = activeDrawTotalTickets;
    }

    // Force clear any cached data by adding a timestamp
    const timestamp = Date.now();

    return NextResponse.json({
      success: true,
      timestamp,
      data: {
        draws: drawsWithWinners,
        activeDraw: activeDraw ? {
          ...activeDraw,
          totalTickets: activeDrawTotalTickets
        } : null,
      }
    });
  } catch (error) {
    console.error("[ADMIN_DRAWS] Error fetching draws:", error);
    
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