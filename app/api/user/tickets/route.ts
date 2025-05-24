import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserAvailableTickets, getUserUsedTickets, getUserTotalTickets } from "@/lib/ticket-utils";

export async function GET() {
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

    // Get ticket counts using utility functions
    const availableTickets = await getUserAvailableTickets(user.id);
    const usedTickets = await getUserUsedTickets(user.id);
    const totalTickets = await getUserTotalTickets(user.id);

    return NextResponse.json({
      success: true,
      availableTickets,
      usedTickets,
      totalTickets,
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 