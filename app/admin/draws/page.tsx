import { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DrawLogsTable } from "@/components/admin/draw-logs-table";
import { ManualDrawForm } from "@/components/admin/manual-draw-form";
import { ManualWinnerSelect } from "@/components/admin/manual-winner-select";
import { Gift, Users, AlertTriangle, Calendar, Ticket } from "lucide-react";
import { DrawStatus } from "@prisma/client";
import { getCurrentDrawWithAccurateTickets } from "@/lib/draw-utils";

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

  // Get current active draw with accurate ticket count using utility function
  const activeDraw = await getCurrentDrawWithAccurateTickets();

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
        },
      },
    },
  }) : [];

  // Get participation statistics
  const participantCount = participants.length || 0;
  const totalTicketsInDraw = activeDraw?.totalTickets || 0;

  // Get active tickets count (not in any draw)
  const unusedTickets = await db.ticket.count({
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
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Ticket className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Unused Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{unusedTickets}</p>
                  <p className="text-xs text-gray-500">Not in any draw</p>
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