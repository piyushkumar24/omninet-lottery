"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { verifyUserTicketAvailability, applyAllTicketsToLottery } from "@/lib/ticket-utils";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { nanoid } from "nanoid";

export const applyTicketsToLottery = async (drawId: string, ticketsToApply: number) => {
  const user = await currentUser();
  
  if (!user) {
    return { error: "Unauthorized! Please log in." };
  }

  if (user.isBlocked) {
    return { error: "Account is blocked. Cannot participate in lottery." };
  }

  if (ticketsToApply <= 0) {
    return { error: "Invalid number of tickets to apply." };
  }

  try {
    // Pre-validate ticket availability
    const ticketValidation = await verifyUserTicketAvailability(user.id, ticketsToApply);
    
    if (!ticketValidation.canParticipate) {
      return { error: ticketValidation.error };
    }

    // Use database transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Check if draw exists and is active
      const draw = await tx.draw.findUnique({
        where: { id: drawId },
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

      // Apply all available tickets using our utility function
      const appliedTickets = await applyAllTicketsToLottery(user.id, drawId);
      
      if (appliedTickets === 0) {
        throw new Error("No tickets available to apply.");
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

      // Get the tickets that were just applied
      const ticketsApplied = await tx.ticket.findMany({
        where: {
          userId: user.id,
          drawId: drawId,
          isUsed: true,
        },
        take: appliedTickets,
        orderBy: {
          updatedAt: 'desc', // Get most recently applied tickets
        },
      });

      // Generate unique ticket confirmation codes
      const ticketCodes = ticketsApplied.map(() => nanoid(10));

      // Update tickets with confirmation codes
      for (let i = 0; i < ticketsApplied.length; i++) {
        await tx.ticket.update({
          where: { id: ticketsApplied[i].id },
          data: {
            confirmationCode: ticketCodes[i],
          },
        });
      }

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

      // Send email notification
      if (user.email) {
        try {
          await sendTicketApplicationEmail(
            user.email,
            {
              name: user.name || "User",
              ticketCount: appliedTickets,
              drawDate: draw.drawDate,
              confirmationCode: ticketCodes[0] // Just use the first code for simplicity
            }
          );
        } catch (emailError) {
          console.error("Failed to send ticket application email:", emailError);
          // Don't fail the transaction for email errors
        }
      }

      return { 
        success: `Successfully applied ${appliedTickets} tickets to the lottery! Confirmation email sent with your ticket details.`,
        ticketsUsed: appliedTickets,
        newTotal: newTotalTickets,
        confirmationCodes: ticketCodes
      };
    });

    return result;
  } catch (error) {
    console.error("Auto ticket application error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Something went wrong! Please try again." };
  }
}; 