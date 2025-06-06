import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { Account, User, Session } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { db } from '@/lib/db';
import authConfig from '@/auth.config';
import authEdgeConfig from '@/auth.edge-config';
import { getUserById } from '@/data/user';
import { getAccountByUserId } from './data/account';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';

// Check if running in Edge Runtime
const isEdgeRuntime = () => {
  return typeof process.env.NEXT_RUNTIME === 'string' && 
         process.env.NEXT_RUNTIME === 'edge';
};

declare module "next-auth" {
  interface Session {
    user: {
      image: any;
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
      isTwoFactorEnabled: boolean;
      isOAuth: boolean;
      isBlocked: boolean;
      hasWon?: boolean;
    }
  }
}

// Server-side auth options with full functionality
export const authOptions: any = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  events: {
    async linkAccount({ user }: { user: User }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      // Allow OAuth without email verification
      if (account?.provider !== 'credentials') return true;

      if (!user.id) {
        return false; // Reject sign-in if user ID is undefined
      }

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;
      
      // Prevent sign in if user is blocked
      if (existingUser.isBlocked) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        if (!twoFactorConfirmation) return false;

        // Delete two-factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.isBlocked = token.isBlocked as boolean;
        session.user.hasWon = token.hasWon as boolean;
      }

      return session;
    },
    async jwt({ token }: { token: JWT }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      token.isBlocked = existingUser.isBlocked;
      token.hasWon = existingUser.hasWon;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
};

// Use edge config in Edge Runtime, otherwise use server config
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = isEdgeRuntime() 
  ? NextAuth(authEdgeConfig) 
  : NextAuth(authOptions);
