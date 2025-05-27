import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Track the health status of the database
let isDbHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Database connection middleware
 * This middleware doesn't directly use Prisma to avoid Edge Runtime issues
 * Instead, it will track connection status based on API responses
 */
export async function dbMiddleware(req: NextRequest) {
  const now = Date.now();
  
  // Only check health periodically to avoid overloading the database
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    lastHealthCheck = now;
    
    // Instead of checking directly, we'll set a flag to check on the next API call
    // The API layer will handle the actual database connection check
    global.needsDatabaseCheck = true;
  }
  
  // Continue processing the request
  return NextResponse.next();
}

// Export functions to manage database health status from server components
export function setDbHealthStatus(status: boolean) {
  isDbHealthy = status;
  lastHealthCheck = Date.now();
}

export function getDbHealthStatus(): boolean {
  return isDbHealthy;
}

// Declare global variable for tracking database check needs
declare global {
  var needsDatabaseCheck: boolean;
} 