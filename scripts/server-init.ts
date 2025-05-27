#!/usr/bin/env tsx

/**
 * Server Initialization Script
 * 
 * This script is used to initialize the server environment before starting the application.
 * It performs environment validation, database connectivity checks, and initializes
 * default settings.
 */

import { validateEnvironment } from '../lib/env-validation';
import { initializeDatabase } from '../lib/db-utils';
import { initializeHealthMonitoring } from '../lib/server-health';
import logger from '../lib/logger';
import '../lib/prisma-log-config'; // Import to ensure logging config is loaded early

// Configure database URL for connection pooling if not already set
function setupDatabaseConnectionPool() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
    try {
      // Parse current DATABASE_URL
      const url = new URL(process.env.DATABASE_URL);
      
      // Add connection pooling parameters for better serverless performance
      // These parameters help manage connections in environments like Vercel
      const params = new URLSearchParams(url.search);
      params.set('connection_limit', '5');
      params.set('pool_timeout', '10');
      params.set('idle_timeout', '30');
      
      // Update the URL
      url.search = params.toString();
      process.env.DATABASE_URL = url.toString();
      
      console.log('Added connection pooling parameters to DATABASE_URL');
    } catch (error) {
      console.error('Error modifying DATABASE_URL:', error);
      // Continue with original DATABASE_URL
    }
  }
}

async function main() {
  logger.info('Starting server initialization...', 'SERVER');
  
  // Disable noisy Prisma query logs if environment variable is not explicitly set
  if (process.env.PRISMA_LOG_QUERIES !== 'true') {
    process.env.PRISMA_LOG_QUERIES = 'false';
  }
  
  try {
    // Setup database connection pooling
    setupDatabaseConnectionPool();
    
    // Validate environment variables
    logger.info('Initializing application...', 'STARTUP');
    validateEnvironment();
    logger.info('Environment validation passed', 'STARTUP');

    // Initialize database connection
    try {
      // Check database connection
      const dbResult = await initializeDatabase();
      logger.info('Database connection established', 'STARTUP');
      logger.info('Database initialization complete', 'STARTUP');

      // Set up health monitoring
      await initializeHealthMonitoring();
      logger.info('Database monitoring started (development mode)', 'STARTUP');
    } catch (dbError) {
      logger.error('Database initialization failed', dbError, 'STARTUP');
      // Allow server to start even with DB issues - it will retry connections
    }

    logger.info('Application initialization completed', 'STARTUP');
    logger.info('Server initialization completed successfully', 'SERVER');
  } catch (error) {
    logger.error('Server initialization failed', error, 'SERVER');
    process.exit(1);
  }
}

// Run the initialization
main().catch(error => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
}); 