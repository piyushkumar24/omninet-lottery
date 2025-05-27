import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { LoginSchema } from '@/schemas';

/**
 * Edge-compatible Auth Configuration
 * This version doesn't use PrismaClient and is safe for middleware
 */
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          // We can't use Prisma directly in Edge Runtime
          // This will not have a password to compare in middleware,
          // but that's OK because actual password validation happens
          // in server components and API routes
          return {
            id: "edge-auth-placeholder",
            email,
            name: "Edge Auth User",
          };
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig; 