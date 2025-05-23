"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { LotteryParticipationSchema } from "@/schemas";
import { 
  getDrawById, 
  getUserParticipationInDraw, 
  createOrGetNextDraw 
} from "@/data/draw";

export const participateInLottery = async (
  values: z.infer<typeof LotteryParticipationSchema>
) => {
  const user = await currentUser();
  
  if (!user) {
    return { error: "Unauthorized! Please log in." };
  }

  if (user.isBlocked) {
    return { error: "Account is blocked. Cannot participate in lottery." };
  }

  const validatedFields = LotteryParticipationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { ticketsToUse, drawId } = validatedFields.data;

  try {
    // Use database transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Check if draw exists and is active
      const draw = await tx.draw.findUnique({
        where: { id: drawId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!draw) {
        throw new Error("Draw not found!");
      }

      if (draw.status !== "PENDING") {
        throw new Error("This draw is no longer accepting participants!");
      }

      if (draw.drawDate < new Date()) {
        throw new Error("This draw has already ended!");
      }

      // Get user's available tickets
      const availableTickets = await tx.ticket.count({
        where: {
          userId: user.id,
          isUsed: false,
        },
      });

      if (availableTickets < ticketsToUse) {
        throw new Error(`Insufficient tickets! You have ${availableTickets} tickets available, but tried to use ${ticketsToUse}.`);
      }

      // Check if user already participated in this draw
      const existingParticipation = await tx.drawParticipation.findUnique({
        where: {
          userId_drawId: {
            userId: user.id,
            drawId: drawId,
          },
        },
      });

      // Get the exact tickets to update (oldest first)
      const ticketsToUpdate = await tx.ticket.findMany({
        where: {
          userId: user.id,
          isUsed: false,
        },
        take: ticketsToUse,
        orderBy: {
          createdAt: 'asc', // Use oldest tickets first
        },
      });

      if (ticketsToUpdate.length < ticketsToUse) {
        throw new Error(`Could not reserve ${ticketsToUse} tickets. Only ${ticketsToUpdate.length} available.`);
      }

      if (existingParticipation) {
        // User is adding more tickets to existing participation
        const newTotalTickets = existingParticipation.ticketsUsed + ticketsToUse;
        
        // Update participation
        await tx.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: {
            ticketsUsed: newTotalTickets,
            updatedAt: new Date(),
          },
        });

        // Mark exact tickets as used
        await tx.ticket.updateMany({
          where: {
            id: {
              in: ticketsToUpdate.map(t => t.id),
            },
          },
          data: {
            isUsed: true,
            drawId: drawId,
          },
        });

        // Update draw total tickets
        await tx.draw.update({
          where: { id: drawId },
          data: {
            totalTickets: {
              increment: ticketsToUse,
            },
          },
        });

        return { 
          success: `Successfully added ${ticketsToUse} more tickets! You now have ${newTotalTickets} tickets in this draw.`,
          ticketsUsed: ticketsToUse,
          newTotal: newTotalTickets
        };
      } else {
        // New participation
        await tx.drawParticipation.create({
          data: {
            userId: user.id,
            drawId: drawId,
            ticketsUsed: ticketsToUse,
          },
        });

        // Mark exact tickets as used
        await tx.ticket.updateMany({
          where: {
            id: {
              in: ticketsToUpdate.map(t => t.id),
            },
          },
          data: {
            isUsed: true,
            drawId: drawId,
          },
        });

        // Update draw total tickets
        await tx.draw.update({
          where: { id: drawId },
          data: {
            totalTickets: {
              increment: ticketsToUse,
            },
          },
        });

        return { 
          success: `Successfully participated in the lottery with ${ticketsToUse} tickets!`,
          ticketsUsed: ticketsToUse,
          newTotal: ticketsToUse
        };
      }
    });

    return result;
  } catch (error) {
    console.error("Lottery participation error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Something went wrong! Please try again." };
  }
};

export const getNextLotteryDraw = async () => {
  try {
    const draw = await createOrGetNextDraw();
    return { success: true, draw };
  } catch (error) {
    console.error("Error getting next draw:", error);
    return { error: "Failed to get lottery information." };
  }
}; 