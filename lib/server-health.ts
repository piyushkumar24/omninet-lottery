import { db } from '@/lib/db';
import { setDbHealthStatus } from '@/middleware/db-middleware';

/**
 * Server-side database health checker
 * This runs in server components/API routes, not in Edge Runtime
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    // Run a simple query to test connection
    await db.$queryRaw`SELECT 1`;
    
    // Update the health status for middleware to access
    setDbHealthStatus(true);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    // Update the health status for middleware to access
    setDbHealthStatus(false);
    
    return false;
  }
}

/**
 * Check if a database health check is needed and perform it if necessary
 * This should be called at the beginning of API routes
 */
export async function ensureDbHealth(): Promise<void> {
  if (global.needsDatabaseCheck) {
    await checkDbHealth();
    global.needsDatabaseCheck = false;
  }
}

/**
 * Initialize the health monitoring system
 * Call this during app startup
 */
export async function initializeHealthMonitoring(): Promise<void> {
  // Set up global variable
  global.needsDatabaseCheck = false;
  
  // Perform initial health check
  await checkDbHealth();
  
  console.log('✅ Database health monitoring initialized');
} 