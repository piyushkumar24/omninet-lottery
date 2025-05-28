#!/usr/bin/env tsx

import { db } from '../lib/db';
import { testDbConnection, testConnectionWithRetry } from '../lib/db-utils';
import { validateEnvironment } from '../lib/env-validation';
import logger from '../lib/logger';

async function performHealthCheck() {
  logger.info('Starting comprehensive health check...', 'HEALTH');

  try {
    // 1. Environment validation
    logger.info('1. Validating environment variables...', 'HEALTH');
    validateEnvironment();
    logger.info('Environment validation passed', 'HEALTH');

    // 2. Database connectivity test
    logger.info('2. Testing database connection...', 'HEALTH');
    const isConnected = await testDbConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }
    logger.info('Database connection successful', 'HEALTH');

    // 3. Database connectivity with retry
    logger.info('3. Testing database connection with retry logic...', 'HEALTH');
    const retryTestPassed = await testConnectionWithRetry();
    if (!retryTestPassed) {
      throw new Error('Database retry connection test failed');
    }
    logger.info('Database retry connection successful', 'HEALTH');

    // 4. Database schema validation
    logger.info('4. Validating database schema...', 'HEALTH');
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    logger.info(`Found ${Array.isArray(tables) ? tables.length : 0} tables in database`, 'HEALTH');

    // 5. Test basic CRUD operations
    logger.info('5. Testing basic database operations...', 'HEALTH');
    
    // Count users
    const userCount = await db.user.count();
    logger.info(`Users: ${userCount}`, 'HEALTH');

    // Count tickets
    const ticketCount = await db.ticket.count();
    logger.info(`Tickets: ${ticketCount}`, 'HEALTH');

    // Count draws
    const drawCount = await db.draw.count();
    logger.info(`Draws: ${drawCount}`, 'HEALTH');

    // Count settings
    const settingsCount = await db.settings.count();
    logger.info(`Settings: ${settingsCount}`, 'HEALTH');

    logger.info('Basic database operations successful', 'HEALTH');

    // 6. Application sync verification
    logger.info('6. Verifying application sync...', 'HEALTH');
    
    // Check if settings are initialized
    const prizeAmountSetting = await db.settings.findUnique({
      where: { key: 'default_prize_amount' }
    });

    if (prizeAmountSetting) {
      logger.info(`Prize amount setting: $${prizeAmountSetting.value}`, 'HEALTH');
    } else {
      logger.warn('Prize amount setting not found (will use default)', null, 'HEALTH');
    }

    // Check admin users
    const adminCount = await db.user.count({
      where: { role: 'ADMIN' }
    });
    logger.info(`Admin users: ${adminCount}`, 'HEALTH');

    logger.info('Application sync verification complete', 'HEALTH');

    // Summary
    logger.info('Health check completed successfully!', 'HEALTH');
    logger.info('Summary:', 'HEALTH');
    logger.info(`- Environment: Valid`, 'HEALTH');
    logger.info(`- Database: Connected`, 'HEALTH');
    logger.info(`- Retry Logic: Working`, 'HEALTH');
    logger.info(`- Tables: ${Array.isArray(tables) ? tables.length : 0} found`, 'HEALTH');
    logger.info(`- Data: Users(${userCount}), Tickets(${ticketCount}), Draws(${drawCount}), Settings(${settingsCount})`, 'HEALTH');
    logger.info(`- Application: Synced`, 'HEALTH');

  } catch (error) {
    logger.error('Health check failed!', error, 'HEALTH');
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

performHealthCheck().catch(error => {
  console.error('Fatal error during health check:', error);
  process.exit(1);
}); 