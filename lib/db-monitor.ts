/**
 * Database Monitoring Utilities
 * 
 * This module provides utilities for monitoring database connection health
 * and collecting metrics on database performance.
 */

import { db } from './db';
import { testConnectionWithRetry } from './db-utils';
import logger from './logger';

// Database connection status
interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  checkCount: number;
  failureCount: number;
  successCount: number;
  lastError?: Error;
  connectionLatency: number[];
}

// Initialize connection status
const connectionStatus: ConnectionStatus = {
  isConnected: false,
  lastChecked: new Date(),
  checkCount: 0,
  failureCount: 0,
  successCount: 0,
  connectionLatency: []
};

/**
 * Check database connection health
 */
export async function checkConnectionHealth(): Promise<ConnectionStatus> {
  connectionStatus.checkCount++;
  connectionStatus.lastChecked = new Date();
  
  const startTime = performance.now();
  
  try {
    await testConnectionWithRetry();
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    connectionStatus.isConnected = true;
    connectionStatus.successCount++;
    connectionStatus.connectionLatency.push(latency);
    
    // Keep only the last 100 latency measurements
    if (connectionStatus.connectionLatency.length > 100) {
      connectionStatus.connectionLatency.shift();
    }
    
    logger.debug(`Database connection check successful (${latency.toFixed(2)}ms)`, 'DB-MONITOR');
    return { ...connectionStatus };
  } catch (error) {
    connectionStatus.isConnected = false;
    connectionStatus.failureCount++;
    connectionStatus.lastError = error instanceof Error ? error : new Error(String(error));
    
    logger.warn('Database connection check failed', connectionStatus.lastError, 'DB-MONITOR');
    return { ...connectionStatus };
  }
}

/**
 * Get database connection metrics
 */
export function getConnectionMetrics() {
  const latencyArray = connectionStatus.connectionLatency;
  
  // Calculate average latency
  const avgLatency = latencyArray.length > 0
    ? latencyArray.reduce((sum, val) => sum + val, 0) / latencyArray.length
    : 0;
  
  // Calculate success rate
  const successRate = connectionStatus.checkCount > 0
    ? (connectionStatus.successCount / connectionStatus.checkCount) * 100
    : 0;
  
  return {
    ...connectionStatus,
    averageLatency: avgLatency,
    successRate: successRate,
    status: connectionStatus.isConnected ? 'Connected' : 'Disconnected'
  };
}

/**
 * Start periodic connection health checks
 * @param intervalMs Check interval in milliseconds (default: 60000 - 1 minute)
 */
export function startConnectionMonitoring(intervalMs = 60000) {
  logger.info(`Starting database connection monitoring (interval: ${intervalMs}ms)`, 'DB-MONITOR');
  
  // Perform initial check
  checkConnectionHealth().then((status) => {
    logger.info(`Initial database connection status: ${status.isConnected ? 'Connected' : 'Disconnected'}`, 'DB-MONITOR');
  });
  
  // Set up periodic checks
  const intervalId = setInterval(async () => {
    await checkConnectionHealth();
  }, intervalMs);
  
  // Return the interval ID so it can be cleared if needed
  return intervalId;
}

/**
 * Stop connection monitoring
 */
export function stopConnectionMonitoring(intervalId: NodeJS.Timeout) {
  clearInterval(intervalId);
  logger.info('Database connection monitoring stopped', 'DB-MONITOR');
} 