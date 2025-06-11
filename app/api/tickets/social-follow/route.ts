import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, withTransaction } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { awardTicketsToUser, applyAllTicketsToLottery } from "@/lib/ticket-utils";
import { nanoid } from "nanoid";

export async function POST() {
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

    // Check if user has completed at least one survey (outside transaction)
    const surveyTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
      },
    });

    if (surveyTickets === 0) {
      return NextResponse.json({
        success: false,
        message: "⚠ You must complete a survey before unlocking this option.",
      });
    }
    
    // Check if the user has already followed on social media (outside transaction)
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        socialMediaFollowed: true,
        name: true,
        email: true,
      },
    });

    if (userRecord?.socialMediaFollowed) {
      return NextResponse.json({
        success: false,
        message: "⚠ You can only earn 1 ticket from social media.",
      });
    }

    // Get or create the current lottery draw (outside transaction)
    const draw = await createOrGetNextDraw();

    // Use optimized transaction with timeout handling
    const result = await withTransaction(async (tx) => {
      // Mark user as having followed on social media
      await tx.user.update({
        where: { id: user.id },
        data: { socialMediaFollowed: true },
      });

      // Create the ticket directly in the transaction for speed
      const ticket = await tx.ticket.create({
        data: {
          userId: user.id,
          source: "SOCIAL",
          isUsed: false,
          confirmationCode: `SOCIAL_${nanoid(8)}`,
        },
      });

      // Update user's available tickets count
      await tx.user.update({
        where: { id: user.id },
        data: {
          availableTickets: { increment: 1 },
          totalTicketsEarned: { increment: 1 },
        },
      });

      return {
        ticketId: ticket.id,
        confirmationCode: ticket.confirmationCode,
      };
    }, {
      timeout: 8000, // 8 second timeout for this specific transaction
      maxWait: 3000, // 3 second max wait
    });

    // Apply tickets to lottery outside of the main transaction to avoid timeout
    try {
      const appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);
      
      // Get updated user ticket counts
      const updatedCounts = await db.user.findUnique({
        where: { id: user.id },
        select: {
          availableTickets: true,
          totalTicketsEarned: true,
        },
      });

      // Send email notification asynchronously
      if (userRecord?.email) {
        // Don't await this to avoid blocking the response
        sendTicketApplicationEmail(
          userRecord.email,
          {
            name: userRecord.name || "User",
            ticketCount: 1,
            drawDate: draw.drawDate,
            confirmationCode: result.confirmationCode || `SOCIAL_${result.ticketId}`
          }
        ).catch(emailError => {
          console.error('📧 Failed to send social media ticket email:', emailError);
        });
      }

      console.log('🎫 Social media ticket awarded:', {
        userId: user.id,
        ticketId: result.ticketId,
        drawId: draw.id,
      });
      
      return NextResponse.json({
        success: true,
        message: "🎉 Thanks for following us! Your ticket has been automatically applied to this week's lottery!",
        data: {
          ticketId: result.ticketId,
          ticketCount: 1,
          drawId: draw.id,
          availableTickets: updatedCounts?.availableTickets || 0,
          totalUserTickets: updatedCounts?.totalTicketsEarned || 0,
          appliedTickets,
          source: "SOCIAL",
          appliedToLottery: true,
        },
      });
    } catch (applyError) {
      console.error("Error applying tickets to lottery:", applyError);
      
      // Even if applying fails, the ticket was still awarded
      return NextResponse.json({
        success: true,
        message: "🎉 Thanks for following us! Your ticket has been awarded and will be applied to the lottery shortly.",
        data: {
          ticketId: result.ticketId,
          ticketCount: 1,
          drawId: draw.id,
          source: "SOCIAL",
          appliedToLottery: false,
        },
      });
    }
  } catch (error: any) {
    console.error("Error earning social media ticket:", error);
    
    // Handle specific transaction timeout errors
    if (error.message.includes("timed out") || error.message.includes("timeout")) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "⏱️ The operation is taking longer than expected. Please try again in a moment.",
        }),
        { status: 408 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "❌ Something went wrong. Please try again later.",
      }),
      { status: 500 }
    );
  }
} 