import { db } from "@/lib/db";
import { dbQueryWithRetry } from "@/lib/db-utils";
import { createOrGetNextDraw } from "@/data/draw";

/**
 * Get the user's available tickets (tickets that can participate in lottery)
 * This is now stored directly in the user model and reset after each lottery
 */
export const getUserAppliedTickets = async (userId: string): Promise<number> => {
  // Add cache-busting by adding the current timestamp to query params
  const timestamp = Date.now();
  
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });
    
    const availableTickets = user?.availableTickets || 0;
    
    console.log(`[${timestamp}] Available tickets for user ${userId}: ${availableTickets}`);
    
    return availableTickets;
  } catch (error) {
    console.error(`Error getting available tickets for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Get user's available tickets (same as applied tickets in new system)
 */
export const getUserAvailableTickets = async (userId: string): Promise<number> => {
  return await getUserAppliedTickets(userId);
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
 * Get user's total tickets earned (lifetime, includes available + used)
 */
export const getUserTotalTickets = async (userId: string): Promise<number> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { totalTicketsEarned: true }
    });
    
    return user?.totalTicketsEarned || 0;
  } catch (error) {
    console.error(`Error getting total tickets for user ${userId}:`, error);
    return 0;
  }
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
 * Award tickets to a user (increases both available and total counts)
 */
export const awardTicketsToUser = async (
  userId: string, 
  ticketCount: number,
  source: "SURVEY" | "SOCIAL" | "REFERRAL"
): Promise<{
  success: boolean;
  availableTickets: number;
  totalTickets: number;
  ticketIds: string[];
}> => {
  try {
    const result = await db.$transaction(async (tx) => {
      // Create ticket records for history
      const ticketIds = [];
      for (let i = 0; i < ticketCount; i++) {
        const ticket = await tx.ticket.create({
          data: {
            userId,
            source,
            isUsed: false,
            confirmationCode: `${source}_${userId}_${Date.now()}_${i}`,
          },
        });
        ticketIds.push(ticket.id);
      }

      // Update user's ticket counts
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          availableTickets: {
            increment: ticketCount,
          },
          totalTicketsEarned: {
            increment: ticketCount,
          },
        },
      });

      return {
        success: true,
        availableTickets: updatedUser.availableTickets,
        totalTickets: updatedUser.totalTicketsEarned,
        ticketIds,
      };
    });

    console.log(`✅ Awarded ${ticketCount} ${source} tickets to user ${userId}`);
    return result;
  } catch (error) {
    console.error(`Error awarding tickets to user ${userId}:`, error);
    return {
      success: false,
      availableTickets: 0,
      totalTickets: 0,
      ticketIds: [],
    };
  }
};

/**
 * Apply all available tickets to the current lottery
 * In the new system, this creates draw participation based on available tickets
 */
export const applyAllTicketsToLottery = async (userId: string, drawId: string): Promise<number> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });

    if (!user || user.availableTickets === 0) {
      return 0;
    }

    const ticketsToApply = user.availableTickets;

    // Create or update draw participation
    await db.drawParticipation.upsert({
      where: {
        userId_drawId: {
          userId,
          drawId,
        },
      },
      update: {
        ticketsUsed: ticketsToApply,
        updatedAt: new Date(),
      },
      create: {
        userId,
        drawId,
        ticketsUsed: ticketsToApply,
      },
    });

    // Update draw total tickets
    const currentDraw = await db.draw.findUnique({
      where: { id: drawId },
      select: { totalTickets: true }
    });

    if (currentDraw) {
      await db.draw.update({
        where: { id: drawId },
        data: {
          totalTickets: (currentDraw.totalTickets || 0) + ticketsToApply,
        },
      });
    }

    console.log(`Applied ${ticketsToApply} tickets to lottery for user ${userId}`);
    return ticketsToApply;
  } catch (error) {
    console.error(`Error applying tickets to lottery for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Reset all users' available tickets to 0 after lottery results
 * This is called after every lottery draw, regardless of who wins
 */
export const resetAllAvailableTickets = async (): Promise<number> => {
  try {
    const result = await db.user.updateMany({
      where: {
        availableTickets: {
          gt: 0,
        },
      },
      data: {
        availableTickets: 0,
      },
    });

    console.log(`Reset available tickets for ${result.count} users`);
    return result.count;
  } catch (error) {
    console.error(`Error resetting available tickets:`, error);
    return 0;
  }
};

/**
 * Reset tickets for a user after a lottery draw is completed
 * In the new system, this just resets available tickets to 0
 */
export const resetUserTicketsForNextLottery = async (userId: string): Promise<number> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });

    if (!user || user.availableTickets === 0) {
      return 0;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        availableTickets: 0,
      },
    });

    console.log(`Reset available tickets for user ${userId}: ${user.availableTickets} → 0`);
    return user.availableTickets;
  } catch (error) {
    console.error(`Error resetting tickets for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Reset tickets for a lottery winner
 * In the new system, this resets available tickets to 0 (same as non-winners)
 */
export const resetWinnerTickets = async (userId: string): Promise<number> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });

    if (!user || user.availableTickets === 0) {
      return 0;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        availableTickets: 0,
      },
    });

    console.log(`Reset winner tickets for user ${userId}: ${user.availableTickets} → 0`);
    return user.availableTickets;
  } catch (error) {
    console.error(`Error resetting winner tickets for user ${userId}:`, error);
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