import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DrawLogsTable } from "@/components/admin/draw-logs-table";
import { ManualDrawForm } from "@/components/admin/manual-draw-form";
import { ManualWinnerSelect } from "@/components/admin/manual-winner-select";
import { Gift, Users, AlertTriangle, Calendar, Ticket, Info } from "lucide-react";
import { DrawStatus } from "@prisma/client";
import { getUserAppliedTickets } from "@/lib/ticket-utils";

export const metadata: Metadata = {
  title: "Draw Management | Admin Dashboard",
  description: "Manage lottery draws, select winners, and process prizes",
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

  // Get current active draw
  const activeDraw = await db.draw.findFirst({
    where: {
      status: DrawStatus.PENDING,
      drawDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      drawDate: 'asc',
    },
  });

  // Get participants for the active draw if it exists
  const participants = activeDraw ? await db.drawParticipation.findMany({
    where: { drawId: activeDraw.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          availableTickets: true,
          totalTicketsEarned: true,
        },
      },
    },
  }) : [];

  // Get participation statistics
  const participantCount = participants.length || 0;
  
  // Calculate total tickets in draw from participation records (more accurate)
  let totalTicketsInDraw = 0;
  if (participants.length > 0) {
    // Sum up all ticketsUsed from participation records
    totalTicketsInDraw = participants.reduce((total, participant) => {
      return total + participant.ticketsUsed;
    }, 0);
  }

  // Get all users with available tickets (tickets that can be applied to the lottery)
  const usersWithAvailableTickets = await db.user.findMany({
    where: {
      availableTickets: {
        gt: 0
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      availableTickets: true,
    }
  });

  // Calculate total available tickets across all users
  const totalAvailableTickets = usersWithAvailableTickets.reduce((total, user) => {
    return total + user.availableTickets;
  }, 0);

  // Get total tickets earned across all users (lifetime)
  const totalTicketsStats = await db.user.aggregate({
    _sum: {
      totalTicketsEarned: true
    }
  });
  
  const totalTicketsEarnedAllTime = totalTicketsStats._sum.totalTicketsEarned || 0;

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

  // Format participants data for manual selection
  const formattedParticipants = participants.map(participant => ({
    id: participant.userId,
    name: participant.user.name,
    email: participant.user.email,
    image: participant.user.image,
    ticketsUsed: participant.ticketsUsed,
    participatedAt: participant.createdAt,
  }));

  const canRunDraw = participantCount > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Draw Management</h1>
      </div>

      {/* Current Draw Status */}
      {activeDraw && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Current Active Draw
            </CardTitle>
            <CardDescription>
              Draw scheduled for {format(new Date(activeDraw.drawDate), 'EEEE, MMMM do, yyyy \'at\' h:mm a')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Participants</p>
                  <p className="text-2xl font-bold text-blue-900">{participantCount}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Ticket className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-700">Tickets in Draw</p>
                  <p className="text-2xl font-bold text-purple-900">{totalTicketsInDraw}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Ticket className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">Available Tickets</p>
                  <p className="text-2xl font-bold text-green-900">{totalAvailableTickets}</p>
                  <p className="text-xs text-green-500">From {usersWithAvailableTickets.length} users</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Info className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Total Tickets Earned (All Time)</p>
                  <p className="text-2xl font-bold text-amber-900">{totalTicketsEarnedAllTime}</p>
                  <p className="text-xs text-amber-500">Lifetime tickets across all users</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <Gift className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-700">Prize Amount</p>
                  <p className="text-2xl font-bold text-indigo-900">${activeDraw.prizeAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {!canRunDraw && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800">Cannot Run Draw</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    At least 1 user must manually participate in the lottery before a draw can be run. 
                    Simply having tickets is not enough - users must explicitly enter the lottery.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Manual Draw Trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-600" />
            Random Draw Selection
          </CardTitle>
          <CardDescription>
            Run a lottery draw with random winner selection for the current active draw
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualDrawForm 
            canRunDraw={canRunDraw}
            participantCount={participantCount}
            totalTicketsInDraw={totalTicketsInDraw}
          />
        </CardContent>
      </Card>
      
      {/* Manual Winner Selection */}
      {activeDraw && (
        <ManualWinnerSelect 
          canRunDraw={canRunDraw}
          participants={formattedParticipants}
          drawDate={new Date(activeDraw.drawDate)}
          prizeAmount={activeDraw.prizeAmount}
        />
      )}
      
      {/* Past Draws */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Past Draws & Winners
          </CardTitle>
          <CardDescription>
            History of all lottery draws, winners, and prize claim status
          </CardDescription>
        </CardHeader>
        <DrawLogsTable draws={formattedDraws} />
      </Card>
    </div>
  );
} 