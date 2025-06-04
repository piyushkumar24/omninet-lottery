"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verificiation-token";
import { sendTicketApplicationEmail } from "@/lib/mail";
import { createOrGetNextDraw } from "@/data/draw";
import { nanoid } from "nanoid";

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: { 
      emailVerified: new Date(),
      email: existingToken.email,
    }
  });

  await db.verificationToken.delete({
    where: { id: existingToken.id }
  });

  // Check if this user was referred by someone
  if (existingUser.referredBy) {
    try {
      // Get the referrer
      const referrer = await db.user.findUnique({
        where: { id: existingUser.referredBy },
        select: { id: true, name: true, email: true }
      });

      if (referrer) {
        // Award a referral ticket to the referrer
        const draw = await createOrGetNextDraw();
        
        // Check if a referral ticket was already awarded for this user
        const existingReferralTicket = await db.ticket.findFirst({
          where: {
            userId: referrer.id,
            source: "REFERRAL",
            confirmationCode: {
              contains: existingUser.id,
            },
          },
        });

        if (!existingReferralTicket) {
          // Create the referral ticket in a transaction
          await db.$transaction(async (tx) => {
            // Create referral ticket
            const confirmationCode = `REF_${existingUser.id}_${nanoid(6)}`;
            const newTicket = await tx.ticket.create({
              data: {
                userId: referrer.id,
                source: "REFERRAL",
                isUsed: false, // Set to false so it shows up on dashboard
                drawId: null, // Don't assign to a draw yet
                confirmationCode: confirmationCode,
              },
            });

            // Update or create draw participation
            const existingParticipation = await tx.drawParticipation.findUnique({
              where: {
                userId_drawId: {
                  userId: referrer.id,
                  drawId: draw.id,
                },
              },
            });

            if (existingParticipation) {
              await tx.drawParticipation.update({
                where: { id: existingParticipation.id },
                data: {
                  ticketsUsed: existingParticipation.ticketsUsed + 1,
                  updatedAt: new Date(),
                },
              });
            } else {
              await tx.drawParticipation.create({
                data: {
                  userId: referrer.id,
                  drawId: draw.id,
                  ticketsUsed: 1,
                },
              });
            }

            // Update draw total tickets
            await tx.draw.update({
              where: { id: draw.id },
              data: {
                totalTickets: {
                  increment: 1,
                },
              },
            });

            // Log the referral award
            await tx.settings.create({
              data: {
                key: `referral_ticket_${newTicket.id}`,
                value: JSON.stringify({
                  referrerId: referrer.id,
                  referredUserId: existingUser.id,
                  ticketId: newTicket.id,
                  timestamp: new Date().toISOString(),
                }),
                description: `Referral ticket awarded to ${referrer.email} for referring ${existingUser.email}`,
              },
            });

            // Send email notification to referrer
            if (referrer.email) {
              await sendTicketApplicationEmail(referrer.email, {
                name: referrer.name || "User",
                ticketCount: 1,
                drawDate: draw.drawDate,
                confirmationCode: confirmationCode,
              });
            }
          });

          console.log(`Referral ticket awarded to ${referrer.id} for referring ${existingUser.id}`);
        }
      }
    } catch (error) {
      console.error("Error awarding referral ticket:", error);
      // Don't fail verification if referral ticket award fails
    }
  }

  return { success: "Email verified!", shouldRedirect: true };
};
