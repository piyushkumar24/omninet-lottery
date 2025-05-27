/**
 * Application Startup Utilities
 * 
 * This module contains functions for initializing the application
 * during startup, such as establishing database connections and
 * performing health checks.
 */

import { testConnectionWithRetry, initializeDatabase } from './db-utils';
import { validateEnvironment } from './env-validation';
import { db } from './db';
import { startConnectionMonitoring, stopConnectionMonitoring } from './db-monitor';
import logger from './logger';

// Store monitoring interval ID for cleanup
let monitoringIntervalId: NodeJS.Timeout | null = null;

/**
 * Initialize the application
 * This function should be called during application startup
 */
export async function initializeApplication() {
  logger.info('Initializing application...', 'STARTUP');
  
  try {
    // Validate environment variables
    validateEnvironment();
    logger.debug('Environment validation passed', 'STARTUP');
    
    // Test database connection with retry
    const isConnected = await testConnectionWithRetry();
    
    if (!isConnected) {
      logger.error('Failed to establish database connection after retries', null, 'STARTUP');
      return false;
    }
    
    logger.debug('Database connection established', 'STARTUP');
    
    // Initialize database defaults if needed
    await initializeDatabase();
    logger.debug('Database initialization complete', 'STARTUP');
    
    // Start database connection monitoring
    if (process.env.NODE_ENV === 'production') {
      // In production, check every minute
      monitoringIntervalId = startConnectionMonitoring(60000);
      logger.debug('Database monitoring started (production mode)', 'STARTUP');
    } else {
      // In development, check every 5 minutes
      monitoringIntervalId = startConnectionMonitoring(300000);
      logger.debug('Database monitoring started (development mode)', 'STARTUP');
    }
    
    logger.info('Application initialization completed', 'STARTUP');
    return true;
  } catch (error) {
    logger.error('Application initialization failed', error, 'STARTUP');
    return false;
  }
}

/**
 * Gracefully shutdown the application
 */
export async function shutdownApplication() {
  try {
    logger.info('Shutting down application...', 'SHUTDOWN');
    
    // Stop database monitoring
    if (monitoringIntervalId) {
      stopConnectionMonitoring(monitoringIntervalId);
      logger.debug('Database monitoring stopped', 'SHUTDOWN');
    }
    
    // Close database connections
    await db.$disconnect();
    logger.debug('Database connections closed', 'SHUTDOWN');
    
    logger.info('Application shutdown completed', 'SHUTDOWN');
    return true;
  } catch (error) {
    logger.error('Application shutdown failed', error, 'SHUTDOWN');
    return false;
  }
}

/**
 * Warmup database connection
 * This function can be called periodically to keep database connections warm
 */
export async function warmupDatabaseConnection() {
  try {
    logger.debug('Warming up database connection', 'DB');
    await testConnectionWithRetry();
    logger.debug('Database connection warmup successful', 'DB');
    return true;
  } catch (error) {
    logger.error('Database warmup failed', error, 'DB');
    return false;
  }
} 