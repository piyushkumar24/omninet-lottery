/**
 * Edge-compatible database utilities
 * 
 * This module provides functions for interacting with the database
 * that are safe to use in Edge Runtime (middleware, edge API routes, etc.)
 * It avoids direct use of PrismaClient which is not supported in Edge Runtime.
 */

/**
 * Check database health without using PrismaClient
 * This makes a simple fetch request to our health API endpoint
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Use the internal health API to check database status
    // This avoids direct PrismaClient usage in Edge Runtime
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.components?.database?.status === 'healthy';
  } catch (error) {
    console.error('Error checking database health from Edge:', error);
    return false;
  }
}

/**
 * Safe data access pattern for Edge Runtime
 * This is a placeholder for now - actual implementation would depend on requirements
 */
export async function fetchDataSafely<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    return null;
  }
} 