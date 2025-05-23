import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get lottery stats
    const totalUsers = await db.user.count();
    const totalTickets = await db.ticket.count({ 
      where: { isUsed: false }
    });
    
    // Get latest winner
    const latestWinner = await db.winner.findFirst({
      orderBy: { drawDate: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Get next Thursday at 18:30 IST
    const nextDrawDate = getNextThursday();
    
    return NextResponse.json({
      success: true,
      totalUsers,
      totalTickets,
      latestWinner: latestWinner?.user?.name || null,
      nextDrawDate,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

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