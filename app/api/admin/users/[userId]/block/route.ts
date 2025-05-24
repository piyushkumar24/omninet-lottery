import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "User not found.",
        }),
        { status: 404 }
      );
    }

    // Prevent blocking self
    const currentUser = await db.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (currentUser?.id === userId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "You cannot block yourself.",
        }),
        { status: 400 }
      );
    }

    // Block the user
    const blockedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        isBlocked: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User has been blocked successfully.",
      user: {
        id: blockedUser.id,
        name: blockedUser.name,
        email: blockedUser.email,
        isBlocked: blockedUser.isBlocked,
      },
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while blocking user.",
      }),
      { status: 500 }
    );
  }
} 