import { Metadata } from "next";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
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

  // Get available tickets for each user (tickets that can be applied to next lottery)
  const formattedUsers = await Promise.all(users.map(async (user) => {
    // Count available tickets (not used in any draw)
    const availableTickets = await db.ticket.count({
      where: {
        userId: user.id,
        isUsed: false
      }
    });
    
    // Count total tickets (for historical reference)
    const totalTickets = await db.ticket.count({
      where: {
        userId: user.id
      }
    });
    
    return {
      id: user.id,
      name: user.name || "No Name",
      email: user.email || "No Email",
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      ticketCount: availableTickets,
      totalTicketsEarned: totalTickets
    };
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
      </div>
      
      <UsersTable users={formattedUsers} />
    </div>
  );
} 