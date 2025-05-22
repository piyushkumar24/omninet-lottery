import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCards } from "@/components/admin/stats-cards";
import { TicketsChart } from "@/components/admin/tickets-chart";
import { PlatformMetrics } from "@/components/admin/platform-metrics";

export const metadata: Metadata = {
  title: "Platform Stats | Admin Dashboard",
  description: "Platform statistics for the social lottery",
};

export default async function StatsPage() {
  // Get total users
  const totalUsers = await db.user.count();
  
  // Get users active in the last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const activeUsers = await db.user.count({
    where: {
      updatedAt: {
        gte: oneWeekAgo
      }
    }
  });
  
  // Get ticket stats
  const totalTickets = await db.ticket.count();
  const activeTickets = await db.ticket.count({
    where: {
      isUsed: false
    }
  });
  
  // Get tickets by source
  const surveyTickets = await db.ticket.count({
    where: {
      source: "SURVEY"
    }
  });
  
  const referralTickets = await db.ticket.count({
    where: {
      source: "REFERRAL"
    }
  });
  
  const socialTickets = await db.ticket.count({
    where: {
      source: "SOCIAL"
    }
  });
  
  // Get winner stats
  const totalWinners = await db.winner.count();
  const unclaimedPrizes = await db.winner.count({
    where: {
      claimed: false
    }
  });
  
  // Calculate total prize amount
  const totalPrizeAmount = await db.winner.aggregate({
    _sum: {
      prizeAmount: true
    }
  });

  // Get ticket creation data by day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ticketsData = await db.ticket.groupBy({
    by: ['createdAt'],
    _count: {
      id: true
    },
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Platform Statistics</h1>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <StatsCards 
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            totalTickets={totalTickets}
            activeTickets={activeTickets}
            totalWinners={totalWinners}
            totalPrize={totalPrizeAmount._sum.prizeAmount || 0}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PlatformMetrics 
                  surveyTickets={surveyTickets}
                  referralTickets={referralTickets}
                  socialTickets={socialTickets}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Winner Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Total Winners</h3>
                  <p className="text-3xl font-bold">{totalWinners}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Unclaimed Prizes</h3>
                  <p className="text-3xl font-bold">{unclaimedPrizes}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Total Prize Amount</h3>
                  <p className="text-3xl font-bold">${totalPrizeAmount._sum.prizeAmount || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Generation (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <TicketsChart ticketsData={ticketsData} />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold">{surveyTickets}</h3>
                <p className="text-sm text-slate-500">Survey Tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold">{referralTickets}</h3>
                <p className="text-sm text-slate-500">Referral Tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold">{socialTickets}</h3>
                <p className="text-sm text-slate-500">Social Tickets</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold">{totalUsers}</h3>
                <p className="text-sm text-slate-500">Total Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold">{activeUsers}</h3>
                <p className="text-sm text-slate-500">Active Users (Last 7 Days)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 