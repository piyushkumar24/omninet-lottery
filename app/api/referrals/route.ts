import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dbQueryWithRetry } from "@/lib/db-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }
    
    // Find users who used this user's referral code with retry logic
    const referrals = await dbQueryWithRetry(
      () => db.user.findMany({
        where: {
          referredBy: user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      'getReferrals'
    );
    
    return NextResponse.json({
      success: true,
      referrals,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 