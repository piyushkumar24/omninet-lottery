import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }
    
    // First, verify the user exists in the database
    const dbUser = await db.user.findUnique({
      where: {
        id: sessionUser.id,
      },
      select: {
        id: true,
        referralCode: true
      }
    });
    
    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found in database",
        },
        { status: 404 }
      );
    }
    
    let referralCode = dbUser.referralCode;
    
    // If no referral code exists, generate one and save it
    if (!referralCode) {
      referralCode = nanoid(8); // Generate an 8-character unique code
      
      // Use upsert to handle potential race conditions
      await db.user.upsert({
        where: {
          id: dbUser.id,
        },
        update: {
          referralCode,
        },
        create: {
          // This shouldn't happen since we verified the user exists
          id: dbUser.id,
          referralCode,
          email: sessionUser.email || "",
          name: sessionUser.name || "",
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      referralCode,
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
} 