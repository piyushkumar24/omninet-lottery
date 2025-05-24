import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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
        message: "You must complete at least one survey before following on social media.",
      });
    }
    
    // Check if the user has already followed on social media
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { socialMediaFollowed: true },
    });

    if (userRecord?.socialMediaFollowed) {
      return NextResponse.json({
        success: false,
        message: "You have already earned a ticket for following on social media.",
      });
    }

    // Use transaction to ensure both operations succeed
    const result = await db.$transaction(async (tx) => {
      // Mark user as having followed on social media
      await tx.user.update({
        where: { id: user.id },
        data: { socialMediaFollowed: true },
      });

      // Create the social media ticket
      const ticket = await tx.ticket.create({
        data: {
          userId: user.id,
          source: "SOCIAL",
          isUsed: false,
        },
      });

      return ticket;
    });
    
    return NextResponse.json({
      success: true,
      message: "Thank you for following us! You've earned a ticket.",
      ticket: result,
    });
  } catch (error) {
    console.error("Error earning social media ticket:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 