import { db } from "@/lib/db";
import { dbQueryWithRetry } from "@/lib/db-utils";

/**
 * Get the user's tickets that will be applied to the lottery
 * All tickets are automatically applied to the lottery
 */
export const getUserAppliedTickets = async (userId: string): Promise<number> => {
  // Count all tickets for the user as they are all automatically applied
  return await dbQueryWithRetry(
    () => db.ticket.count({
      where: {
        userId: userId,
      },
    }),
    'getUserAppliedTickets'
  );
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