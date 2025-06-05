import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrGetNextDraw } from "@/data/draw";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { awardTicketsToUser, applyAllTicketsToLottery } from "@/lib/ticket-utils";

/**
 * Non-Winner Bonus Ticket Handler
 * 
 * This endpoint awards bonus tickets to users who didn't win the lottery
 * but clicked on the special link in their "unfortunate" email.
 * 
 * It awards 2 tickets as a consolation prize and to keep engagement high.
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

    // Check for non-winner token from URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token || !token.startsWith('nw_')) {
      return NextResponse.json({
        success: false,
        message: "Invalid token. This link may have expired or been used already.",
      }, { status: 400 });
    }

    // Verify the token in the database
    const tokenRecord = await db.settings.findUnique({
      where: { key: `non_winner_email_${token}` }
    });

    if (!tokenRecord) {
      return NextResponse.json({
        success: false,
        message: "Token not found. This link may have expired or been used already.",
      }, { status: 404 });
    }

    try {
      // Parse token data and validate
      const tokenData = JSON.parse(tokenRecord.value);
      
      // Verify token belongs to this user
      if (tokenData.userId !== user.id) {
        return NextResponse.json({
          success: false,
          message: "This bonus link belongs to another user.",
        }, { status: 403 });
      }
      
      // Check if already used
      if (tokenData.bonusTicketsAwarded) {
        return NextResponse.json({
          success: false,
          message: "You've already claimed your bonus tickets.",
          data: {
            alreadyClaimed: true,
            claimedAt: tokenData.bonusAwardedAt,
          }
        });
      }
      
      // Mark as eligible for bonus in survey completion
      return NextResponse.json({
        success: true,
        message: "You're eligible for 2 bonus tickets! Complete a quick survey to claim them.",
        data: {
          token,
          userId: user.id,
          isNonWinnerBonus: true,
          bonusTickets: 2,
          redirectUrl: `/dashboard/survey?token=${token}`,
        }
      });
    } catch (error) {
      console.error('Error parsing token data:', error);
      return NextResponse.json({
        success: false,
        message: "Invalid token data. Please try again.",
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling non-winner bonus:", error);
    
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
 * Direct bonus ticket claim without survey (alternative flow)
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

    // Get request body
    const body = await request.json();
    const { token } = body;
    
    if (!token || !token.startsWith('nw_')) {
      return NextResponse.json({
        success: false,
        message: "Invalid token. This link may have expired or been used already.",
      }, { status: 400 });
    }

    // Verify the token in the database
    const tokenRecord = await db.settings.findUnique({
      where: { key: `non_winner_email_${token}` }
    });

    if (!tokenRecord) {
      return NextResponse.json({
        success: false,
        message: "Token not found. This link may have expired or been used already.",
      }, { status: 404 });
    }

    try {
      // Parse token data and validate
      const tokenData = JSON.parse(tokenRecord.value);
      
      // Verify token belongs to this user
      if (tokenData.userId !== user.id) {
        return NextResponse.json({
          success: false,
          message: "This bonus link belongs to another user.",
        }, { status: 403 });
      }
      
      // Check if already used
      if (tokenData.bonusTicketsAwarded) {
        return NextResponse.json({
          success: false,
          message: "You've already claimed your bonus tickets.",
          data: {
            alreadyClaimed: true,
            claimedAt: tokenData.bonusAwardedAt,
          }
        });
      }
      
      // Award bonus tickets
      const draw = await createOrGetNextDraw();
      const bonusTicketsToAward = 2;
      
      const result = await db.$transaction(async (tx) => {
        // Award tickets to user (increases both available and total counts)
        const awardResult = await awardTicketsToUser(user.id, bonusTicketsToAward, "SURVEY");
        
        if (!awardResult.success) {
          throw new Error("Failed to award bonus tickets to user");
        }

        // Apply all available tickets to the current lottery
        const appliedTickets = await applyAllTicketsToLottery(user.id, draw.id);

        // Mark token as used
        await tx.settings.update({
          where: { key: `non_winner_email_${token}` },
          data: {
            value: JSON.stringify({
              ...tokenData,
              bonusTicketsAwarded: true,
              bonusAwardedAt: new Date().toISOString(),
              ticketsAwarded: bonusTicketsToAward
            }),
            updatedAt: new Date(),
          },
        });

        // Log the bonus award
        await tx.settings.create({
          data: {
            key: `bonus_ticket_${awardResult.ticketIds[0]}`,
            value: JSON.stringify({
              userId: user.id,
              ticketIds: awardResult.ticketIds,
              ticketCount: bonusTicketsToAward,
              token,
              timestamp: new Date().toISOString(),
            }),
            description: `Non-winner bonus tickets awarded - ${bonusTicketsToAward} tickets`,
          },
        });

        return {
          ticketIds: awardResult.ticketIds,
          drawId: draw.id,
          totalUserTickets: awardResult.totalTickets,
          availableTickets: awardResult.availableTickets,
          appliedTickets,
          bonusTicketsToAward,
        };
      });

      // Send email notification
      if (user.email) {
        try {
          await sendTicketApplicationEmail(
            user.email,
            {
              name: user.name || "User",
              ticketCount: bonusTicketsToAward,
              drawDate: draw.drawDate,
              confirmationCode: `BONUS_${result.ticketIds[0]}`,
            }
          );
          console.log('📧 Bonus ticket email sent to user:', user.email);
        } catch (emailError) {
          console.error('📧 Failed to send bonus ticket email:', emailError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `🎉 You received ${bonusTicketsToAward} bonus tickets! They've been automatically applied to this week's lottery!`,
        data: {
          ticketIds: result.ticketIds,
          ticketCount: bonusTicketsToAward,
          drawId: result.drawId,
          totalUserTickets: result.totalUserTickets,
          availableTickets: result.availableTickets,
          appliedTickets: result.appliedTickets,
          source: "SURVEY",
          isNonWinnerBonus: true,
          bonusTickets: true,
          appliedToLottery: true,
        },
      });
    } catch (error) {
      console.error('Error processing bonus tickets:', error);
      return NextResponse.json({
        success: false,
        message: "Error processing your bonus tickets. Please try again.",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error handling non-winner bonus direct claim:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 