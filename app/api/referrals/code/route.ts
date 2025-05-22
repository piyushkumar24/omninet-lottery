import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

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
    
    // Check if user already has a referral code
    const existingUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        referralCode: true
      }
    });
    
    let referralCode = existingUser?.referralCode;
    
    // If no referral code exists, generate one and save it
    if (!referralCode) {
      referralCode = nanoid(8); // Generate an 8-character unique code
      
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          referralCode,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      referralCode,
    });
  } catch (error) {
    console.error("Error generating referral code:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 