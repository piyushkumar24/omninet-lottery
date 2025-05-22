import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

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
    
    return NextResponse.json({
      success: true,
      message: "Authorized admin user",
    });
  } catch (error) {
    console.error("Admin check error:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 