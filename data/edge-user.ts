/**
 * Edge-compatible user data functions
 * This module provides user data access that is safe to use in Edge Runtime
 */

// Edge-compatible version that doesn't use PrismaClient
// This version is used only for credential validation
export const getUserByEmailInEdge = async (email: string) => {
  try {
    // In Edge Runtime, we need to call an API route instead of using Prisma directly
    const response = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Edge-Operation': 'true', // Custom header to indicate this is from Edge
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
};

// Edge-compatible version that doesn't use PrismaClient
export const getUserByIdInEdge = async (id: string) => {
  try {
    // In Edge Runtime, we need to call an API route instead of using Prisma directly
    const response = await fetch(`/api/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Edge-Operation': 'true', // Custom header to indicate this is from Edge
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}; 