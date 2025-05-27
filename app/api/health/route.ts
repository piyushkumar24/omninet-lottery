import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { testDbConnection } from "@/lib/db";
import { getConnectionMetrics } from "@/lib/db-monitor";
import { validateEnvironment, getAppConfig } from "@/lib/env-validation";
import logger from "@/lib/logger";

/**
 * GET /api/health
 * 
 * General health check endpoint that returns basic system status.
 * This endpoint is publicly accessible and provides limited information
 * about system health without exposing sensitive details.
 */
export async function GET() {
  try {
    logger.info('Health check requested', 'API');
    
    // Perform a simple database connection test
    const dbConnected = await testDbConnection();
    
    // Get current metrics (limited information for public endpoint)
    const metrics = getConnectionMetrics();
    
    // Get application configuration
    const appConfig = getAppConfig();
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      status: dbConnected ? "healthy" : "degraded",
      environment: appConfig.nodeEnv,
      services: {
        database: {
          connected: dbConnected,
          status: metrics.status
        },
        api: {
          status: "operational"
        }
      }
    };
    
    logger.info(`Health check result: ${response.status}`, 'API');
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Health check failed", error, 'API');
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        status: "unhealthy",
        message: "System health check failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Configure this route to skip authentication
export const config = {
  auth: false
}; 