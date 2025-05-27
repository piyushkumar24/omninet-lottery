import { db } from '@/lib/db';
import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Database connection status interface
 */
interface ConnectionStatus {
  isConnected: boolean;
  latency: number | null;
  lastChecked: Date;
  errorMessage?: string;
}

// Track the connection status
let connectionStatus: ConnectionStatus = {
  isConnected: false,
  latency: null,
  lastChecked: new Date(0), // Initialize with epoch time
};

/**
 * Check database connection and measure latency
 * @returns Connection status object
 */
export async function checkConnection(): Promise<ConnectionStatus> {
  const startTime = Date.now();
  
  try {
    // Perform a simple query to test connection
    await db.$queryRaw`SELECT 1`;
    
    const endTime = Date.now();
    connectionStatus = {
      isConnected: true,
      latency: endTime - startTime,
      lastChecked: new Date(),
    };
    
    return connectionStatus;
  } catch (error: any) {
    connectionStatus = {
      isConnected: false,
      latency: null,
      lastChecked: new Date(),
      errorMessage: error.message || 'Unknown database error',
    };
    
    console.error('Database connection check failed:', error);
    return connectionStatus;
  }
}

/**
 * Get the current connection status without performing a check
 * @returns Current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Execute a database operation with retry logic
 * @param operation Function that performs a database operation
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Delay between retries in ms
 * @returns Result of the database operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a connection-related error
      const isConnectionError = 
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('Closed');
      
      // If it's not a connection error or we've used all retries, throw
      if (!isConnectionError || attempt > maxRetries) {
        throw error;
      }
      
      // Log the retry attempt
      console.warn(
        `Database operation failed (attempt ${attempt}/${maxRetries + 1}). Retrying in ${retryDelay}ms...`,
        error.message
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw lastError;
}

/**
 * Safely disconnect from the database
 */
export async function disconnectSafely(): Promise<void> {
  try {
    await db.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

/**
 * Safely reconnect to the database
 */
export async function reconnectSafely(): Promise<ConnectionStatus> {
  try {
    await disconnectSafely();
    
    // Force a new connection
    await db.$connect();
    
    return await checkConnection();
  } catch (error) {
    console.error('Error reconnecting to database:', error);
    connectionStatus.isConnected = false;
    connectionStatus.errorMessage = 'Failed to reconnect to database';
    connectionStatus.lastChecked = new Date();
    return connectionStatus;
  }
}

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
export const withRetryWrapper = async <T>(
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
  return withRetryWrapper(query, operationName);
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