import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/db-utils";
import { checkDbHealth } from "@/lib/server-health";
import { getDbHealthStatus } from "@/middleware/db-middleware";

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Health check endpoint that returns the status of various application components
 */
export async function GET() {
  try {
    // Check database connection using server-side code
    const isDbConnected = await checkDbHealth();
    
    // Get the connection status data
    const dbStatus = await checkConnection();
    
    // Define overall system health
    const isHealthy = isDbConnected;
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      components: {
        database: {
          status: isDbConnected ? 'healthy' : 'unhealthy',
          latency: dbStatus.latency,
          lastChecked: dbStatus.lastChecked,
          error: dbStatus.errorMessage
        }
      }
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Error running health check',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Configure this route to skip authentication
export const config = {
  auth: false
}; 