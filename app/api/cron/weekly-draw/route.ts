import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Check for secret token to ensure this is a valid request
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    if (secret !== process.env.CRON_SECRET) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        }),
        { status: 401 }
      );
    }
    
    // Get all active tickets
    const tickets = await db.ticket.findMany({
      where: {
        isUsed: false,
      },
      include: {
        user: true,
      },
    });
    
    if (tickets.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No tickets available for the draw",
      });
    }
    
    // Select a random ticket
    const winningTicketIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[winningTicketIndex];
    
    // Create a winner record
    const winner = await db.winner.create({
      data: {
        userId: winningTicket.userId,
        ticketCount: tickets.filter(t => t.userId === winningTicket.userId).length,
        prizeAmount: 50, // $50 Amazon gift card
        drawDate: new Date(),
        claimed: false,
      },
    });
    
    // Mark all tickets as used
    await db.ticket.updateMany({
      where: {
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });
    
    // TODO: Send email to the winner
    // In a real implementation, you would integrate with an email service
    // like SendGrid, Mailgun, etc.
    
    return NextResponse.json({
      success: true,
      message: "Draw completed successfully",
      winner: {
        name: winningTicket.user.name,
        email: winningTicket.user.email,
        ticketCount: winner.ticketCount,
        prizeAmount: winner.prizeAmount,
      },
    });
  } catch (error) {
    console.error("Error running weekly draw:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 