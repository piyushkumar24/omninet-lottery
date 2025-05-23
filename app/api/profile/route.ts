import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function generateUsername(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}-${randomSuffix}`;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        drawParticipations: {
          include: {
            draw: true
          },
          orderBy: {
            participatedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate username if not exists
    if (!user.username && user.name) {
      let newUsername = generateUsername(user.name);
      
      // Ensure username is unique
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existingUser = await db.user.findUnique({
          where: { username: newUsername }
        });
        
        if (!existingUser) {
          isUnique = true;
        } else {
          newUsername = generateUsername(user.name);
          attempts++;
        }
      }

      // Update user with generated username
      await db.user.update({
        where: { id: user.id },
        data: { username: newUsername }
      });

      user.username = newUsername;
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      drawParticipations: user.drawParticipations
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, profileImage } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    // Check if username is unique (if provided and different from current)
    if (username?.trim()) {
      const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { username: true }
      });

      if (username !== currentUser?.username) {
        const existingUser = await db.user.findUnique({
          where: { username: username.trim() }
        });

        if (existingUser) {
          return NextResponse.json(
            { message: "Username already taken" }, 
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      ...(profileImage && { profileImage }),
    };

    // Only update username if provided
    if (username?.trim()) {
      updateData.username = username.trim();
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      include: {
        drawParticipations: {
          include: {
            draw: true
          },
          orderBy: {
            participatedAt: 'desc'
          }
        }
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username,
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt,
      drawParticipations: updatedUser.drawParticipations
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 