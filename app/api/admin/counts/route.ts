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
    
    // Get count of active tickets
    const activeTickets = await db.ticket.count({
      where: {
        isUsed: false
      }
    });
    
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
        activeTickets,
        unclaimedWinners
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