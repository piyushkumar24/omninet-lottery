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
      
      // Log the claim action
      await tx.settings.create({
        data: {
          key: `prize_claimed_${winnerId}_${Date.now()}`,
          value: JSON.stringify({
            winnerId,
            userId: winner.userId,
            couponCode,
            prizeAmount: winner.prizeAmount,
            claimedAt: new Date().toISOString(),
          }),
          description: "Prize claimed and gift card code issued by admin",
        },
      });
    });

    // Send notification email to the winner with retry mechanism
    if (winner.user.email) {
      try {
        console.log(`Sending gift card email to winner: ${winner.user.email}`);
        
        // First attempt
        await sendWinnerNotificationEmail(
          winner.user.email,
          winner.user.name || "User",
          winner.prizeAmount,
          couponCode,
          winner.drawDate
        );
        
        console.log(`Gift card email sent successfully to ${winner.user.email}`);
      } catch (emailError) {
        console.error("Failed to send winner notification email on first attempt:", emailError);
        
        // Retry after a short delay
        try {
          console.log(`Retrying gift card email to ${winner.user.email}...`);
          
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await sendWinnerNotificationEmail(
            winner.user.email,
            winner.user.name || "User",
            winner.prizeAmount,
            couponCode,
            winner.drawDate
          );
          
          console.log(`Gift card email sent successfully on retry to ${winner.user.email}`);
        } catch (retryError) {
          console.error("Failed to send winner notification email on retry:", retryError);
          
          // Log the failure for manual follow-up
          await db.settings.create({
            data: {
              key: `failed_winner_email_${winnerId}_${Date.now()}`,
              value: JSON.stringify({
                winnerId,
                userId: winner.userId,
                email: winner.user.email,
                couponCode,
                prizeAmount: winner.prizeAmount,
                error: retryError instanceof Error ? retryError.message : String(retryError),
                timestamp: new Date().toISOString(),
              }),
              description: "Failed to send winner gift card email after retry",
            },
          });
        }
      }
    } else {
      console.warn(`Winner ${winner.userId} has no email address, cannot send notification`);
      
      // Log this issue for manual follow-up
      await db.settings.create({
        data: {
          key: `winner_no_email_${winnerId}_${Date.now()}`,
          value: JSON.stringify({
            winnerId,
            userId: winner.userId,
            couponCode,
            prizeAmount: winner.prizeAmount,
            timestamp: new Date().toISOString(),
          }),
          description: "Winner has no email address for gift card notification",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Prize claimed successfully! Winner has been notified via email.",
      data: {
        winnerId,
        userId: winner.userId,
        userName: winner.user.name,
        userEmail: winner.user.email,
        prizeAmount: winner.prizeAmount,
        couponCode,
        claimedAt: new Date().toISOString(),
      }
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