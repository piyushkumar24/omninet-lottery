import { Metadata } from "next";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Users Management",
  description: "Manage users of the 0mninet lottery platform",
};

export default async function UsersPage() {
  // Get all users with their ticket counts
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      _count: {
        select: {
          tickets: {
            where: {
              isUsed: false
            }
          }
        }
      }
    }
  });

  // Format user data for the table
  const formattedUsers = users.map(user => ({
    id: user.id,
    name: user.name || "No Name",
    email: user.email || "No Email",
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    ticketCount: user._count.tickets
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