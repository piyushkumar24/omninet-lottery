import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
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

    // Check if user has completed at least one survey
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
    
    // Check if the user has already followed on social media
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

    // Get or create the current lottery draw
    const draw = await createOrGetNextDraw();

    // Use transaction to ensure all operations succeed
    const result = await db.$transaction(async (tx) => {
      // Mark user as having followed on social media
      await tx.user.update({
        where: { id: user.id },
        data: { socialMediaFollowed: true },
      });

      // Award social media ticket using the new system
      const awardResult = await awardTicketsToUser(user.id, 1, "SOCIAL");
      
      if (!awardResult.success) {
        throw new Error("Failed to award social media ticket");
      }

      // Apply all available tickets to the current lottery
      const appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);

      // Log the social media ticket award
      await tx.settings.create({
        data: {
          key: `social_ticket_${awardResult.ticketIds[0]}`,
          value: JSON.stringify({
            userId: user.id,
            ticketId: awardResult.ticketIds[0],
            timestamp: new Date().toISOString(),
          }),
          description: "Social media follow ticket awarded",
        },
      });

      return {
        ticketId: awardResult.ticketIds[0],
        availableTickets: awardResult.availableTickets,
        totalTickets: awardResult.totalTickets,
        appliedTickets,
        confirmationCode: `SOCIAL_${awardResult.ticketIds[0]}`,
      };
    });

    // Send email notification
    if (userRecord?.email) {
      try {
        await sendTicketApplicationEmail(
          userRecord.email,
          {
            name: userRecord.name || "User",
            ticketCount: 1,
            drawDate: draw.drawDate,
            confirmationCode: result.confirmationCode
          }
        );
        console.log('📧 Social media ticket email sent to user:', userRecord.email);
      } catch (emailError) {
        console.error('📧 Failed to send social media ticket email:', emailError);
      }
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
        availableTickets: result.availableTickets,
        totalUserTickets: result.totalTickets,
        appliedTickets: result.appliedTickets,
        source: "SOCIAL",
        appliedToLottery: true,
      },
    });
  } catch (error) {
    console.error("Error earning social media ticket:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "❌ Something went wrong. Please try again later.",
      }),
      { status: 500 }
    );
  }
} 