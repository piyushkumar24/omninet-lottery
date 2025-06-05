import { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { UsersTable } from "@/components/admin/users-table";
import { unstable_noStore } from "next/cache";

export const metadata: Metadata = {
  title: "Users Management | Admin Dashboard",
  description: "Manage users, block accounts, and view user activity",
};

// Disable caching for this page to ensure fresh ticket data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
  // Disable caching to ensure fresh data
  unstable_noStore();
  
  // Check if user is admin
  const role = await currentRole();
  
  if (role !== UserRole.ADMIN) {
    return redirect("/dashboard");
  }

  // Get all users with their ticket information
  // Add timestamp to ensure no caching
  const timestamp = Date.now();
  console.log(`[${timestamp}] Admin panel fetching users with ticket data`);
  
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      availableTickets: true,
      totalTicketsEarned: true,
      hasWon: true,
    }
  });

  console.log(`[${timestamp}] Found ${users.length} users, processing ticket data`);

  // Format users for the table component
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name || "No Name",
    email: user.email || "No Email",
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    ticketCount: user.availableTickets || 0, // Available tickets for current lottery
    totalTicketsEarned: user.totalTicketsEarned || 0, // Total tickets earned over time
    hasWon: user.hasWon || false
  }));

  // Calculate total available tickets for summary
  const totalAvailableTickets = formattedUsers.reduce((sum, user) => sum + user.ticketCount, 0);
  const totalEarnedTickets = formattedUsers.reduce((sum, user) => sum + user.totalTicketsEarned, 0);

  console.log(`[${timestamp}] Total available tickets: ${totalAvailableTickets}, Total earned: ${totalEarnedTickets}`);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {formattedUsers.length} users found
          </span>
        </div>
      </div>
      
      <UsersTable users={formattedUsers} />
    </div>
  );
} 