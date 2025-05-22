import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  adminRoutes,
  dashboardRoutes,
} from '@/routes';
import { UserRole } from '@prisma/client';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = adminRoutes.some(route => nextUrl.pathname.startsWith(route));
  const isDashboardRoute = dashboardRoutes.some(route => nextUrl.pathname.startsWith(route));

  // Check for admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/auth/login', nextUrl));
    }
    
    const userRole = req.auth?.user?.role;
    
    if (userRole !== UserRole.ADMIN) {
      return Response.redirect(new URL('/dashboard', nextUrl));
    }
    
    return;
  }

  // Check for dashboard routes
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
    }
    
    // Check if user is blocked
    if (req.auth?.user?.isBlocked) {
      return Response.redirect(new URL('/auth/blocked', nextUrl));
    }
    
    return;
  }

  if (isApiAuthRoute) {
    // Do nothing for API auth routes
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect logged-in users away from auth routes
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    // Allow unauthenticated users to access auth routes
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    // Redirect unauthenticated users to the login page
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Allow access to public routes or logged-in users
  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
