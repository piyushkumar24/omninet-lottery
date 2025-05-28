import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Ticket Award Test Endpoint
 * 
 * This endpoint allows admins to test the ticket award process
 * by directly creating a ticket in the system.
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

    // Only allow admins to use this endpoint
    if (user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Admin access required",
        }),
        { status: 403 }
      );
    }

    // Get parameters from request body
    const body = await request.json();
    const { userId, source = "SURVEY", note } = body;

    if (!userId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "User ID is required",
        }),
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Target user not found",
        }),
        { status: 404 }
      );
    }

    // Get current lottery draw
    const draw = await createOrGetNextDraw();
    const confirmationCode = nanoid(10);
    
    // Create a test ticket in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the ticket
      const newTicket = await tx.ticket.create({
        data: {
          userId: targetUser.id,
          source: source as "SURVEY" | "REFERRAL" | "SOCIAL",
          isUsed: true,
          drawId: draw.id,
          confirmationCode: confirmationCode,
        },
      });

      // Update or create draw participation
      const existingParticipation = await tx.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: targetUser.id,
            drawId: draw.id,
          },
        },
      });

      if (existingParticipation) {
        await tx.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: {
            ticketsUsed: existingParticipation.ticketsUsed + 1,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.drawParticipation.create({
          data: {
            userId: targetUser.id,
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

      // Create a log entry for this test operation
      await tx.settings.create({
        data: {
          key: `test_ticket_${newTicket.id}`,
          value: JSON.stringify({
            adminId: user.id,
            targetUserId: targetUser.id,
            ticketId: newTicket.id,
            timestamp: new Date().toISOString(),
            note: note || "Admin test ticket",
          }),
          description: "Test ticket award by admin",
        },
      });

      return {
        ticketId: newTicket.id,
        userId: targetUser.id,
        userName: targetUser.name,
        source,
        confirmationCode,
        drawId: draw.id,
      };
    });

    console.log('🧪 Test ticket awarded by admin:', {
      adminId: user.id,
      adminName: user.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      ticketId: result.ticketId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Test ticket successfully awarded",
      data: result
    });
  } catch (error) {
    console.error("Error awarding test ticket:", error);
    
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