import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserAppliedTickets } from "@/lib/ticket-utils";

/**
 * Ticket Verification Endpoint
 * 
 * This endpoint allows checking if tickets have been properly credited
 * to a user after survey completion.
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

    // Get ticket details from the last 30 minutes
    const recentTickets = await db.ticket.findMany({
      where: {
        userId: user.id,
        isUsed: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get all user tickets
    const allTickets = await db.ticket.findMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get total ticket count
    const totalTickets = await getUserAppliedTickets(user.id);

    // Get ticket counts by source
    const surveyTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
        isUsed: false,
      },
    });

    const referralTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "REFERRAL",
        isUsed: false,
      },
    });

    const socialTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SOCIAL",
        isUsed: false,
      },
    });

    // Get active draw information
    const activeDraw = await db.draw.findFirst({
      where: {
        status: "PENDING",
      },
      orderBy: {
        drawDate: 'asc',
      },
    });

    // Get user's participation in active draw
    let drawParticipation = null;
    if (activeDraw) {
      drawParticipation = await db.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: user.id,
            drawId: activeDraw.id,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Ticket verification successful",
      data: {
        userId: user.id,
        totalTickets,
        surveyTickets,
        referralTickets,
        socialTickets,
        recentTickets: recentTickets.map(ticket => ({
          id: ticket.id,
          source: ticket.source,
          createdAt: ticket.createdAt,
          isUsed: ticket.isUsed,
          drawId: ticket.drawId,
          confirmationCode: ticket.confirmationCode,
          timeAgo: `${Math.round((Date.now() - ticket.createdAt.getTime()) / 1000 / 60)} minutes ago`,
        })),
        allTickets: allTickets.map(ticket => ({
          id: ticket.id,
          source: ticket.source,
          createdAt: ticket.createdAt,
          isUsed: ticket.isUsed,
          drawId: ticket.drawId,
          confirmationCode: ticket.confirmationCode,
          timeAgo: `${Math.round((Date.now() - ticket.createdAt.getTime()) / 1000 / 60)} minutes ago`,
        })),
        activeDraw: activeDraw ? {
          id: activeDraw.id,
          drawDate: activeDraw.drawDate,
          totalTickets: activeDraw.totalTickets,
        } : null,
        drawParticipation: drawParticipation ? {
          id: drawParticipation.id,
          ticketsUsed: drawParticipation.ticketsUsed,
        } : null,
      },
    });
  } catch (error) {
    console.error("Error verifying tickets:", error);
    
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
 * Force Ticket Award Endpoint
 * 
 * This endpoint can be used to manually award a ticket if the CPX postback failed
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

    // Get request body to check for mobile survey verification
    let requestBody: { mobileSurveyVerification?: boolean } = {};
    try {
      requestBody = await request.json();
    } catch (e) {
      // If no body, continue with normal flow
      requestBody = {};
    }

    // Special handling for mobile survey verification
    if (requestBody.mobileSurveyVerification === true) {
      console.log('📱 Mobile survey verification requested for user:', user.id);
      
      // Check for recent CPX transactions for this user in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentTransactions = await db.settings.findMany({
        where: {
          key: {
            startsWith: 'cpx_transaction_',
          },
          value: {
            contains: user.id,
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
      
      if (recentTransactions.length > 0) {
        console.log('✅ Found recent CPX transactions for mobile user:', recentTransactions.length);
        
        // Get most recent transaction
        const latestTransaction = recentTransactions[0];
        let transactionData;
        
        try {
          transactionData = JSON.parse(latestTransaction.value);
        } catch (e) {
          console.error('Error parsing transaction data:', e);
        }
        
        // Get user's current tickets
        const totalTickets = await getUserAppliedTickets(user.id);
        
        return NextResponse.json({
          success: true,
          message: "Found recent survey completion",
          data: {
            userId: user.id,
            totalTickets,
            ticketId: transactionData?.ticketIds?.[0] || null,
            transactionFound: true,
            transactionTime: latestTransaction.createdAt,
          },
        });
      }
      
      // If no recent transactions, check if we need to trigger emergency ticket award
      const userTickets = await db.ticket.count({
        where: {
          userId: user.id,
          source: "SURVEY",
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
      });
      
      if (userTickets > 0) {
        console.log('✅ Found recent survey tickets for mobile user:', userTickets);
        
        return NextResponse.json({
          success: true,
          message: "Found recent survey tickets",
          data: {
            userId: user.id,
            totalTickets: await getUserAppliedTickets(user.id),
            recentTickets: userTickets,
            ticketsFound: true,
          },
        });
      }
      
      // No recent transactions or tickets found, but user claims to have completed a survey
      // Log this for investigation
      await db.settings.create({
        data: {
          key: `mobile_survey_verification_${user.id}_${Date.now()}`,
          value: JSON.stringify({
            userId: user.id,
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || 'unknown',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          }),
          description: "Mobile survey verification with no matching transaction",
        },
      });
      
      return NextResponse.json({
        success: false,
        message: "No recent survey completion found",
        data: {
          userId: user.id,
          totalTickets: await getUserAppliedTickets(user.id),
          transactionFound: false,
        },
      });
    }

    // Award ticket through the fallback endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/survey/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Failed to award ticket",
          error: data.message,
        }),
        { status: 500 }
      );
    }

    // Get updated ticket count
    const totalTickets = await getUserAppliedTickets(user.id);

    return NextResponse.json({
      success: true,
      message: "Ticket manually awarded",
      data: {
        userId: user.id,
        totalTickets,
        ticketId: data.data?.ticketId,
      },
    });
  } catch (error) {
    console.error("Error manually awarding ticket:", error);
    
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