import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
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

    // Check if user is already subscribed
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      select: { newsletterSubscribed: true },
    });

    if (userRecord?.newsletterSubscribed) {
      return NextResponse.json({
        success: false,
        message: "⚠ You're already subscribed to our newsletter.",
      });
    }

    // Subscribe user to newsletter
    await db.user.update({
      where: { id: user.id },
      data: { newsletterSubscribed: true },
    });
    
    return NextResponse.json({
      success: true,
      message: "🎉 Successfully subscribed to the 0mninet newsletter!",
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "❌ Something went wrong. Please try again later.",
      }),
      { status: 500 }
    );
  }
} 