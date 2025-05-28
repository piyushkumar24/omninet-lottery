import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Force Ticket Award Endpoint (Bypass duplicate check)
 * 
 * This endpoint is specifically designed to bypass the duplicate ticket check
 * and force award a ticket to the current user, even if they recently received one.
 * This is useful when tickets aren't showing up in the dashboard.
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

    // Get or create the next lottery draw
    const draw = await createOrGetNextDraw();
    const confirmationCode = nanoid(10);
    
    // Award ticket directly without duplicate checking
    const result = await db.$transaction(async (tx) => {
      // Create the ticket
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

      // Log this force award
      await tx.settings.create({
        data: {
          key: `emergency_force_award_${newTicket.id}`,
          value: JSON.stringify({
            userId: user.id,
            ticketId: newTicket.id,
            reason: "manual_force_award",
            timestamp: new Date().toISOString(),
          }),
          description: "Emergency forced ticket award due to ticket not showing up",
        },
      });

      return {
        ticketId: newTicket.id,
        drawId: draw.id,
        totalUserTickets,
      };
    });

    console.log('🚨 Emergency force ticket awarded:', {
      userId: user.id,
      ticketId: result.ticketId,
      drawId: result.drawId,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      message: "Emergency force ticket awarded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in emergency force ticket award:", error);
    
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