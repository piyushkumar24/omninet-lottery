import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWinnerNotificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized. Only administrators can process claims.",
        }),
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { winnerId, couponCode } = body;
    
    if (!winnerId || !couponCode) {
      return NextResponse.json({
        success: false,
        message: "Winner ID and coupon code are required.",
      }, { status: 400 });
    }
    
    // Find the winner
    const winner = await db.winner.findUnique({
      where: { id: winnerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!winner) {
      return NextResponse.json({
        success: false,
        message: "Winner not found.",
      }, { status: 404 });
    }

    if (winner.claimed) {
      return NextResponse.json({
        success: false,
        message: "This prize has already been claimed.",
      }, { status: 400 });
    }

    // Use database transaction to ensure atomicity
    await db.$transaction(async (tx) => {
      // Update winner record
      await tx.winner.update({
        where: { id: winnerId },
        data: { 
          claimed: true,
          couponCode: couponCode,
          updatedAt: new Date(),
        },
      });

      // Update user to reflect they are a winner
      await tx.user.update({
        where: { id: winner.userId },
        data: {
          hasWon: true,
          lastWinDate: winner.drawDate,
        },
      });
    });

    // Send notification email to the winner
    if (winner.user.email) {
      try {
        await sendWinnerNotificationEmail(
          winner.user.email,
          winner.user.name || "User",
          winner.prizeAmount,
          couponCode,
          winner.drawDate
        );
      } catch (emailError) {
        console.error("Failed to send winner notification email:", emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Prize claimed successfully! Winner has been notified via email.",
    });
  } catch (error) {
    console.error("Error processing winner claim:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while processing the claim.",
      }),
      { status: 500 }
    );
  }
} 