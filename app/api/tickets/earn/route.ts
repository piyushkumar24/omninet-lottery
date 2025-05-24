import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TicketSource } from "@prisma/client";

export async function POST(req: Request) {
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
    
    // Parse the request body
    const body = await req.json();
    const { source } = body;
    
    if (!source || !Object.values(TicketSource).includes(source)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Invalid ticket source",
        }),
        { status: 400 }
      );
    }

    // Check if user has completed at least one survey (for non-survey sources)
    const surveyTickets = await db.ticket.count({
      where: {
        userId: user.id,
        source: "SURVEY",
      },
    });

    // Handle different sources with new rules
    if (source === "SURVEY") {
      // Surveys are always repeatable
      const isFirstSurvey = surveyTickets === 0;
      
      // Use transaction to handle both survey ticket and potential referral ticket
      const result = await db.$transaction(async (tx) => {
        // Create the survey ticket
        const surveyTicket = await tx.ticket.create({
          data: {
            userId: user.id,
            source: "SURVEY",
            isUsed: false,
          },
        });

        // If this is the user's first survey and they were referred, award referral ticket
        if (isFirstSurvey) {
          const userRecord = await tx.user.findUnique({
            where: { id: user.id },
            select: { referredBy: true },
          });

          if (userRecord?.referredBy) {
            // Check if the referrer has completed at least one survey (required for referral system)
            const referrerSurveyTickets = await tx.ticket.count({
              where: {
                userId: userRecord.referredBy,
                source: "SURVEY",
              },
            });

            if (referrerSurveyTickets > 0) {
              // Award referral ticket to the referrer
              await tx.ticket.create({
                data: {
                  userId: userRecord.referredBy,
                  source: "REFERRAL",
                  isUsed: false,
                },
              });
            }
          }
        }

        return { surveyTicket, isFirstSurvey };
      });
      
      return NextResponse.json({
        success: true,
        message: result.isFirstSurvey 
          ? "Survey completed! You've earned your first ticket and unlocked more earning options."
          : "Survey completed! You've earned another ticket.",
        ticket: result.surveyTicket,
        firstSurvey: result.isFirstSurvey,
      });
    }

    if (source === "SOCIAL") {
      // Social requires first survey and is one-time only
      if (surveyTickets === 0) {
        return NextResponse.json({
          success: false,
          message: "Complete your first survey to unlock social media following.",
        });
      }

      // Check if already followed on social media
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

      // This should redirect to the dedicated social follow endpoint
      return NextResponse.json({
        success: false,
        message: "Please use the social media follow process to earn this ticket.",
      });
    }

    if (source === "REFERRAL") {
      // Referrals require first survey completion
      if (surveyTickets === 0) {
        return NextResponse.json({
          success: false,
          message: "Complete your first survey to unlock referral features.",
        });
      }

      // Referrals are handled differently - they're earned when someone uses your code
      // This endpoint shouldn't be used for referrals
      return NextResponse.json({
        success: false,
        message: "Referral tickets are earned automatically when friends complete surveys.",
      });
    }
    
    return NextResponse.json({
      success: false,
      message: "Invalid ticket source",
    });
  } catch (error) {
    console.error("Error earning ticket:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 