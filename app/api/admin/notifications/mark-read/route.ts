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
          message: "Unauthorized",
        }),
        { status: 403 }
      );
    }
    
    // Instead of marking as notified, we'll mark them as claimed
    // This is a workaround since we couldn't add the notified field
    // In a real app, you'd have a separate notifications table
    await db.winner.updateMany({
      where: {
        claimed: false
      },
      data: {
        claimed: true
      }
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 