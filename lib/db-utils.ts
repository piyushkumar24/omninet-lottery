import { db } from './db';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
};

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  
  // Common retryable database errors
  const retryablePatterns = [
    'can\'t reach database server',
    'connection timeout',
    'connection refused',
    'network error',
    'connection lost',
    'connection terminated',
    'socket hang up',
    'enotfound',
    'etimedout',
    'econnrefused',
    'econnreset',
  ];
  
  // Prisma specific retryable error codes
  const retryableErrorCodes = [
    'P1001', // Can't reach database server
    'P1002', // Database server timeout
    'P1008', // Operations timed out
    'P1017', // Server has closed the connection
  ];
  
  return retryablePatterns.some(pattern => errorMessage.includes(pattern)) ||
         retryableErrorCodes.includes(errorCode);
};

// Generic retry wrapper for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
        // Log the final error
        console.error(`❌ ${operationName} failed after ${attempt + 1} attempts:`, error);
        throw error;
      }
      
      const delay = getRetryDelay(attempt);
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${delay}ms...`);
      console.warn('Error:', error instanceof Error ? error.message : String(error));
      
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Database query with retry
export const dbQueryWithRetry = async <T>(
  query: () => Promise<T>,
  queryName: string = 'Query'
): Promise<T> => {
  return withRetry(query, `Database ${queryName}`);
};

// Test database connection with retry
export const testConnectionWithRetry = async (): Promise<boolean> => {
  try {
    await withRetry(
      async () => {
        await db.$queryRaw`SELECT 1`;
      },
      'Database connection test'
    );
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  console.log('🔄 Initializing database connection...');
  
  const isConnected = await testConnectionWithRetry();
  
  if (!isConnected) {
    throw new Error('Failed to establish database connection after retries');
  }
  
  console.log('✅ Database connection initialized successfully');
};

// Graceful database shutdown
export const shutdownDatabase = async (): Promise<void> => {
  try {
    await db.$disconnect();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
  }
}; 