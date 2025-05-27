import { NextResponse } from "next/server";
import { getConnectionMetrics, checkConnectionHealth } from "@/lib/db-monitor";
import { testConnectionWithRetry } from "@/lib/db-utils";
import { getCurrentUser } from "@/lib/auth";
import logger from "@/lib/logger";

/**
 * GET /api/health/database
 * 
 * Database health check endpoint that returns current connection status
 * and metrics. This endpoint is restricted to admin users only.
 */
export async function GET() {
  try {
    logger.info('Database health check requested', 'API');
    
    // Check if user is authenticated and is an admin
    const user = await getCurrentUser();
    
    if (!user || user.role !== "ADMIN") {
      logger.warn('Unauthorized database health check attempt', { userId: user?.id }, 'API');
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Admin access required.",
        },
        { status: 401 }
      );
    }
    
    // Perform a real-time connection check
    await checkConnectionHealth();
    
    // Get current metrics
    const metrics = getConnectionMetrics();
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        status: metrics.status,
        metrics: {
          checkCount: metrics.checkCount,
          successCount: metrics.successCount,
          failureCount: metrics.failureCount,
          successRate: metrics.successRate.toFixed(2) + '%',
          averageLatency: metrics.averageLatency.toFixed(2) + 'ms',
          lastChecked: metrics.lastChecked,
        }
      }
    };
    
    logger.info(`Database health check result: ${metrics.status}`, 'API');
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Database health check failed", error, 'API');
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 