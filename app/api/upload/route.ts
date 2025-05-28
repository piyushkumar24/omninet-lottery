import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFileToR2, deleteFileFromR2, isR2Url, checkBucketAccess } from "@/lib/r2";
import { db } from "@/lib/db";

/**
 * Profile Picture Upload API
 * 
 * This endpoint handles uploading profile pictures EXCLUSIVELY to Cloudflare R2 storage.
 * It does NOT fall back to local storage.
 */
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

    // Check R2 bucket access
    const bucketAccessible = await checkBucketAccess();
    if (!bucketAccessible) {
      return NextResponse.json({ 
        error: "R2 bucket is not accessible",
        message: "Please make sure the 'profile-pictures' bucket exists in your Cloudflare R2 dashboard and is properly configured."
      }, { status: 500 });
    }

    // Delete previous profile image from R2 if exists
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { profileImage: true }
    });

    if (user?.profileImage && isR2Url(user.profileImage)) {
      try {
        await deleteFileFromR2(user.profileImage);
        console.log(`Deleted previous profile image from R2: ${user.profileImage}`);
      } catch (error) {
        // Log but continue if deletion fails
        console.error("Error deleting previous profile image from R2:", error);
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload to Cloudflare R2 - no fallback to local storage
    const imageUrl = await uploadFileToR2(
      buffer,
      session.user.id,
      file.type
    );
    
    console.log(`Successfully uploaded profile image to R2: ${imageUrl}`);
    
    return NextResponse.json({ 
      url: imageUrl,
      success: true,
      storageMethod: "r2",
      message: "Profile picture successfully uploaded to R2 storage"
    });
  } catch (error) {
    console.error("Error uploading profile picture to R2:", error);
    
    return NextResponse.json({ 
      error: "Failed to upload profile picture to R2",
      message: error instanceof Error ? error.message : "Unknown error",
      details: "Please check your R2 configuration and bucket settings"
    }, { 
      status: 500 
    });
  }
} 