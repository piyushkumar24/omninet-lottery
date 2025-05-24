import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

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

    // Get user's newsletter subscription status
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { newsletterSubscribed: true },
    });

    return NextResponse.json({
      success: true,
      subscribed: userRecord?.newsletterSubscribed || false,
    });
  } catch (error) {
    console.error("Error getting newsletter status:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 