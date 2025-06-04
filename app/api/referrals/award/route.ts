import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Referral Ticket Award Endpoint
 * 
 * This endpoint awards tickets for successful referrals
 * It can be called when a referred user completes verification
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the request is authorized (admin or system)
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

    // Get request body
    const body = await request.json();
    const { referrerId, referredUserId } = body;
    
    if (!referrerId || !referredUserId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Missing required fields: referrerId or referredUserId",
        }),
        { status: 400 }
      );
    }

    // Verify the referrer exists
    const referrer = await db.user.findUnique({
      where: {
        id: referrerId,
      },
    });

    if (!referrer) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Referrer not found",
        }),
        { status: 404 }
      );
    }

    // Verify the referred user exists
    const referredUser = await db.user.findUnique({
      where: {
        id: referredUserId,
      },
    });

    if (!referredUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Referred user not found",
        }),
        { status: 404 }
      );
    }

    // Check if referral ticket was already awarded
    const existingReferralTicket = await db.ticket.findFirst({
      where: {
        userId: referrerId,
        source: "REFERRAL",
        confirmationCode: {
          contains: referredUserId,
        },
      },
    });

    if (existingReferralTicket) {
      return NextResponse.json({
        success: true,
        message: "Referral ticket already awarded",
        ticketId: existingReferralTicket.id,
      });
    }

    // Award referral ticket
    const draw = await createOrGetNextDraw();
    
    const result = await db.$transaction(async (tx) => {
      // Create referral ticket
      const confirmationCode = `REF_${referredUserId}_${nanoid(6)}`;
      const newTicket = await tx.ticket.create({
        data: {
          userId: referrerId,
          source: "REFERRAL",
          isUsed: true, // Automatically apply to lottery
          drawId: draw.id,
          confirmationCode: confirmationCode,
        },
      });

      // Update or create draw participation
      const existingParticipation = await tx.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: referrerId,
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
            userId: referrerId,
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

      // Log the referral award
      await tx.settings.create({
        data: {
          key: `referral_ticket_${newTicket.id}`,
          value: JSON.stringify({
            referrerId,
            referredUserId,
            ticketId: newTicket.id,
            timestamp: new Date().toISOString(),
          }),
          description: `Referral ticket awarded to ${referrer.email} for referring ${referredUser.email}`,
        },
      });

      return {
        ticketId: newTicket.id,
        drawId: draw.id,
      };
    });

    console.log('🎫 Referral ticket awarded:', {
      referrerId,
      referredUserId,
      ticketId: result.ticketId,
      drawId: result.drawId,
    });
    
    return NextResponse.json({
      success: true,
      message: "Referral ticket awarded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error awarding referral ticket:", error);
    
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