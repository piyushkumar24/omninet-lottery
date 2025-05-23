import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from '@/auth.config';
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  dashboardRoutes,
} from '@/routes';
import { UserRole } from '@prisma/client';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isStatsRoute = nextUrl.pathname.startsWith("/api/stats");
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);  
  
  const isDashboardRoute = dashboardRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
  );

  // Make the stats API public
  if (isStatsRoute) {
    return NextResponse.next();
  }

  // Handle API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // Check for dashboard routes
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(nextUrl.pathname);
      return Response.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
    }
    
    // Check if user is blocked
    if (req.auth?.user?.isBlocked) {
      return Response.redirect(new URL('/auth/blocked', nextUrl));
    }
    
    return;
  }

  // Handle public routes
  if (isPublicRoute) {
    return;
  }

  // Default: require authentication for any other route
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return Response.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  return;
});

// Matcher configuration to skip middleware for static files and webhooks
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
