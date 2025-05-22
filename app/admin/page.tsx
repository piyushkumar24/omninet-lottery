import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { UsersChart } from "@/components/admin/users-chart";
import { AdminStats } from "@/components/admin/admin-stats";
import { RecentWinnersList } from "@/components/admin/recent-winners-list";

export const metadata: Metadata = {
  title: "Admin Dashboard | Social Lottery",
  description: "Admin dashboard for the social lottery platform",
};

export default async function AdminDashboardPage() {
  // Get user statistics
  const totalUsers = await db.user.count();
  const activeUsers = await db.user.count({
    where: {
      isBlocked: false,
    },
  });
  
  // Get ticket statistics
  const totalTickets = await db.ticket.count();
  const unusedTickets = await db.ticket.count({
    where: {
      isUsed: false,
    },
  });
  
  // Get winner statistics
  const totalWinners = await db.winner.count();
  const unclaimedPrizes = await db.winner.count({
    where: {
      claimed: false,
    },
  });
  
  // Get recent winners
  const recentWinners = await db.winner.findMany({
    take: 5,
    orderBy: {
      drawDate: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStats 
          totalUsers={totalUsers}
          activeUsers={activeUsers}
          totalTickets={totalTickets}
          unusedTickets={unusedTickets}
          totalWinners={totalWinners}
          unclaimedPrizes={unclaimedPrizes}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-4">User Registrations</h2>
          <UsersChart />
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Winners</h2>
          <RecentWinnersList winners={recentWinners} />
        </Card>
      </div>
    </div>
  );
} 