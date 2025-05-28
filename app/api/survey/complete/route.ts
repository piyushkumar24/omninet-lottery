import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Survey Completion Verification Endpoint
 * 
 * This endpoint can be called from the frontend to verify if a user
 * recently completed a survey (useful for showing completion messages)
 */
export async function GET(request: NextRequest) {
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

    // This endpoint can be used for additional verification if needed
    // For now, we'll just return success since the survey completion
    // is handled by the CPX postback endpoint
    
    return NextResponse.json({
      success: true,
      message: "Survey completion check successful",
    });
  } catch (error) {
    console.error("Error checking survey completion:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
}

/**
 * Manual Survey Completion Handler
 * 
 * This can be used as a fallback if the postback fails
 * or for testing purposes
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

    // Check if user already has a recent survey ticket (within last 5 minutes)
    const recentTicket = await db.ticket.findFirst({
      where: {
        userId: user.id,
        source: "SURVEY",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes
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
        ticketId: recentTicket.id
      });
    }

    // Award survey completion ticket
    const draw = await createOrGetNextDraw();
    const confirmationCode = nanoid(10);
    
    const result = await db.$transaction(async (tx) => {
      // Create the survey ticket - always just ONE ticket
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

      // Always increment participation by exactly 1 ticket
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

      // Update draw total tickets - always increment by 1
      await tx.draw.update({
        where: { id: draw.id },
        data: {
          totalTickets: {
            increment: 1,
          },
        },
      });

      // Log the exact award amount
      await tx.settings.create({
        data: {
          key: `survey_ticket_${newTicket.id}`,
          value: JSON.stringify({
            userId: user.id,
            ticketId: newTicket.id,
            ticketCount: 1, // Always exactly 1
            timestamp: new Date().toISOString(),
          }),
          description: "Survey completion ticket awarded - guaranteed 1 ticket",
        },
      });

      return {
        ticketId: newTicket.id,
        drawId: draw.id,
        totalUserTickets,
      };
    });

    console.log('🎫 Survey completion ticket awarded:', {
      userId: user.id,
      ticketId: result.ticketId,
      drawId: result.drawId,
      ticketCount: 1 // Always exactly 1
    });
    
    return NextResponse.json({
      success: true,
      message: "Survey completion ticket awarded - 1 ticket",
      data: result
    });
  } catch (error) {
    console.error("Error processing survey completion:", error);
    
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