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
import { verifyUserTicketAvailability, applyAllTicketsToLottery } from "@/lib/ticket-utils";

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
    // Pre-validate ticket availability
    const ticketValidation = await verifyUserTicketAvailability(user.id, ticketsToUse);
    
    if (!ticketValidation.canParticipate) {
      return { error: ticketValidation.error };
    }

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

      // Apply tickets to lottery using utility function
      const appliedTickets = await applyAllTicketsToLottery(user.id, drawId);
      
      if (appliedTickets === 0) {
        throw new Error("No tickets available to apply.");
      }

      if (appliedTickets < ticketsToUse) {
        throw new Error(`Could only apply ${appliedTickets} tickets, which is less than the ${ticketsToUse} requested.`);
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

      // Update or create participation record
      let newTotalTickets = appliedTickets;
      
      if (existingParticipation) {
        // User is adding more tickets to existing participation
        newTotalTickets = existingParticipation.ticketsUsed + appliedTickets;
        
        // Update participation
        await tx.drawParticipation.update({
          where: { id: existingParticipation.id },
          data: {
            ticketsUsed: newTotalTickets,
            updatedAt: new Date(),
          },
        });
      } else {
        // New participation
        await tx.drawParticipation.create({
          data: {
            userId: user.id,
            drawId: drawId,
            ticketsUsed: appliedTickets,
          },
        });
      }

      // Update draw total tickets
      await tx.draw.update({
        where: { id: drawId },
        data: {
          totalTickets: {
            increment: appliedTickets,
          },
        },
      });

      return { 
        success: `Successfully applied ${appliedTickets} tickets to the lottery!`,
        ticketsUsed: appliedTickets,
        newTotal: newTotalTickets
      };
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