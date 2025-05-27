import { NextRequest, NextResponse } from 'next/server';
import { withRetry } from '@/lib/db-utils';
import { ensureDbHealth } from '@/lib/server-health';

type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

// Check if running in Edge Runtime
const isEdgeRuntime = () => {
  return typeof process.env.NEXT_RUNTIME === 'string' && 
         process.env.NEXT_RUNTIME === 'edge';
};

/**
 * Wraps an API handler with error handling and database retry logic
 * @param handler API route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      // Only check DB health in server environment, not in Edge
      if (!isEdgeRuntime()) {
        await ensureDbHealth();
      }
      
      // Execute the handler with retry logic for database operations
      // Only use retry logic in server environment, not in Edge
      if (!isEdgeRuntime()) {
        return await withRetry(
          () => handler(req, ...args),
          3, // Max retries
          500 // Base delay in ms
        );
      } else {
        // In Edge, just run the handler directly
        return await handler(req, ...args);
      }
    } catch (error: any) {
      console.error(`API error: ${error.message}`, error);
      
      // Determine appropriate status code
      let status = 500;
      let message = 'Internal server error';
      
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        status = 404;
        message = 'Resource not found';
      } else if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        status = 401;
        message = 'Unauthorized';
      } else if (error.message?.includes('forbidden')) {
        status = 403;
        message = 'Forbidden';
      } else if (error.message?.includes('validation')) {
        status = 400;
        message = 'Validation error';
      } else if (error.message?.includes('connection') || error.message?.includes('timeout')) {
        status = 503;
        message = 'Database connection error';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message,
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status }
      );
    }
  };
}

/**
 * Creates a protected API handler that requires authentication
 * @param handler API route handler function
 * @returns Wrapped handler with authentication and error handling
 */
export function createProtectedHandler(handler: ApiHandler): ApiHandler {
  const wrappedHandler = withErrorHandling(handler);
  
  return async (req: NextRequest, ...args: any[]) => {
    // Additional authentication logic could be added here
    return wrappedHandler(req, ...args);
  };
} 