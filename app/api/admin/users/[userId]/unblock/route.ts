import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Unauthorized. Only administrators can unblock users.",
        }),
        { status: 403 }
      );
    }

    const userId = params.userId;
    
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

    // Unblock the user
    const unblockedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        isBlocked: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User has been unblocked successfully.",
      user: {
        id: unblockedUser.id,
        name: unblockedUser.name,
        email: unblockedUser.email,
        isBlocked: unblockedUser.isBlocked,
      },
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while unblocking user.",
      }),
      { status: 500 }
    );
  }
} 