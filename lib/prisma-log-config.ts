/**
 * Prisma Logging Configuration
 * 
 * This module controls Prisma's logging behavior across the application.
 * It ensures consistent logging configuration and makes it easy to change
 * logging settings in a single place.
 */

import { Prisma } from '@prisma/client';

// Get log level from environment or use default settings
export const getPrismaLogLevels = (): Prisma.LogLevel[] => {
  // Check if logs are explicitly disabled
  if (process.env.PRISMA_LOG_QUERIES === 'false') {
    return ['error', 'warn']; // Only log errors and warnings
  }

  // In production, only log errors by default
  if (process.env.NODE_ENV === 'production') {
    return ['error'];
  }

  // In development, configure based on preference
  return ['error', 'warn']; // Removed 'query' to stop verbose query logs
};

// Export default log configuration for Prisma client
export const prismaLogConfig = {
  log: getPrismaLogLevels(),
};

export default prismaLogConfig; 