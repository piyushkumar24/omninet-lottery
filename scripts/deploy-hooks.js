#!/usr/bin/env node

/**
 * Deployment Hooks Script
 * 
 * This script runs pre and post deployment tasks to ensure smooth operation
 * of the application, particularly focusing on database connections.
 * 
 * Usage:
 *   node scripts/deploy-hooks.js pre   # Run pre-deployment tasks
 *   node scripts/deploy-hooks.js post  # Run post-deployment tasks
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Maximum time to wait for database connection (in ms)
const CONNECTION_TIMEOUT = 30000;

/**
 * Perform a database health check
 */
async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    // Set a timeout for the connection attempt
    const connectionPromise = prisma.$queryRaw`SELECT 1 as connection_test`;
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), CONNECTION_TIMEOUT)
    );
    
    // Race the connection promise against the timeout
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (result && result[0] && result[0].connection_test === 1) {
      console.log('✅ Database connection is healthy');
      return true;
    } else {
      console.error('❌ Database connection test returned unexpected result:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  console.log('🔄 Initializing database connection...');
  
  try {
    // Warm up the connection pool
    await prisma.$connect();
    
    // Perform simple queries to initialize connection pool
    await prisma.$queryRaw`SELECT NOW()`;
    
    console.log('✅ Database connection pool initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    return false;
  }
}

/**
 * Execute pre-deployment tasks
 */
async function preDeployment() {
  console.log('🚀 Running pre-deployment tasks...');
  
  // Check database connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Pre-deployment database check failed');
    process.exit(1);
  }
  
  console.log('✅ Pre-deployment tasks completed successfully');
}

/**
 * Execute post-deployment tasks
 */
async function postDeployment() {
  console.log('🏁 Running post-deployment tasks...');
  
  // Initialize database connection pool
  const initialized = await initializeDatabase();
  if (!initialized) {
    console.error('❌ Post-deployment database initialization failed');
    process.exit(1);
  }
  
  // Verify database connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Post-deployment database check failed');
    process.exit(1);
  }
  
  console.log('✅ Post-deployment tasks completed successfully');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const stage = args[0]?.toLowerCase();
  
  try {
    if (stage === 'pre') {
      await preDeployment();
    } else if (stage === 'post') {
      await postDeployment();
    } else {
      console.error('❌ Invalid argument. Use "pre" or "post".');
      process.exit(1);
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
    console.log(`✨ ${process.argv[2]} deployment tasks completed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 