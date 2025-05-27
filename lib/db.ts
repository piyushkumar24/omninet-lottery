import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with enhanced configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] // Only log errors and warnings in development
      : ['error'],        // Only log errors in production
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Enhanced error handling
    errorFormat: 'pretty',
  });
};

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Enhanced database connection test function
export const testDbConnection = async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Database disconnect function for cleanup
export const disconnectDb = async () => {
  await db.$disconnect();
};
