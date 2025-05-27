import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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
    
    // Get count of all users
    const users = await db.user.count();
    
    // Get count of newsletter subscribers
    const newsletterSubscribers = await db.user.count({
      where: {
        newsletterSubscribed: true
      }
    });
    
    // Get count of applied tickets (all tickets since they're all applied)
    const appliedTickets = await db.ticket.count();
    
    // Get count of unclaimed winners
    const unclaimedWinners = await db.winner.count({
      where: {
        claimed: false
      }
    });
    
    return NextResponse.json({
      success: true,
      counts: {
        users,
        newsletterSubscribers,
        appliedTickets,
        unclaimedWinners,
        // Keep backward compatibility
        activeTickets: appliedTickets
      }
    });
  } catch (error) {
    console.error("Error getting admin counts:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 