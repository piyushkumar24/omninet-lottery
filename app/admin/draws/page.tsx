import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DrawLogsTable } from "@/components/admin/draw-logs-table";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

export const metadata: Metadata = {
  title: "Draw Logs | Admin Dashboard",
  description: "View lottery draw logs and winners",
};

export default async function DrawsPage() {
  // Get all winners with user info
  const winners = await db.winner.findMany({
    orderBy: {
      drawDate: "desc"
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        }
      }
    }
  });

  // Get active tickets count
  const activeTickets = await db.ticket.count({
    where: {
      isUsed: false
    }
  });

  // Format draws data for the table
  const formattedDraws = winners.map(winner => ({
    id: winner.id,
    userName: winner.user.name || "Unknown",
    userEmail: winner.user.email || "Unknown",
    userImage: winner.user.image,
    ticketCount: winner.ticketCount,
    prizeAmount: winner.prizeAmount,
    claimed: winner.claimed,
    drawDate: winner.drawDate,
    createdAt: winner.createdAt,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Draw Logs</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Trigger Manual Draw</CardTitle>
          <CardDescription>
            Run a lottery draw manually instead of waiting for the scheduled time
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Active tickets in the pool</p>
            <p className="text-3xl font-bold">{activeTickets}</p>
          </div>
          <form action="/api/admin/draws/manual" method="POST">
            <Button 
              type="submit" 
              disabled={activeTickets === 0}
              className="flex items-center"
            >
              <Gift className="mr-2 h-4 w-4" />
              Run Weekly Draw Now
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Past Draws</CardTitle>
          <CardDescription>History of all lottery draws and winners</CardDescription>
        </CardHeader>
        <DrawLogsTable draws={formattedDraws} />
      </Card>
    </div>
  );
} 