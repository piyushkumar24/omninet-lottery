#!/usr/bin/env tsx

/**
 * Server Initialization Script
 * 
 * This script is used to initialize the server environment before starting the application.
 * It performs environment validation, database connectivity checks, and initializes
 * default settings.
 */

import { initializeApplication, shutdownApplication } from '../lib/startup';
import logger from '../lib/logger';

async function main() {
  logger.info('Starting server initialization...', 'SERVER');
  
  try {
    // Initialize application
    const initSuccess = await initializeApplication();
    
    if (!initSuccess) {
      logger.error('Server initialization failed due to application initialization error', null, 'SERVER');
      process.exit(1);
    }
    
    logger.info('Server initialization completed successfully', 'SERVER');
    process.exit(0);
  } catch (error) {
    logger.error('Server initialization error', error, 'SERVER');
    
    // Attempt to gracefully shutdown
    await shutdownApplication().catch(err => {
      logger.error('Failed to shutdown cleanly', err, 'SERVER');
    });
    
    process.exit(1);
  }
}

// Run the initialization
main().catch((error) => {
  logger.error('Fatal error', error, 'SERVER');
  process.exit(1);
}); 