import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";
import { getPrizeAmount } from "@/lib/settings";
import { dbQueryWithRetry } from "@/lib/db-utils";

export const getActiveOrUpcomingDraw = async () => {
  return await dbQueryWithRetry(
    () => db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
        drawDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        drawDate: 'asc',
      },
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
    }),
    'getActiveOrUpcomingDraw'
  );
};

export const getDrawById = async (drawId: string) => {
  return await dbQueryWithRetry(
    () => db.draw.findUnique({
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
    }),
    'getDrawById'
  );
};

export const getUserParticipationInDraw = async (userId: string, drawId: string) => {
  return await dbQueryWithRetry(
    () => db.drawParticipation.findUnique({
      where: {
        userId_drawId: {
          userId,
          drawId,
        },
      },
    }),
    'getUserParticipationInDraw'
  );
};

export const getUserDrawParticipations = async (userId: string) => {
  return await dbQueryWithRetry(
    () => db.drawParticipation.findMany({
      where: { userId },
      include: {
        draw: true,
      },
      orderBy: {
        participatedAt: 'desc',
      },
    }),
    'getUserDrawParticipations'
  );
};

export const createOrGetNextDraw = async () => {
  // Check if there's already a pending draw
  const existingDraw = await getActiveOrUpcomingDraw();
  if (existingDraw) {
    return existingDraw;
  }

  // Create a new draw for next Thursday
  const nextThursday = getNextThursday();
  const prizeAmount = await getPrizeAmount();
  
  return await dbQueryWithRetry(
    () => db.draw.create({
      data: {
        drawDate: nextThursday,
        status: DrawStatus.PENDING,
        prizeAmount: prizeAmount,
      },
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
    }),
    'createOrGetNextDraw'
  );
};

function getNextThursday() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  
  // If it's Thursday but after 18:30 IST, get next Thursday
  if (daysUntilThursday === 0) {
    const istHour = now.getUTCHours() + 5.5; // IST is UTC+5:30
    if (istHour >= 18.5) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 30);
    }
  }
  
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(18, 30, 0, 0);
  
  return nextThursday;
} 