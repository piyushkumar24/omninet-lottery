"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { 
    email, 
    password, 
    name, 
    referralCode, 
    agreeToUpdates, 
    subscribeNewsletter, 
    captchaToken 
  } = validatedFields.data;

  // Verify reCAPTCHA
  if (!captchaToken || captchaToken.trim() === '') {
    return { error: "Please complete the reCAPTCHA verification." };
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not configured");
      return { error: "Server configuration error. Please try again." };
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    
    const verifyData = new URLSearchParams({
      secret: secretKey,
      response: captchaToken,
    });

    const captchaResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyData,
    });

    if (!captchaResponse.ok) {
      console.error("Google reCAPTCHA API response not OK:", captchaResponse.status);
      return { error: "reCAPTCHA verification failed. Please try again." };
    }

    const captchaResult = await captchaResponse.json();

    if (!captchaResult.success) {
      console.error("Captcha verification failed:", captchaResult["error-codes"] || "Unknown error");
      return { error: "reCAPTCHA verification failed. Please try again." };
    }
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return { error: "Error verifying reCAPTCHA. Please try again." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // Check for referral code
  let referredBy = null;
  if (referralCode) {
    const referrer = await db.user.findUnique({
      where: {
        referralCode: referralCode,
      },
      select: {
        id: true,
      },
    });

    if (referrer) {
      referredBy = referrer.id;
    }
  }

  // Create the user
  const newUser = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      referredBy,
      // Store newsletter subscription preference
      // Note: You might want to add a newsletter field to your user schema
    },
  });

  // If this was a referral, create a ticket for the referrer
  if (referredBy) {
    await db.ticket.create({
      data: {
        userId: referredBy,
        source: "REFERRAL",
        isUsed: false,
      },
    });
  }

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
  );

  return { success: "Confirmation email sent!" };
};
