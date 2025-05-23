import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

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
          message: "Unauthorized. Only administrators can promote users.",
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

    // Make the user an admin
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        role: UserRole.ADMIN,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User has been promoted to administrator successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error making user admin:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while promoting user to administrator.",
      }),
      { status: 500 }
    );
  }
} 