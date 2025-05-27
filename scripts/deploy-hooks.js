#!/usr/bin/env node

/**
 * Deployment Hooks
 * 
 * This script runs before and after deployment to handle database connection issues
 * and other deployment-related tasks.
 * 
 * Usage:
 *   node scripts/deploy-hooks.js pre|post
 */

const { PrismaClient } = require('@prisma/client');

// Determine if we're running in a serverless environment like Vercel
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Handle pre-deployment tasks
async function preDeployTasks() {
  console.log('Running pre-deployment tasks...');
  
  if (isServerless) {
    console.log('Serverless environment detected (Vercel)');
    configureDatabaseConnection();
  }
  
  // Additional pre-deployment tasks can be added here
  try {
    await validateDatabaseConnection();
  } catch (error) {
    console.error('Database validation failed, but continuing deployment:', error.message);
  }
  
  console.log('Pre-deployment tasks completed');
}

// Handle post-deployment tasks
async function postDeployTasks() {
  console.log('Running post-deployment tasks...');
  
  if (isServerless) {
    console.log('Warming up serverless environment...');
    try {
      await warmupDatabase();
    } catch (error) {
      console.error('Database warmup failed:', error.message);
    }
  }
  
  console.log('Post-deployment tasks completed');
}

// Configure database connection for optimal performance in serverless environments
function configureDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    return;
  }

  try {
    // Parse the current DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
    
    // Add connection pool parameters for better serverless performance
    const params = new URLSearchParams(url.search);
    
    // Set optimal connection pool settings for serverless
    params.set('connection_limit', '5');
    params.set('pool_timeout', '10');
    params.set('idle_timeout', '30');
    params.set('connect_timeout', '10');
    
    // Update the URL
    url.search = params.toString();
    process.env.DATABASE_URL = url.toString();
    
    console.log('DATABASE_URL configured for serverless environment');
    
    // Set DIRECT_URL if not already set (useful for Prisma direct connections)
    if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
      console.log('DIRECT_URL set to match DATABASE_URL');
    }
  } catch (error) {
    console.error('Error configuring DATABASE_URL:', error);
  }
}

// Validate database connection before deployment
async function validateDatabaseConnection() {
  console.log('Validating database connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    console.log('Database query successful:', result);
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Warm up database connection after deployment
async function warmupDatabase() {
  console.log('Warming up database connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  try {
    await prisma.$connect();
    console.log('Database connection established');
    
    // Perform some simple queries to warm up the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database warmed up successfully');
    
    return true;
  } catch (error) {
    console.error('Database warmup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const mode = process.argv[2];

if (mode === 'pre') {
  preDeployTasks().catch(error => {
    console.error('Pre-deployment tasks failed:', error);
    process.exit(1);
  });
} else if (mode === 'post') {
  postDeployTasks().catch(error => {
    console.error('Post-deployment tasks failed:', error);
    process.exit(1);
  });
} else {
  console.error('Invalid mode. Use "pre" or "post"');
  process.exit(1);
} 