import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized. Only administrators can trigger draws.",
        }),
        { status: 403 }
      );
    }
    
    // Get eligible tickets
    const eligibleTickets = await db.ticket.findMany({
      where: {
        isUsed: false,
      },
      include: {
        user: true,
      },
    });
    
    if (eligibleTickets.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No eligible tickets found for the draw.",
      });
    }
    
    // Randomly select winners (simplified example - in a real app, this would be more complex)
    const winnerCount = Math.min(
      3, // Maximum winners per draw
      Math.max(1, Math.floor(eligibleTickets.length * 0.1)) // At least 1, at most 10% of tickets
    );
    
    // Shuffle tickets
    const shuffledTickets = [...eligibleTickets].sort(() => Math.random() - 0.5);
    
    // Select winners
    const selectedTickets = shuffledTickets.slice(0, winnerCount);
    
    // Create a new draw date (current time)
    const drawDate = new Date();
    
    // Create winner records
    const winnerPromises = selectedTickets.map(async (ticket) => {
      // Mark the ticket as used
      await db.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          isUsed: true,
        },
      });
      
      // Count user's tickets for record keeping
      const userTicketCount = await db.ticket.count({
        where: {
          userId: ticket.userId,
        },
      });
      
      // Create a winner record
      return db.winner.create({
        data: {
          userId: ticket.userId,
          ticketCount: userTicketCount,
          drawDate,
          prizeAmount: Math.floor(Math.random() * 500) + 100, // Random prize between $100 and $600
          claimed: false,
        },
      });
    });
    
    const winners = await Promise.all(winnerPromises);
    
    return NextResponse.json({
      success: true,
      message: "Draw completed successfully.",
      winnerCount: winners.length,
      drawDate,
    });
  } catch (error) {
    console.error("Error running manual draw:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while running the draw.",
      }),
      { status: 500 }
    );
  }
} 