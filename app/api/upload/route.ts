import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('image') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create filename with timestamp and user ID for uniqueness
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const filename = `profile-${session.user.id}-${timestamp}${fileExtension}`;
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await writeFile(path.join(uploadsDir, filename), buffer);
    } catch (error) {
      // If directory doesn't exist, create it and try again
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        await writeFile(path.join(uploadsDir, filename), buffer);
      } else {
        throw error;
      }
    }

    const imageUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      url: imageUrl,
      filename: filename 
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 