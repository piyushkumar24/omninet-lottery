import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

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

    // Prevent demoting self
    const currentUser = await db.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (currentUser?.id === userId) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "You cannot remove your own administrator rights.",
        }),
        { status: 400 }
      );
    }

    // Count remaining admins
    const adminCount = await db.user.count({
      where: {
        role: UserRole.ADMIN,
      },
    });

    // Ensure at least one admin remains
    if (adminCount <= 1) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Cannot remove last administrator. At least one must remain.",
        }),
        { status: 400 }
      );
    }

    // Remove admin rights from the user
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        role: UserRole.USER,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Administrator rights have been removed successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error removing admin rights:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error while removing administrator rights.",
      }),
      { status: 500 }
    );
  }
} 