import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    
    // Return detailed session info for debugging
    return NextResponse.json({
      success: true,
      authenticated: !!session?.user,
      user: session?.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        isAdmin: session.user.role === UserRole.ADMIN,
        isBlocked: session.user.isBlocked
      } : null
    });
  } catch (error) {
    console.error("Admin test error:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
} 