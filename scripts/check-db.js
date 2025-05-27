#!/usr/bin/env node

/**
 * Database Connection Check Script
 * 
 * This script performs a health check on the database connection
 * and attempts to reconnect if the connection is broken.
 * 
 * Usage:
 *   node scripts/check-db.js
 */

const { PrismaClient } = require('@prisma/client');

// Create a separate Prisma client for the check
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

// Check if we're running in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Format database URL for display (hide password)
function getSafeDbUrl() {
  if (!process.env.DATABASE_URL) return 'DATABASE_URL not set';
  
  try {
    const url = new URL(process.env.DATABASE_URL);
    // Mask the password
    if (url.password) {
      url.password = '****';
    }
    return url.toString();
  } catch (err) {
    return 'Invalid DATABASE_URL format';
  }
}

// Verify database URL structure
function verifyDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined');
    return false;
  }
  
  try {
    const url = new URL(process.env.DATABASE_URL);
    
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      console.error(`❌ Invalid database protocol: ${url.protocol}`);
      return false;
    }
    
    if (!url.hostname) {
      console.error('❌ Database hostname is missing');
      return false;
    }
    
    console.log(`✅ Database URL format valid: ${getSafeDbUrl()}`);
    
    // Check if the URL includes connection parameters
    if (isServerless && !url.search.includes('connection_limit')) {
      console.log('⚠️ No connection pooling parameters found in DATABASE_URL');
      console.log('   Consider adding connection_limit, pool_timeout, etc.');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Invalid DATABASE_URL format: ${error.message}`);
    return false;
  }
}

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    // Perform a simple database query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    
    if (result && result[0] && result[0].connection_test === 1) {
      console.log('✅ Database connection is healthy');
      
      // Get Prisma connection stats (only available with metrics feature enabled)
      try {
        const metrics = await prisma.$metrics.json();
        if (metrics && metrics.counters) {
          console.log('📊 Connection metrics:');
          console.log(`   - Queries executed: ${metrics.counters.queries_total || 'N/A'}`);
          console.log(`   - Active connections: ${metrics.gauges.active_connections || 'N/A'}`);
        }
      } catch (metricsError) {
        // Metrics may not be available if preview feature isn't enabled
      }
      
      return true;
    } else {
      console.error('❌ Database connection test returned unexpected result:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

async function attemptReconnect(attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    console.log(`🔄 Attempting to reconnect (${i}/${attempts})...`);
    
    try {
      // Disconnect first to clean up any existing connections
      await prisma.$disconnect();
      
      // Short delay before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconnect
      await prisma.$connect();
      
      // Test the connection
      const isConnected = await checkDatabaseConnection();
      
      if (isConnected) {
        console.log('🎉 Successfully reconnected to database');
        return true;
      }
    } catch (error) {
      console.error(`❌ Reconnection attempt ${i} failed:`, error.message);
    }
    
    // Exponential backoff
    const delay = 1000 * Math.pow(2, i - 1);
    console.log(`⏱️ Waiting ${delay}ms before next attempt...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  console.error('❌ Failed to reconnect after multiple attempts');
  return false;
}

async function main() {
  try {
    console.log('🚀 Starting database connection check');
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`🖥️ Serverless: ${isServerless ? 'Yes' : 'No'}`);
    
    // Verify database URL format
    const isValidUrl = verifyDatabaseUrl();
    if (!isValidUrl) {
      console.error('❌ Invalid database URL, check your environment variables');
      process.exit(1);
    }
    
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      console.log('🔌 Connection is not healthy, attempting to reconnect...');
      await attemptReconnect();
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('✨ Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 