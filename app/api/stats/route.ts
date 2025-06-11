import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DrawStatus } from "@prisma/client";

// Make this endpoint publicly accessible, without authentication
export async function GET() {
  try {
    // Get lottery stats
    const totalUsers = await db.user.count();
    
    // Find the current active draw
    const currentDraw = await db.draw.findFirst({
      where: {
        status: DrawStatus.PENDING,
      },
      orderBy: {
        drawDate: "asc",
      },
    });
    
    // Get the total active tickets in the current draw
    let activeTicketsInDraw = 0;
    
    if (currentDraw) {
      // Get the actual total tickets in the draw from all participations
      const totalParticipations = await db.drawParticipation.aggregate({
        where: {
          drawId: currentDraw.id,
        },
        _sum: {
          ticketsUsed: true,
        },
      });
      
      activeTicketsInDraw = totalParticipations._sum.ticketsUsed || 0;
      
      // If no participations yet, check for available tickets that could be applied
      if (activeTicketsInDraw === 0) {
        // Count all available (unused) tickets from all users
        const availableTickets = await db.ticket.count({
          where: {
            isUsed: false,
          },
        });
        
        // For display purposes, show available tickets if no one has participated yet
        activeTicketsInDraw = availableTickets;
      }
    } else {
      // If no active draw, count all available tickets
      const availableTickets = await db.ticket.count({
        where: {
          isUsed: false,
        },
      });
      
      activeTicketsInDraw = availableTickets;
    }
    
    // Get latest winner
    const latestWinner = await db.winner.findFirst({
      orderBy: { drawDate: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });
    
    // Get next Thursday at 18:30 IST (UTC+5:30)
    const nextDrawDate = getNextThursday();
    
    return NextResponse.json({
      success: true,
      totalUsers,
      totalTickets: activeTicketsInDraw, // Return active tickets in the current draw
      currentDrawId: currentDraw?.id || null,
      latestWinner: latestWinner?.user?.name || null,
      latestWinnerProfile: latestWinner?.user ? {
        name: latestWinner.user.name,
        username: latestWinner.user.username,
        profileImage: latestWinner.user.profileImage,
      } : null,
      nextDrawDate: nextDrawDate.toISOString(),
      prizeName: "$50 Amazon Gift Card",
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        totalUsers: 0,
        totalTickets: 0,
        currentDrawId: null,
        latestWinner: null,
        latestWinnerProfile: null,
        nextDrawDate: getNextThursday().toISOString(),
        prizeName: "$50 Amazon Gift Card",
      },
      { status: 500 }
    );
  }
}

// Export this config to disable authentication for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

function getNextThursday() {
  const now = new Date();
  
  // Get day of week (0 = Sunday, 4 = Thursday)
  const currentDay = now.getDay();
  
  // Calculate days until next Thursday
  const daysUntilThursday = (4 - currentDay + 7) % 7;
  
  // If it's Thursday but after 18:30 IST, get next Thursday
  if (daysUntilThursday === 0) {
    // Convert to IST (UTC+5:30)
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const istTime = hours * 60 + minutes + 5 * 60 + 30; // Convert to minutes and add IST offset
    const istHours = Math.floor(istTime / 60) % 24;
    const istMinutes = istTime % 60;
    
    if (istHours > 18 || (istHours === 18 && istMinutes >= 30)) {
      // It's past 18:30 IST, so get next Thursday
      return new Date(
        now.getFullYear(), 
        now.getMonth(), 
        now.getDate() + 7, 
        18 - 5, // 18:00 IST in UTC
        30 - 30, // 30 minutes in UTC
        0,
        0
      );
    }
  }
  
  // Set to next Thursday at 18:30 IST (13:00 UTC)
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setUTCHours(13, 0, 0, 0); // 18:30 IST is 13:00 UTC
  
  return nextThursday;
} 