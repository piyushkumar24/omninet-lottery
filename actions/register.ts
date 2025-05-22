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

  const { email, password, name, referralCode } = validatedFields.data;
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
