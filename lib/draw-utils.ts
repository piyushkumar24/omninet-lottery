import { db } from "@/lib/db";
import { Draw } from "@prisma/client";

/**
 * Gets the accurate ticket count for a draw by calculating from participation records
 * and updates the draw record if needed
 */
export async function getAccurateDrawTicketCount(drawId: string): Promise<number> {
  try {
    // Get the sum of all tickets from draw participations
    const participationTickets = await db.$queryRaw<Array<{total: bigint | null}>>`
      SELECT SUM("ticketsUsed") as total 
      FROM "DrawParticipation" 
      WHERE "drawId" = ${drawId}
    `;
    
    // Get the current draw record
    const draw = await db.draw.findUnique({
      where: { id: drawId }
    });
    
    if (!draw) {
      return 0;
    }
    
    // Convert from BigInt if needed
    const correctTotalTickets = participationTickets[0]?.total 
      ? Number(participationTickets[0].total) 
      : draw.totalTickets;
    
    // Update the draw's totalTickets if they don't match
    if (correctTotalTickets !== draw.totalTickets) {
      try {
        await db.draw.update({
          where: { id: drawId },
          data: { totalTickets: correctTotalTickets }
        });
        console.log(`Updated draw ${drawId} total tickets from ${draw.totalTickets} to ${correctTotalTickets}`);
      } catch (err) {
        console.error("Error updating draw total tickets:", err);
      }
    }
    
    return correctTotalTickets;
  } catch (error) {
    console.error("Error calculating accurate draw ticket count:", error);
    // In case of error, fall back to the original value or 0
    const fallbackDraw = await db.draw.findUnique({
      where: { id: drawId }
    });
    return fallbackDraw?.totalTickets || 0;
  }
}

/**
 * Gets the current draw and ensures its ticket count is accurate
 */
export async function getCurrentDrawWithAccurateTickets(): Promise<Draw | null> {
  try {
    // Get the current active draw
    const activeDraw = await db.draw.findFirst({
      where: {
        status: "PENDING",
        drawDate: {
          gte: new Date()
        }
      },
      orderBy: {
        drawDate: 'asc'
      }
    });
    
    if (!activeDraw) {
      return null;
    }
    
    // Get accurate ticket count
    const correctTotalTickets = await getAccurateDrawTicketCount(activeDraw.id);
    
    // Return draw with corrected ticket count
    return {
      ...activeDraw,
      totalTickets: correctTotalTickets
    };
  } catch (error) {
    console.error("Error getting current draw with accurate tickets:", error);
    return null;
  }
} 