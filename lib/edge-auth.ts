/**
 * Edge-compatible authentication utilities
 * 
 * This module provides functions for authentication that are safe to use
 * in Edge Runtime (middleware, edge API routes, etc.)
 * It avoids direct use of PrismaClient which is not supported in Edge Runtime.
 */

import { UserRole } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Check if the current user has admin role
 * This is safe to use in middleware as it doesn't use PrismaClient
 */
export async function isAdminInEdge(req: NextRequest): Promise<boolean> {
  try {
    const token = await getToken({ req });
    return token?.role === UserRole.ADMIN;
  } catch (error) {
    console.error("Error checking admin status in Edge:", error);
    return false;
  }
}

/**
 * Get user details from JWT token
 * This is safe to use in middleware as it doesn't use PrismaClient
 */
export async function getUserFromToken(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) return null;

    return {
      id: token.sub,
      name: token.name,
      email: token.email,
      role: token.role as UserRole,
      isBlocked: token.isBlocked as boolean,
      isTwoFactorEnabled: token.isTwoFactorEnabled as boolean,
      hasWon: token.hasWon as boolean,
    };
  } catch (error) {
    console.error("Error getting user from token in Edge:", error);
    return null;
  }
} 