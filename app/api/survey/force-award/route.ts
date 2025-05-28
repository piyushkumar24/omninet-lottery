import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Force Ticket Award Endpoint
 * 
 * This is a special endpoint for awarding tickets when surveys are not available
 * or other award methods have failed.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    // Extract reason from request if available
    let reason = "no_surveys_available";
    try {
      const body = await request.json();
      if (body && body.reason) {
        reason = body.reason;
      }
    } catch (e) {
      // If JSON parsing fails, use default reason
    }

    // Check if user already has a recent survey ticket (within last 3 minutes)
    const recentTicket = await db.ticket.findFirst({
      where: {
        userId: user.id,
        source: "SURVEY",
        createdAt: {
          gte: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentTicket) {
      console.log('Recent survey ticket already exists for user:', user.id);
      return NextResponse.json({
        success: true,
        message: "Ticket already awarded recently",
        ticketId: recentTicket.id,
        forceAward: false
      });
    }

    // Award force participation ticket
    const draw = await createOrGetNextDraw();
    const confirmationCode = nanoid(10);
    
    const result = await db.$transaction(async (tx) => {
      // Create the survey ticket
      const newTicket = await tx.ticket.create({
        data: {
          userId: user.id,
          source: "SURVEY",
          isUsed: true, // Automatically apply to lottery
          drawId: draw.id,
          confirmationCode: confirmationCode,
        },
      });

      // Update or create draw participation
      const existingParticipation = await tx.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: user.id,
            drawId: draw.id,
          },
        },
      });

      let totalUserTickets = 1;
      if (existingParticipation) {
        totalUserTickets = existingParticipation.ticketsUsed + 1;
        await tx.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: {
            ticketsUsed: totalUserTickets,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.drawParticipation.create({
          data: {
            userId: user.id,
            drawId: draw.id,
            ticketsUsed: 1,
          },
        });
      }

      // Update draw total tickets
      await tx.draw.update({
        where: { id: draw.id },
        data: {
          totalTickets: {
            increment: 1,
          },
        },
      });

      // Create a log entry for this force award
      await tx.settings.create({
        data: {
          key: `force_award_${newTicket.id}`,
          value: JSON.stringify({
            userId: user.id,
            ticketId: newTicket.id,
            reason: reason,
            timestamp: new Date().toISOString(),
          }),
          description: "Forced survey ticket award due to no surveys available",
        },
      });

      return {
        ticketId: newTicket.id,
        drawId: draw.id,
        totalUserTickets,
        reason
      };
    });

    console.log('🎯 Force participation ticket awarded:', {
      userId: user.id,
      ticketId: result.ticketId,
      drawId: result.drawId,
      reason
    });
    
    return NextResponse.json({
      success: true,
      message: "Force participation ticket awarded",
      data: result,
      forceAward: true
    });
  } catch (error) {
    console.error("Error processing force ticket award:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
} 