import { db } from "@/lib/db";
import { dbQueryWithRetry } from "@/lib/db-utils";

/**
 * Get the user's tickets that will be applied to the lottery
 * All tickets are automatically applied to the lottery
 */
export const getUserAppliedTickets = async (userId: string): Promise<number> => {
  // Add cache-busting by adding the current timestamp to query params
  const timestamp = Date.now();
  
  try {
    // Use a direct query to ensure we get the most accurate count
    const unusedTicketsCount = await db.ticket.count({
      where: {
        userId: userId,
        isUsed: false,
      }
    });
    
    console.log(`[${timestamp}] Unused ticket count for user ${userId}: ${unusedTicketsCount}`);
    
    return unusedTicketsCount;
  } catch (error) {
    console.error(`Error getting tickets for user ${userId}:`, error);
    
    // Fallback to simpler query if the first attempt fails
    try {
      // Use raw SQL query as a last resort
      const result = await db.$queryRaw`
        SELECT COUNT(*) as count FROM "Ticket" 
        WHERE "userId" = ${userId}::text AND "isUsed" = false
      ` as { count: bigint }[];
      
      const count = Number(result[0].count);
      console.log(`[${timestamp}] Fallback unused ticket count for user ${userId}: ${count}`);
      return count;
    } catch (fallbackError) {
      console.error(`Fallback query failed for user ${userId}:`, fallbackError);
      return 0;
    }
  }
};

/**
 * Get tickets used by a user in a specific draw
 */
export const getUserTicketsInDraw = async (userId: string, drawId: string): Promise<number> => {
  return await dbQueryWithRetry(
    () => db.ticket.count({
      where: {
        userId: userId,
        drawId: drawId,
        isUsed: true,
      },
    }),
    'getUserTicketsInDraw'
  );
};

/**
 * Get user's total tickets (all time)
 */
export const getUserTotalTickets = async (userId: string): Promise<number> => {
  return await dbQueryWithRetry(
    () => db.ticket.count({
      where: {
        userId: userId,
      },
    }),
    'getUserTotalTickets'
  );
};

/**
 * Get user's used tickets across all draws (historical)
 */
export const getUserUsedTickets = async (userId: string): Promise<number> => {
  return await dbQueryWithRetry(
    () => db.ticket.count({
      where: {
        userId: userId,
        isUsed: true,
      },
    }),
    'getUserUsedTickets'
  );
};

/**
 * DEPRECATED: Use getUserAppliedTickets instead
 * Kept for backward compatibility
 */
export const getUserAvailableTickets = async (userId: string): Promise<number> => {
  // Return all tickets as they are all automatically applied
  return await getUserAppliedTickets(userId);
};

/**
 * Apply all available tickets to the current lottery
 */
export const applyAllTicketsToLottery = async (userId: string, drawId: string): Promise<number> => {
  // Find all tickets that aren't used yet
  const tickets = await dbQueryWithRetry(
    () => db.ticket.findMany({
      where: {
        userId: userId,
        isUsed: false,
      },
    }),
    'findAvailableTickets'
  );
  
  if (tickets.length === 0) {
    return 0;
  }
  
  // Update all tickets to be used in this draw
  await dbQueryWithRetry(
    () => db.ticket.updateMany({
      where: {
        id: {
          in: tickets.map(ticket => ticket.id)
        }
      },
      data: {
        isUsed: true,
        drawId: drawId
      }
    }),
    'applyTicketsToLottery'
  );
  
  return tickets.length;
};

/**
 * Reset tickets for a user after a lottery draw is completed
 * This will mark all tickets as used and remove the drawId
 * so they don't appear in the next lottery
 */
export const resetUserTicketsForNextLottery = async (userId: string): Promise<number> => {
  try {
    const result = await db.ticket.updateMany({
      where: {
        userId: userId,
        isUsed: true,
      },
      data: {
        isUsed: true,
        drawId: null
      }
    });
    
    return result.count;
  } catch (error) {
    console.error(`Error resetting tickets for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Verify user has enough tickets for participation
 */
export const verifyUserTicketAvailability = async (
  userId: string, 
  requestedTickets: number
): Promise<{
  available: number;
  canParticipate: boolean;
  error?: string;
}> => {
  const availableTickets = await getUserAppliedTickets(userId);
  
  if (availableTickets < requestedTickets) {
    return {
      available: availableTickets,
      canParticipate: false,
      error: `Insufficient tickets! You have ${availableTickets} tickets, but requested ${requestedTickets}.`,
    };
  }
  
  return {
    available: availableTickets,
    canParticipate: true,
  };
}; 