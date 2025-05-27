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
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

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
    // Connection pool configuration is handled via connection URL params instead
  });

  // Enhance client with connection error handling
  const enhancedClient = client.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          // Check if it's a connection error
          if (
            error.message.includes("connection") || 
            error.message.includes("Closed") ||
            error.message.includes("timeout") ||
            error.message.includes("Connection pool") ||
            error.code === 'P1001' || // Connection error
            error.code === 'P1008' || // Operation timeout
            error.code === 'P1017'    // Connection already closed
          ) {
            return handleConnectionError(error, () => query(args));
          }
          throw error;
        }
      },
    },
  });

  // Connection events for health management
  process.on('beforeExit', async () => {
    console.log('Process beforeExit event, reconnecting database...');
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
