import { db } from './db';
import logger from './logger';

// Retry configuration for database operations
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
};

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get exponential backoff delay
const getRetryDelay = (attempt: number) => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt), 
    RETRY_CONFIG.maxDelay
  );
  
  // Add some randomness to prevent multiple retries happening simultaneously
  return delay + (Math.random() * 100);
};

// Determine if an error is retryable
const isRetryableError = (error: any): boolean => {
  // If it's a Prisma error, check the error code
  if (error?.name === 'PrismaClientKnownRequestError') {
    // Common Prisma error codes that are retryable:
    // P1001: Can't reach database server
    // P1002: Database connection timed out
    // P1008: Operations timed out
    // P1017: Server closed the connection
    const retryablePrismaErrorCodes = ['P1001', 'P1002', 'P1008', 'P1017'];
    return retryablePrismaErrorCodes.includes(error.code);
  }
  
  // Check for common Node.js network errors
  if (error?.code) {
    const retryableNodeErrorCodes = [
      'ECONNRESET', 'ENOTFOUND', 'ESOCKETTIMEDOUT', 'ETIMEDOUT', 
      'ECONNREFUSED', 'EHOSTUNREACH', 'EAI_AGAIN', 'EPIPE'
    ];
    return retryableNodeErrorCodes.includes(error.code);
  }
  
  // Check error message for common connection issues
  if (error?.message && typeof error.message === 'string') {
    const retryableErrorMessages = [
      'connection timeout',
      'connection refused',
      'network timeout',
      'timeout',
      'timed out',
      'socket hang up',
      'socket timeout',
      'cannot connect',
      'unable to connect',
      'failed to connect',
      'database connection',
      'network error',
      'request timed out',
      'connection error',
      'offline',
      'server closed',
      'connection lost',
      'connection dropped'
    ];
    
    const errorMsg = error.message.toLowerCase();
    return retryableErrorMessages.some(msg => errorMsg.includes(msg));
  }
  
  return false;
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
        logger.error(`${operationName} failed after ${attempt + 1} attempts`, error, 'DB');
        throw error;
      }
      
      const delay = getRetryDelay(attempt);
      logger.warn(
        `${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${delay.toFixed(0)}ms`,
        error instanceof Error ? error.message : String(error),
        'DB'
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// Database query with retry
export const dbQueryWithRetry = <T>(
  query: () => Promise<T>,
  operationName: string = 'Database query'
): Promise<T> => {
  return withRetry(query, operationName);
};

// Test database connection
export const testDbConnection = async (): Promise<boolean> => {
  try {
    // Simple query to check connection
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error, 'DB');
    return false;
  }
};

// Test connection with retry
export const testConnectionWithRetry = async (): Promise<boolean> => {
  try {
    await dbQueryWithRetry(() => db.$queryRaw`SELECT 1`, 'Connection test');
    return true;
  } catch (error) {
    return false;
  }
};

// Initialize database defaults
export const initializeDatabase = async (): Promise<void> => {
  try {
    logger.info('Initializing database defaults', 'DB');
    
    // Check if default prize amount setting exists
    const prizeAmountSetting = await db.settings.findUnique({
      where: { key: 'default_prize_amount' }
    });
    
    // Create default prize amount setting if it doesn't exist
    if (!prizeAmountSetting) {
      await db.settings.create({
        data: {
          key: 'default_prize_amount',
          value: '50', // Default $50 prize
          description: 'Default prize amount for lottery draws'
        }
      });
      logger.info('Created default prize amount setting', 'DB');
    }
    
    // Additional initialization can be added here
    
    logger.info('Database initialization completed', 'DB');
  } catch (error) {
    logger.error('Database initialization failed', error, 'DB');
    throw error;
  }
};

// Graceful database shutdown
export const shutdownDatabase = async (): Promise<void> => {
  try {
    await db.$disconnect();
    logger.info('Database connection closed gracefully', 'DB');
  } catch (error) {
    logger.error('Error during database shutdown', error, 'DB');
  }
}; 