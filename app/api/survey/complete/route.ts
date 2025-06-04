import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

/**
 * Survey Completion Verification Endpoint
 * 
 * This endpoint can be called from the frontend to verify if a user
 * recently completed a survey (useful for showing completion messages)
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

    // This endpoint can be used for additional verification if needed
    // For now, we'll just return success since the survey completion
    // is handled by the CPX postback endpoint
    
    return NextResponse.json({
      success: true,
      message: "Survey completion check successful",
    });
  } catch (error) {
    console.error("Error checking survey completion:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
}

/**
 * Manual Survey Completion Handler
 * 
 * This can be used as a fallback if the postback fails
 * or for testing purposes. Now includes bonus ticket logic for non-winner emails.
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

    // Check for non-winner email tracking token
    const { searchParams } = new URL(request.url);
    const nonWinnerToken = searchParams.get('token');
    let isNonWinnerBonus = false;
    let bonusTicketsToAward = 1; // Default: 1 ticket for regular survey completion
    let trackingRecord = null;

    if (nonWinnerToken && nonWinnerToken.startsWith('nw_')) {
      // Verify the non-winner token
      try {
        trackingRecord = await db.settings.findUnique({
          where: { key: `non_winner_email_${nonWinnerToken}` }
        });

        if (trackingRecord) {
          const trackingData = JSON.parse(trackingRecord.value);
          
          // Verify the token belongs to this user and hasn't been used
          if (trackingData.userId === user.id && !trackingData.bonusTicketsAwarded) {
            isNonWinnerBonus = true;
            bonusTicketsToAward = 2; // Award 2 bonus tickets for non-winner email flow
            
            console.log(`🎫 Non-winner bonus flow detected for user ${user.id}, awarding ${bonusTicketsToAward} tickets`);
          }
        }
      } catch (error) {
        console.error('Error verifying non-winner token:', error);
      }
    }

    // Check if user already has a recent survey ticket (within last 5 minutes)
    const recentTicket = await db.ticket.findFirst({
      where: {
        userId: user.id,
        source: "SURVEY",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentTicket && !isNonWinnerBonus) {
      console.log('Recent survey ticket already exists for user:', user.id);
      return NextResponse.json({
        success: true,
        message: "Ticket already awarded recently",
        ticketId: recentTicket.id
      });
    }

    // Award survey completion tickets
    const draw = await createOrGetNextDraw();
    
    const result = await db.$transaction(async (tx) => {
      const ticketIds = [];
      let totalUserTickets = 0;

      // Create the survey tickets
      for (let i = 0; i < bonusTicketsToAward; i++) {
        const confirmationCode = nanoid(10);
        const newTicket = await tx.ticket.create({
          data: {
            userId: user.id,
            source: "SURVEY",
            isUsed: false, // Set to false so it shows up on dashboard
            drawId: null, // Don't assign to a draw yet
            confirmationCode: confirmationCode,
          },
        });
        ticketIds.push(newTicket.id);
      }

      // Update or create draw participation
      const existingParticipation = await tx.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: user.id,
            drawId: draw.id,
          },
        },
      });

      if (existingParticipation) {
        totalUserTickets = existingParticipation.ticketsUsed + bonusTicketsToAward;
        await tx.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: {
            ticketsUsed: totalUserTickets,
            updatedAt: new Date(),
          },
        });
      } else {
        totalUserTickets = bonusTicketsToAward;
        await tx.drawParticipation.create({
          data: {
            userId: user.id,
            drawId: draw.id,
            ticketsUsed: bonusTicketsToAward,
          },
        });
      }

      // Update draw total tickets
      await tx.draw.update({
        where: { id: draw.id },
        data: {
          totalTickets: {
            increment: bonusTicketsToAward,
          },
        },
      });

      // Mark non-winner token as used if applicable
      if (isNonWinnerBonus && nonWinnerToken && trackingRecord) {
        await tx.settings.update({
          where: { key: `non_winner_email_${nonWinnerToken}` },
          data: {
            value: JSON.stringify({
              ...JSON.parse(trackingRecord.value),
              bonusTicketsAwarded: true,
              bonusAwardedAt: new Date().toISOString(),
              ticketsAwarded: bonusTicketsToAward
            }),
            updatedAt: new Date(),
          },
        });
      }

      // Log the exact award amount
      await tx.settings.create({
        data: {
          key: `survey_ticket_${ticketIds[0]}`,
          value: JSON.stringify({
            userId: user.id,
            ticketIds,
            ticketCount: bonusTicketsToAward,
            isNonWinnerBonus,
            timestamp: new Date().toISOString(),
          }),
          description: `Survey completion ticket${bonusTicketsToAward > 1 ? 's' : ''} awarded - ${bonusTicketsToAward} ticket${bonusTicketsToAward > 1 ? 's' : ''}`,
        },
      });

      return {
        ticketIds,
        drawId: draw.id,
        totalUserTickets,
        bonusTicketsToAward,
        isNonWinnerBonus,
      };
    });

    const message = isNonWinnerBonus 
      ? `🎉 Bonus tickets awarded! You received ${bonusTicketsToAward} lottery tickets for completing the survey after the non-winner email.`
      : `Survey completion ticket awarded - ${bonusTicketsToAward} ticket${bonusTicketsToAward > 1 ? 's' : ''}`;

    console.log('🎫 Survey completion tickets awarded:', {
      userId: user.id,
      ticketIds: result.ticketIds,
      drawId: result.drawId,
      ticketCount: bonusTicketsToAward,
      isNonWinnerBonus,
    });
    
    return NextResponse.json({
      success: true,
      message,
      data: result,
      bonusTickets: isNonWinnerBonus,
    });
  } catch (error) {
    console.error("Error processing survey completion:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
} 