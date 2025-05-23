import * as z from "zod";
import { UserRole } from "@prisma/client";

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false;
    }

    return true;
  }, {
    message: "New password is required!",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false;
    }

    return true;
  }, {
    message: "Password is required!",
    path: ["password"]
  })

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password confirmation is required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
  referralCode: z.optional(z.string()),
  agreeToUpdates: z.boolean().refine((val) => val === true, {
    message: "You must agree to receive lottery updates",
  }),
  subscribeNewsletter: z.optional(z.boolean()),
  captchaToken: z.string().min(1, {
    message: "Please complete the reCAPTCHA verification",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const LotteryParticipationSchema = z.object({
  ticketsToUse: z.number().min(1, {
    message: "You must use at least 1 ticket",
  }).max(1000, {
    message: "Maximum 1000 tickets allowed per participation",
  }),
  drawId: z.string().min(1, {
    message: "Draw ID is required",
  }),
});
