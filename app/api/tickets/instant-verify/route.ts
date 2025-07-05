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
  const requestId = `IV${Date.now().toString(36)}`;
  console.log(`[${requestId}] 📊 Instant verification check starting...`);
  
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      console.log(`[${requestId}] ❌ Unauthorized user tried to access instant verification`);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    console.log(`[${requestId}] 👤 User: ${user.id} (${user.email})`);
    
    // Check for instant notifications with extended time window (10 minutes)
    // This helps catch notifications that might have been missed due to timing issues
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    console.log(`[${requestId}] 🔍 Checking for notifications since ${tenMinutesAgo.toISOString()}`);
    
    // Find all instant notifications for this user
    const instantNotifications = await db.settings.findMany({
      where: {
        key: {
          startsWith: `instant_notification_${user.id}_`,
        },
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Increased from 5 to ensure we don't miss any
    });

    console.log(`[${requestId}] 📝 Found ${instantNotifications.length} notifications`);

    // Get recent tickets with expanded time window (15 minutes)
    // This ensures we catch tickets that might have been awarded but notification was missed
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    console.log(`[${requestId}] 🎫 Checking for tickets awarded since ${fifteenMinutesAgo.toISOString()}`);
    
    const recentTickets = await db.ticket.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Increased from 5 to catch more tickets
    });

    console.log(`[${requestId}] 🎫 Found ${recentTickets.length} recent tickets`);
    
    if (recentTickets.length > 0) {
      console.log(`[${requestId}] 📋 Recent tickets:`, recentTickets.map(t => ({
        id: t.id,
        source: t.source,
        createdAt: t.createdAt,
        minutesAgo: Math.round((Date.now() - t.createdAt.getTime()) / 1000 / 60)
      })));
    }

    // CRITICAL: Check for CPX survey transactions as a backup mechanism
    // This catches cases where the ticket was awarded but notification wasn't created
    console.log(`[${requestId}] 🧮 Checking for CPX transactions in the past 15 minutes`);
    
    const cpxTransactions = await db.settings.findMany({
      where: {
        key: {
          startsWith: 'cpx_transaction_',
        },
        value: {
          contains: user.id,
        },
        createdAt: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    console.log(`[${requestId}] 📋 Found ${cpxTransactions.length} CPX transactions`);

    // Get tickets by source
    const [totalTickets, surveyTickets, referralTickets, socialTickets] = await Promise.all([
      db.ticket.count({
        where: { userId: user.id },
      }),
      db.ticket.count({
        where: { userId: user.id, source: "SURVEY" },
      }),
      db.ticket.count({
        where: { userId: user.id, source: "REFERRAL" },
      }),
      db.ticket.count({
        where: { userId: user.id, source: "SOCIAL" },
      }),
    ]);

    console.log(`[${requestId}] 🧮 Ticket counts - Total: ${totalTickets}, Survey: ${surveyTickets}, Referral: ${referralTickets}, Social: ${socialTickets}`);

    // Check for CPX email logs to verify if emails were sent
    const emailLogs = await db.settings.findMany({
      where: {
        key: {
          startsWith: 'email_sent_',
        },
        value: {
          contains: user.id,
        },
        createdAt: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    console.log(`[${requestId}] 📧 Found ${emailLogs.length} email logs`);

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
        console.error(`[${requestId}] Error parsing notification:`, error);
        return null;
      }
    }).filter(Boolean);

    // Create synthetic notification if we have recent tickets but no notifications
    // This is a fallback to ensure users are always notified about their tickets
    if (recentTickets.length > 0 && processedNotifications.length === 0) {
      console.log(`[${requestId}] 🔔 Creating synthetic notification for ${recentTickets.length} tickets`);
      
      // Group tickets by source
      const ticketsBySource: Record<string, any[]> = {};
      recentTickets.forEach(ticket => {
        if (!ticketsBySource[ticket.source]) {
          ticketsBySource[ticket.source] = [];
        }
        ticketsBySource[ticket.source].push(ticket);
      });
      
      // Create synthetic notifications for each source
      Object.entries(ticketsBySource).forEach(([source, tickets]) => {
        const syntheticNotification = {
          id: `synthetic_${user.id}_${Date.now()}_${source}`,
          type: 'TICKET_AWARDED',
          source,
          ticketCount: tickets.length,
          ticketIds: tickets.map(t => t.id),
          message: `🎉 ${tickets.length} ${source.toLowerCase()} ticket${tickets.length > 1 ? 's' : ''} added to your account!`,
          timestamp: new Date().toISOString(),
          createdAt: new Date(),
          isSynthetic: true
        };
        
        processedNotifications.push(syntheticNotification);
        
        // Create persistent notification record for future reference
        try {
          db.settings.create({
            data: {
              key: `instant_notification_${user.id}_${Date.now()}_synthetic`,
              value: JSON.stringify({
                userId: user.id,
                type: 'TICKET_AWARDED',
                source,
                ticketCount: tickets.length,
                ticketIds: tickets.map(t => t.id),
                message: `🎉 ${tickets.length} ${source.toLowerCase()} ticket${tickets.length > 1 ? 's' : ''} added to your account!`,
                timestamp: new Date().toISOString(),
                isSynthetic: true,
              }),
              description: 'Synthetic notification for unnotified tickets',
            },
          });
        } catch (error) {
          console.error(`[${requestId}] Error creating synthetic notification record:`, error);
        }
      });
    }

    // Check if any CPX transactions exist with no matching notifications
    // This is another fallback mechanism
    if (cpxTransactions.length > 0 && !processedNotifications.some(n => n && n.source === "SURVEY")) {
      console.log(`[${requestId}] 🔍 Found CPX transactions but no SURVEY notifications, creating synthetic notification`);
      
      // Create synthetic notification for CPX survey completion
      const syntheticCPXNotification = {
        id: `synthetic_cpx_${user.id}_${Date.now()}`,
        type: 'TICKET_AWARDED',
        source: 'SURVEY',
        ticketCount: 1, // CPX surveys always award exactly 1 ticket
        ticketIds: [],
        message: '🎉 Your survey completion has been verified! 1 lottery ticket has been added.',
        timestamp: new Date().toISOString(),
        createdAt: new Date(),
        isSynthetic: true,
        fromCPX: true
      };
      
      processedNotifications.push(syntheticCPXNotification);
      
      // Create persistent notification record for future reference
      try {
        db.settings.create({
          data: {
            key: `instant_notification_${user.id}_${Date.now()}_synthetic_cpx`,
            value: JSON.stringify({
              userId: user.id,
              type: 'TICKET_AWARDED',
              source: 'SURVEY',
              ticketCount: 1,
              ticketIds: [],
              message: '🎉 Your survey completion has been verified! 1 lottery ticket has been added.',
              timestamp: new Date().toISOString(),
              isSynthetic: true,
              fromCPX: true,
            }),
            description: 'Synthetic notification for CPX survey completion',
          },
        });
      } catch (error) {
        console.error(`[${requestId}] Error creating synthetic CPX notification record:`, error);
      }
    }

    const hasNewTickets = recentTickets.length > 0;
    const hasNewNotifications = processedNotifications.length > 0;
    
    console.log(`[${requestId}] ✅ Verification complete - New tickets: ${hasNewTickets ? 'YES' : 'NO'}, New notifications: ${hasNewNotifications ? 'YES' : 'NO'}`);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        hasNewTickets,
        hasNewNotifications,
        totalTickets,
        surveyTickets,
        referralTickets,
        socialTickets,
        recentTickets: recentTickets.map(ticket => ({
          id: ticket.id,
          source: ticket.source,
          createdAt: ticket.createdAt,
          confirmationCode: ticket.confirmationCode,
          minutesAgo: Math.round((Date.now() - ticket.createdAt.getTime()) / 1000 / 60),
        })),
        notifications: processedNotifications,
        emailsSent: emailLogs.length > 0,
        cpxTransactions: cpxTransactions.length > 0,
        lastChecked: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] ❌ Error in instant ticket verification:`, error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error),
        requestId,
      }),
      { status: 500 }
    );
  }
}

/**
 * Mark notifications as read
 */
export async function POST(request: NextRequest) {
  const requestId = `IV${Date.now().toString(36)}`;
  console.log(`[${requestId}] 🔖 Mark notifications as read request`);
  
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      console.log(`[${requestId}] ❌ Unauthorized user tried to mark notifications as read`);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }

    console.log(`[${requestId}] 👤 User: ${user.id} (${user.email})`);

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
      console.log(`[${requestId}] ❌ Invalid notification IDs provided:`, notificationIds);
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Invalid notification IDs",
        }),
        { status: 400 }
      );
    }

    console.log(`[${requestId}] 📝 Marking ${notificationIds.length} notifications as read`);

    // Delete the read notifications
    await db.settings.deleteMany({
      where: {
        key: {
          in: notificationIds,
        },
      },
    });

    console.log(`[${requestId}] ✅ Successfully marked notifications as read`);

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] ❌ Error marking notifications as read:`, error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error),
        requestId,
      }),
      { status: 500 }
    );
  }
} 