import { db, withTransaction } from "@/lib/db";
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
 * RULE: Survey completion = EXACTLY 1 ticket (NO DECIMALS, NO EXCEPTIONS)
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
    // SAFETY CHECK: Ensure ticketCount is always a positive integer
    if (!Number.isInteger(ticketCount) || ticketCount < 1) {
      console.error(`❌ INVALID TICKET COUNT: ${ticketCount} for source ${source}, user ${userId}. Must be positive integer.`);
      return {
        success: false,
        availableTickets: 0,
        totalTickets: 0,
        ticketIds: [],
      };
    }
    
    // SPECIAL RULE: Survey tickets must ALWAYS be exactly 1 (unless non-winner bonus = 2)
    if (source === "SURVEY" && ticketCount !== 1 && ticketCount !== 2) {
      console.error(`❌ SURVEY TICKET RULE VIOLATION: Attempted to award ${ticketCount} survey tickets. Must be 1 or 2 only.`);
      return {
        success: false,
        availableTickets: 0,
        totalTickets: 0,
        ticketIds: [],
      };
    }
    
    console.log(`🎫 Awarding ${ticketCount} ${source} tickets to user ${userId} (VERIFIED INTEGER)`);
    
    const result = await withTransaction(async (tx) => {
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
    }, {
      timeout: 6000, // 6 second timeout
      maxWait: 2000, // 2 second max wait
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
 * Optimized to use efficient queries and avoid long transactions
 */
export const applyAllTicketsToLottery = async (userId: string, drawId: string): Promise<number> => {
  try {
    // Get user's available tickets first
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });

    if (!user || user.availableTickets === 0) {
      return 0;
    }

    const ticketsToApply = user.availableTickets;

    // Use optimized transaction for draw participation
    await withTransaction(async (tx) => {
      // Create or update draw participation
      await tx.drawParticipation.upsert({
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
    }, {
      timeout: 5000, // 5 second timeout
      maxWait: 1500, // 1.5 second max wait
    });

    // Update draw total tickets separately to avoid long transaction
    // This is less critical and can be done outside the main transaction
    try {
      const totalParticipations = await db.drawParticipation.aggregate({
        where: { drawId },
        _sum: { ticketsUsed: true },
      });

      const totalTickets = totalParticipations._sum.ticketsUsed || 0;

      await db.draw.update({
        where: { id: drawId },
        data: { totalTickets },
      });

      console.log(`Updated draw ${drawId} total tickets to ${totalTickets}`);
    } catch (updateError) {
      console.error(`Error updating draw total tickets:`, updateError);
      // Don't fail the whole operation if this fails
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

    console.log(`Reset ${user.availableTickets} available tickets for user ${userId}`);
    return user.availableTickets;
  } catch (error) {
    console.error(`Error resetting tickets for user ${userId}:`, error);
    return 0;
  }
};

/**
 * Reset tickets for winners (in the new system, this just resets available tickets)
 */
export const resetWinnerTickets = async (userId: string): Promise<number> => {
  return await resetUserTicketsForNextLottery(userId);
};

/**
 * Verify if a user has enough tickets to participate in lottery
 */
export const verifyUserTicketAvailability = async (
  userId: string, 
  requestedTickets: number
): Promise<{
  available: number;
  canParticipate: boolean;
  error?: string;
}> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTickets: true }
    });

    const available = user?.availableTickets || 0;

    if (available < requestedTickets) {
      return {
        available,
        canParticipate: false,
        error: `Not enough tickets. You have ${available}, but need ${requestedTickets}`,
      };
    }

    return {
      available,
      canParticipate: true,
    };
  } catch (error) {
    console.error(`Error verifying ticket availability for user ${userId}:`, error);
    return {
      available: 0,
      canParticipate: false,
      error: "Failed to check ticket availability",
    };
  }
}; 