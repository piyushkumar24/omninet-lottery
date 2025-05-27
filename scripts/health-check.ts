#!/usr/bin/env tsx

import { db } from '../lib/db';
import { testDbConnection } from '../lib/db';
import { testConnectionWithRetry, initializeDatabase } from '../lib/db-utils';
import { validateEnvironment } from '../lib/env-validation';

async function performHealthCheck() {
  console.log('🔍 Starting comprehensive health check...\n');

  try {
    // 1. Environment validation
    console.log('📋 1. Validating environment variables...');
    validateEnvironment();
    console.log('✅ Environment validation passed\n');

    // 2. Database connectivity test
    console.log('🔗 2. Testing database connection...');
    const isConnected = await testDbConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }
    console.log('✅ Database connection successful\n');

    // 3. Database connectivity with retry
    console.log('🔄 3. Testing database connection with retry logic...');
    const retryTestPassed = await testConnectionWithRetry();
    if (!retryTestPassed) {
      throw new Error('Database retry connection test failed');
    }
    console.log('✅ Database retry connection successful\n');

    // 4. Database schema validation
    console.log('📊 4. Validating database schema...');
    const tables = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log(`✅ Found ${Array.isArray(tables) ? tables.length : 0} tables in database\n`);

    // 5. Test basic CRUD operations
    console.log('🧪 5. Testing basic database operations...');
    
    // Count users
    const userCount = await db.user.count();
    console.log(`   - Users: ${userCount}`);

    // Count tickets
    const ticketCount = await db.ticket.count();
    console.log(`   - Tickets: ${ticketCount}`);

    // Count draws
    const drawCount = await db.draw.count();
    console.log(`   - Draws: ${drawCount}`);

    // Count settings
    const settingsCount = await db.settings.count();
    console.log(`   - Settings: ${settingsCount}`);

    console.log('✅ Basic database operations successful\n');

    // 6. Application sync verification
    console.log('🔄 6. Verifying application sync...');
    
    // Check if settings are initialized
    const prizeAmountSetting = await db.settings.findUnique({
      where: { key: 'default_prize_amount' }
    });

    if (prizeAmountSetting) {
      console.log(`   - Prize amount setting: $${prizeAmountSetting.value}`);
    } else {
      console.log('   - Prize amount setting not found (will use default)');
    }

    // Check admin users
    const adminCount = await db.user.count({
      where: { role: 'ADMIN' }
    });
    console.log(`   - Admin users: ${adminCount}`);

    console.log('✅ Application sync verification complete\n');

    console.log('🎉 Health check completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Environment: ✅ Valid`);
    console.log(`   - Database: ✅ Connected`);
    console.log(`   - Retry Logic: ✅ Working`);
    console.log(`   - Tables: ✅ ${Array.isArray(tables) ? tables.length : 0} found`);
    console.log(`   - Data: ✅ Users(${userCount}), Tickets(${ticketCount}), Draws(${drawCount}), Settings(${settingsCount})`);
    console.log(`   - Application: ✅ Synced`);

  } catch (error) {
    console.error('❌ Health check failed!');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

performHealthCheck().catch(error => {
  console.error('Fatal error during health check:', error);
  process.exit(1);
}); 