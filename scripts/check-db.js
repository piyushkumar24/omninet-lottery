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
const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...');
  
  try {
    // Perform a simple database query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    
    if (result && result[0] && result[0].connection_test === 1) {
      console.log('✅ Database connection is healthy');
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