import { Metadata } from "next";
import { db } from "@/lib/db";
import { UserRole, DrawStatus } from "@prisma/client";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Users Management",
  description: "Manage users of the 0mninet lottery platform",
};

export default async function UsersPage() {
  // Get all users
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  // Get the date of the most recent completed draw
  const mostRecentDraw = await db.draw.findFirst({
    where: {
      status: DrawStatus.COMPLETED
    },
    orderBy: {
      drawDate: "desc"
    },
    select: {
      id: true,
      drawDate: true
    }
  });

  // Get the next upcoming draw
  const nextDraw = await db.draw.findFirst({
    where: {
      status: DrawStatus.PENDING
    },
    orderBy: {
      drawDate: "asc"
    },
    select: {
      id: true,
      drawDate: true
    }
  });

  // Get the cutoff date - either the most recent draw date or a week ago if no draws
  const cutoffDate = mostRecentDraw 
    ? new Date(mostRecentDraw.drawDate) 
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago as fallback

  // Format users with correct ticket counts
  const formattedUsers = await Promise.all(users.map(async (user) => {
    // Count available tickets (not used AND earned after the most recent draw)
    const availableTickets = await db.ticket.count({
      where: {
        userId: user.id,
        isUsed: false,
        createdAt: {
          gt: cutoffDate // Only count tickets earned after the most recent draw
        }
      }
    });
    
    // Count total tickets (for historical reference)
    const totalTickets = await db.ticket.count({
      where: {
        userId: user.id
      }
    });
    
    // Check if user has won any lottery
    const hasWon = user.hasWon;
    
    // Don't show users with no available tickets and who haven't won unless they're admins
    if (availableTickets === 0 && !hasWon && user.role !== UserRole.ADMIN) {
      return null;
    }
    
    return {
      id: user.id,
      name: user.name || "No Name",
      email: user.email || "No Email",
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      ticketCount: availableTickets,
      totalTicketsEarned: totalTickets,
      hasWon: hasWon
    };
  }));

  // Filter out null entries (users with no tickets and not winners)
  const filteredUsers = formattedUsers.filter(user => user !== null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
      </div>
      
      <UsersTable users={filteredUsers} />
    </div>
  );
} 