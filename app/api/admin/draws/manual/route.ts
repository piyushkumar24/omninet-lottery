import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST() {
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
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "No tickets available for the draw",
        }),
        { status: 400 }
      );
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
    
    // Revalidate the admin draws path and dashboard
    revalidatePath("/admin/draws");
    revalidatePath("/dashboard");
    
    // In a real application, you would send an email to the winner here
    
    return NextResponse.redirect(new URL("/admin/draws", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  } catch (error) {
    console.error("Error running manual draw:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 