"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DrawLogsTable } from "@/components/admin/draw-logs-table";
import { ManualDrawForm } from "@/components/admin/manual-draw-form";
import { ManualWinnerSelect } from "@/components/admin/manual-winner-select";
import { LotteryResetCard } from "@/components/admin/lottery-reset-card";
import { Gift, Users, AlertTriangle, Calendar, Ticket, Info } from "lucide-react";
import { DrawStatus } from "@prisma/client";
import { toast } from "react-hot-toast";

interface DrawData {
  id: string;
  drawDate: string;
  prizeAmount: number;
  status: DrawStatus;
  totalTickets: number;
  createdAt: string;
  updatedAt: string;
  winners: Array<{
    id: string;
    userId: string;
    prizeAmount: number;
    user: {
      name: string | null;
      email: string | null;
      image?: string | null;
    };
    claimed?: boolean;
  }>;
  participants: Array<{
    id: string;
    userId: string;
    ticketsUsed: number;
    createdAt: string;
    user: {
      name: string | null;
      email: string | null;
      image?: string | null;
    };
  }>;
}

interface Stats {
  totalWinners: number;
  totalParticipants: number;
  totalTicketsInSystem: number;
  totalTicketsEarned: number;
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawData[]>([]);
  const [activeDraw, setActiveDraw] = useState<DrawData | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalWinners: 0,
    totalParticipants: 0,
    totalTicketsInSystem: 0,
    totalTicketsEarned: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrawsData();
  }, []);

  const fetchDrawsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch draws data
      const drawsResponse = await fetch('/api/admin/draws');
      const drawsData = await drawsResponse.json();
      
      if (drawsData.success) {
        setDraws(drawsData.data.draws);
        setActiveDraw(drawsData.data.activeDraw);
      }
      
      // Fetch lottery stats
      const statsResponse = await fetch('/api/admin/reset-lottery');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats({
          totalWinners: drawsData.data.draws.reduce((sum: number, draw: DrawData) => sum + draw.winners.length, 0),
          totalParticipants: statsData.data.usersWithAvailableTickets,
          totalTicketsInSystem: statsData.data.totalAvailableTickets,
          totalTicketsEarned: statsData.data.totalEarnedTickets
        });
      }
      
    } catch (error) {
      console.error('Error fetching draws data:', error);
      toast.error('Failed to fetch draws data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLotteryReset = async (drawId: string) => {
    try {
      const response = await fetch('/api/admin/reset-lottery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drawId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Lottery reset successful! Reset tickets for ${data.data.usersReset} users.`);
        await fetchDrawsData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to reset lottery');
      }
    } catch (error) {
      console.error('Error resetting lottery:', error);
      toast.error('Failed to reset lottery');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Draw Management</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading draws data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform draws data for DrawLogsTable
  const transformedDraws = draws.flatMap(draw => 
    draw.winners.map(winner => ({
      id: winner.id,
      userName: winner.user.name || "Unknown",
      userEmail: winner.user.email || "Unknown",
      userImage: winner.user.image || null,
      ticketCount: draw.totalTickets,
      prizeAmount: winner.prizeAmount,
      claimed: winner.claimed || false, // Use the actual claimed status from the winner record
      drawDate: new Date(draw.drawDate),
      createdAt: new Date(draw.createdAt),
    }))
  );

  // Transform participants data for ManualWinnerSelect
  const transformedParticipants = activeDraw ? activeDraw.participants.map(participant => ({
    id: participant.userId,
    name: participant.user.name || "Anonymous",
    email: participant.user.email || "Unknown",
    image: participant.user.image || null,
    ticketsUsed: participant.ticketsUsed,
    participatedAt: new Date(participant.createdAt),
  })) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Draw Management</h1>
      </div>

      {/* Lottery Reset Card - Only show if there are available tickets */}
      <LotteryResetCard 
        activeDraw={activeDraw}
        totalTicketsInSystem={stats.totalTicketsInSystem}
        totalParticipants={stats.totalParticipants}
      />

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
                  <p className="text-2xl font-bold text-blue-900">{activeDraw.participants.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Ticket className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-700">Tickets in Draw</p>
                  <p className="text-2xl font-bold text-purple-900">{activeDraw.totalTickets}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Ticket className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">Available Tickets</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalTicketsInSystem}</p>
                  <p className="text-xs text-green-500">From {stats.totalParticipants} users</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Info className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Total Tickets Earned (All Time)</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.totalTicketsEarned}</p>
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
            canRunDraw={!!activeDraw && activeDraw.participants.length > 0}
            participantCount={activeDraw ? activeDraw.participants.length : 0}
            totalTicketsInDraw={activeDraw ? activeDraw.totalTickets : 0}
          />
        </CardContent>
      </Card>
      
      {/* Manual Winner Selection */}
      {activeDraw && (
        <ManualWinnerSelect 
          canRunDraw={activeDraw.participants.length > 0}
          participants={transformedParticipants}
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
        <CardContent>
          <DrawLogsTable draws={transformedDraws} />
        </CardContent>
      </Card>
    </div>
  );
} 