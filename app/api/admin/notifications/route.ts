import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 403 }
      );
    }
    
    // Get unclaimed winners count
    const unclaimedWinners = await db.winner.count({
      where: {
        claimed: false,
      },
    });
    
    // Check if there are any system notifications (this would be more complex in a real app)
    // Here we're just using unclaimed winners as notifications
    const notificationCount = unclaimedWinners;
    
    // Return the notification count
    return NextResponse.json({
      success: true,
      count: notificationCount,
      notifications: [
        {
          id: "1",
          type: "unclaimed_winners",
          message: "There are unclaimed prizes",
          count: unclaimedWinners,
          timestamp: new Date(),
        },
      ],
    });
  } catch (error) {
    console.error("Error getting admin notifications:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 