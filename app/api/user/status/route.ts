import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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

    // Get user details including social media follow status
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        socialMediaFollowed: true,
      },
    });

    // Check if user has any survey tickets
    const surveyTicketCount = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
      },
    });

    return NextResponse.json({
      success: true,
      socialMediaFollowed: userRecord?.socialMediaFollowed || false,
      hasSurveyTicket: surveyTicketCount > 0,
      surveyTicketCount,
    });
  } catch (error) {
    console.error("Error getting user status:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 