import { db } from "@/lib/db";

/**
 * Get the user's available tickets (not used in any draw)
 */
export const getUserAvailableTickets = async (userId: string): Promise<number> => {
  return await db.ticket.count({
    where: {
      userId: userId,
      isUsed: false,
    },
  });
};

/**
 * Get tickets used by a user in a specific draw
 */
export const getUserTicketsInDraw = async (userId: string, drawId: string): Promise<number> => {
  return await db.ticket.count({
    where: {
      userId: userId,
      drawId: drawId,
      isUsed: true,
    },
  });
};

/**
 * Get user's total tickets (all time)
 */
export const getUserTotalTickets = async (userId: string): Promise<number> => {
  return await db.ticket.count({
    where: {
      userId: userId,
    },
  });
};

/**
 * Get user's used tickets across all draws
 */
export const getUserUsedTickets = async (userId: string): Promise<number> => {
  return await db.ticket.count({
    where: {
      userId: userId,
      isUsed: true,
    },
  });
};

/**
 * Verify user has enough available tickets for participation
 */
export const verifyUserTicketAvailability = async (
  userId: string, 
  requestedTickets: number
): Promise<{
  available: number;
  canParticipate: boolean;
  error?: string;
}> => {
  const availableTickets = await getUserAvailableTickets(userId);
  
  if (availableTickets < requestedTickets) {
    return {
      available: availableTickets,
      canParticipate: false,
      error: `Insufficient tickets! You have ${availableTickets} available, but requested ${requestedTickets}.`,
    };
  }
  
  return {
    available: availableTickets,
    canParticipate: true,
  };
}; 