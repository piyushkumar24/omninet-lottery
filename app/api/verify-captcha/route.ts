import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { captchaToken } = await request.json();

    if (!captchaToken) {
      return NextResponse.json(
        { success: false, message: "Captcha token is missing" },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not configured");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    
    const verifyData = new URLSearchParams({
      secret: secretKey,
      response: captchaToken,
    });

    const captchaRes = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyData,
    });

    const captchaResult = await captchaRes.json();

    if (!captchaResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Captcha verification failed",
          errors: captchaResult["error-codes"] || []
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Captcha verified successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error verifying captcha:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 