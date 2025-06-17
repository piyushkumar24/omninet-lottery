import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Instant Ticket Verification Endpoint
 * 
 * This endpoint checks for newly awarded tickets and instant notifications
 * to provide immediate feedback to users after survey completion.
 */
export async function GET(request: NextRequest) {
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

    // Check for instant notifications created in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const instantNotifications = await db.settings.findMany({
      where: {
        key: {
          startsWith: `instant_notification_${user.id}_`,
        },
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get the most recent tickets for the user
    const recentTickets = await db.ticket.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get total ticket count
    const totalTickets = await db.ticket.count({
      where: { userId: user.id },
    });

    // Get survey ticket count
    const surveyTickets = await db.ticket.count({
      where: { userId: user.id, source: "SURVEY" },
    });

    // Process notifications
    const processedNotifications = instantNotifications.map(notification => {
      try {
        const data = JSON.parse(notification.value);
        return {
          id: notification.key,
          type: data.type,
          source: data.source,
          ticketCount: data.ticketCount,
          ticketIds: data.ticketIds,
          message: data.message,
          timestamp: data.timestamp,
          createdAt: notification.createdAt,
        };
      } catch (error) {
        console.error('Error parsing notification:', error);
        return null;
      }
    }).filter(Boolean);

    // Check if there are any new tickets
    const hasNewTickets = recentTickets.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        hasNewTickets,
        totalTickets,
        surveyTickets,
        recentTickets: recentTickets.map(ticket => ({
          id: ticket.id,
          source: ticket.source,
          createdAt: ticket.createdAt,
          confirmationCode: ticket.confirmationCode,
        })),
        notifications: processedNotifications,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in instant ticket verification:", error);
    
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

/**
 * Mark notifications as read
 */
export async function POST(request: NextRequest) {
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

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Invalid notification IDs",
        }),
        { status: 400 }
      );
    }

    // Delete the read notifications
    await db.settings.deleteMany({
      where: {
        key: {
          in: notificationIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 