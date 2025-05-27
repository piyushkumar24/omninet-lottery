import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { sendTicketApplicationEmail } from "@/lib/mail";
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

      // Create the social media ticket and immediately apply to lottery
      const confirmationCode = nanoid(10);
      const ticket = await tx.ticket.create({
        data: {
          userId: user.id,
          source: "SOCIAL",
          isUsed: true, // Automatically mark as used since we're applying to lottery
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

      return {
        ticket,
        confirmationCode,
        totalUserTickets,
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
        console.log('📧 Social media ticket automatically applied, email sent to user:', userRecord.email);
      } catch (emailError) {
        console.error('📧 Failed to send social media ticket email:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "🎉 Thanks for following us! Your ticket has been automatically applied to this week's lottery!",
      ticket: result.ticket,
      appliedToLottery: true,
      totalUserTickets: result.totalUserTickets,
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