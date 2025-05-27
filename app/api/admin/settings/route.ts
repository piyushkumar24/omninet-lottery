import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

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
    
    const settings = await db.settings.findMany({
      orderBy: {
        key: "asc"
      }
    });

    // Convert to key-value object for easier access
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      settings: settingsObject,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const { key, value, description } = await request.json();

    if (!key || !value) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Key and value are required",
        }),
        { status: 400 }
      );
    }

    // Upsert the setting
    const setting = await db.settings.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      setting,
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Internal error",
      }),
      { status: 500 }
    );
  }
} 