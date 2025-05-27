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
    
    // Get actual notification items
    const notifications = await db.winner.findMany({
      where: {
        claimed: false,
      },
      select: {
        id: true,
        prizeAmount: true,
        drawDate: true,
        user: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format notifications for display
    const formattedNotifications = notifications.map(winner => ({
      id: winner.id,
      type: "unclaimed_winners",
      message: `${winner.user.name || 'A user'} won $${winner.prizeAmount}`,
      count: 1,
      timestamp: winner.drawDate,
    }));
    
    // Return the notification count and items
    return NextResponse.json({
      success: true,
      count: notificationCount,
      notifications: formattedNotifications,
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