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
    // Use a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // First, count tickets directly from the database
      const ticketCountResult = await tx.$queryRaw<Array<{count: BigInt}>>`
        SELECT COUNT(*) as count FROM "Ticket" 
        WHERE "userId" = ${userId}::text
      `;
      
      // Get the raw count
      const rawCount = Number(ticketCountResult[0].count);
      
      // Get draw participation data for accurate counting
      const participation = await tx.drawParticipation.findMany({
        where: { userId: userId },
        select: { ticketsUsed: true },
      });
      
      // Sum tickets from participation records
      const participationCount = participation.reduce((sum, p) => sum + p.ticketsUsed, 0);
      
      // Calculate average to handle any discrepancies
      // This ensures we're getting the most accurate count
      const syncedCount = Math.max(rawCount, participationCount);
      
      // Log the counts for debugging
      console.log(`[${timestamp}] Ticket count for user ${userId}:`, {
        rawTicketCount: rawCount,
        participationCount: participationCount,
        syncedCount: syncedCount
      });
      
      return syncedCount;
    }, {
      timeout: 10000, // 10 second timeout
      maxWait: 5000,  // 5 second max wait
      isolationLevel: 'Serializable', // Ensure data consistency
    });
    
    return result;
  } catch (error) {
    console.error(`Error getting tickets for user ${userId}:`, error);
    
    // Fallback to simpler query if transaction fails
    return await dbQueryWithRetry(
      () => db.$queryRaw<Array<{count: BigInt}>>`SELECT COUNT(*) FROM "Ticket" WHERE "userId" = ${userId}::text`
        .then((result: any) => {
          // Convert BigInt to Number for compatibility
          const count = Number(result[0].count);
          console.log(`[${timestamp}] Fallback ticket count for user ${userId}: ${count}`);
          return count;
        }),
      'getUserAppliedTickets_fallback'
    );
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