import { PrismaClient } from '@prisma/client';
import { prismaLogConfig } from './prisma-log-config';

declare global {
  var prisma: PrismaClient | undefined;
}

// Check if running in Edge Runtime to avoid PrismaClient initialization
const isEdgeRuntime = () => {
  return typeof process.env.NEXT_RUNTIME === 'string' && 
         process.env.NEXT_RUNTIME === 'edge';
};

// Connection retry settings
const MAX_RETRIES = 3; // Reduced from 5 to avoid excessive retries
const RETRY_DELAY_MS = 500; // Reduced delay

// Connection error handler function (server-side only)
const handleConnectionError = async (error: any, operation: Function, attempt = 1): Promise<any> => {
  // Log error but avoid spamming logs
  if (attempt === 1) {
    console.error(`Database connection error: ${error.message}`);
  }

  // If we still have retries left
  if (attempt <= MAX_RETRIES) {
    console.log(`Retrying database operation, attempt ${attempt} of ${MAX_RETRIES}...`);
    
    // Wait before retry with exponential backoff
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
    
    // Retry the operation
    try {
      return await operation();
    } catch (retryError) {
      return handleConnectionError(retryError, operation, attempt + 1);
    }
  }

  // If we've exhausted retries, throw the original error
  throw error;
};

// Create Prisma client with retry logic (server-side only)
const createPrismaClient = () => {
  // Don't create client in Edge Runtime
  if (isEdgeRuntime()) {
    throw new Error("PrismaClient cannot be used in Edge Runtime");
  }

  // Use log settings from prisma-log-config
  const client = new PrismaClient({
    ...prismaLogConfig,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add transaction timeout configuration
    transactionOptions: {
      maxWait: 10000, // 10 seconds max wait
      timeout: 15000, // 15 seconds timeout (increased from default 5 seconds)
      isolationLevel: 'ReadCommitted', // Use a more performant isolation level
    },
  });

  // Enhance client with connection error handling
  const enhancedClient = client.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          // Check if it's a connection or transaction error
          if (
            error.message.includes("connection") || 
            error.message.includes("Closed") ||
            error.message.includes("timeout") ||
            error.message.includes("Connection pool") ||
            error.message.includes("Transaction already closed") ||
            error.message.includes("expired transaction") ||
            error.code === 'P1001' || // Connection error
            error.code === 'P1008' || // Operation timeout
            error.code === 'P1017' || // Connection already closed
            error.code === 'P2028'    // Transaction timeout
          ) {
            // For transaction timeout errors, don't retry - just fail fast
            if (error.message.includes("Transaction already closed") || 
                error.message.includes("expired transaction") ||
                error.code === 'P2028') {
              console.error(`Transaction timeout error in ${model}.${operation}:`, error.message);
              throw new Error(`Database operation timed out. Please try again.`);
            }
            return handleConnectionError(error, () => query(args));
          }
          throw error;
        }
      },
    },
  });

  // Connection events for health management
  process.on('beforeExit', async () => {
    try {
      await client.$connect();
    } catch (error) {
      console.error('Failed to reconnect on beforeExit:', error);
    }
  });

  return enhancedClient;
};

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Server-side only database client
// This will throw an error if accessed from Edge Runtime
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Set global variable in development to avoid creating too many connections
if (!isEdgeRuntime() && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Enhanced database connection test function (server-side only)
export const testDbConnection = async () => {
  if (isEdgeRuntime()) {
    throw new Error("Database connection cannot be tested in Edge Runtime");
  }
  
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Database disconnect function for cleanup (server-side only)
export const disconnectDb = async () => {
  if (isEdgeRuntime()) {
    throw new Error("Database cannot be disconnected in Edge Runtime");
  }
  
  await db.$disconnect();
};

// Helper function for safe database transactions with proper timeout handling
export const withTransaction = async <T>(
  operation: (tx: any) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
  }
): Promise<T> => {
  if (isEdgeRuntime()) {
    throw new Error("Transactions cannot be used in Edge Runtime");
  }

  const transactionOptions = {
    maxWait: options?.maxWait || 5000, // 5 seconds default
    timeout: options?.timeout || 10000, // 10 seconds default
    isolationLevel: 'ReadCommitted' as const,
  };

  try {
    return await db.$transaction(operation, transactionOptions);
  } catch (error: any) {
    if (error.message.includes("Transaction already closed") || 
        error.message.includes("expired transaction") ||
        error.code === 'P2028') {
      console.error('Transaction timeout error:', error.message);
      throw new Error('Database operation timed out. Please try again.');
    }
    throw error;
  }
};
