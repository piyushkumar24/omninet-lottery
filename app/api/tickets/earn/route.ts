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
    
    // Check if the user already has a ticket from this source
    // For SOCIAL and SURVEY, users can only get one ticket per source
    if (source === "SOCIAL" || source === "SURVEY") {
      const existingTicket = await db.ticket.findFirst({
        where: {
          userId: user.id,
          source: source,
        },
      });
      
      if (existingTicket) {
        return NextResponse.json({
          success: false,
          message: `You have already earned a ticket from ${source.toLowerCase()}`,
        });
      }
    }
    
    // Create a new ticket
    const ticket = await db.ticket.create({
      data: {
        userId: user.id,
        source: source as TicketSource,
        isUsed: false,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully earned a ticket from ${source.toLowerCase()}`,
      ticket: ticket,
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