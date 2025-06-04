"use client";

import { Ticket, CheckCircle2, Trophy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketDebug } from "@/components/dashboard/ticket-debug";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface UserLotteryTicketsProps {
  userId: string;
  appliedTickets: number;
  userParticipation?: {
    ticketsUsed: number;
  } | null;
  drawId: string;
  surveyCompleted?: boolean;
}

export const UserLotteryTickets = ({
  userId,
  appliedTickets,
  userParticipation,
  drawId,
  surveyCompleted = false,
}: UserLotteryTicketsProps) => {
  const participationTickets = userParticipation?.ticketsUsed || 0;
  const [showDebug, setShowDebug] = useState(false);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [localTicketCount, setLocalTicketCount] = useState(appliedTickets);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update local ticket count when props change
  useEffect(() => {
    setLocalTicketCount(appliedTickets);
  }, [appliedTickets]);

  // Calculate win probability percentage (assuming total tickets in draw is around 100)
  // This is just an estimate for display purposes
  const estimatedTotalTickets = 100;
  const winProbability = localTicketCount > 0 
    ? (localTicketCount / estimatedTotalTickets) * 100 
    : 0;
  
  // Format probability with 2 decimal places
  const formattedProbability = winProbability.toFixed(2);

  // Check for ticket discrepancy if survey was just completed
  useEffect(() => {
    if (surveyCompleted) {
      checkForDiscrepancy();
    }
  }, [surveyCompleted]);

  // Refresh tickets data every 10 seconds
  useEffect(() => {
    // Initial fetch
    refreshTicketData(false);
    
    const interval = setInterval(() => {
      refreshTicketData(false);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const checkForDiscrepancy = async () => {
    try {
      const response = await fetch(`/api/tickets/verify-all?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasDiscrepancy(data.data.hasDiscrepancy);
        setShowDebug(data.data.hasDiscrepancy);
      }
    } catch (err) {
      console.error("Error checking for ticket discrepancy:", err);
    }
  };

  const refreshTicketData = async (showRefreshing = true) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch(`/api/tickets/verify-all?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocalTicketCount(data.data.totalTickets);
      }
    } catch (err) {
      console.error("Error refreshing ticket data:", err);
    } finally {
      if (showRefreshing) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-lg font-semibold text-blue-800">Your Lottery Tickets</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200"
            onClick={() => refreshTicketData()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Ticket className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Applied Tickets Display */}
        <div className="text-center p-4 bg-white/70 rounded-xl border border-blue-200">
          <div className="text-4xl font-bold text-blue-900 mb-1">{localTicketCount}</div>
          <p className="text-sm font-medium text-blue-700">
            {localTicketCount === 1 ? "Ticket Applied" : "Tickets Applied"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            to this week&apos;s lottery
          </p>
        </div>

        {/* Win Probability Information */}
        {localTicketCount > 0 && (
          <div className="bg-green-50/70 rounded-xl p-3 border border-green-200">
            <div className="flex items-center justify-center mb-1">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 px-3 py-1 gap-1">
                <Trophy className="h-3.5 w-3.5" />
                <span>Win Probability</span>
              </Badge>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-green-700">{formattedProbability}%</div>
              <p className="text-xs text-green-600 text-center">
                Each ticket increases your chances by 1%
              </p>
            </div>
          </div>
        )}

        {/* Auto-Apply Information */}
        <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Auto-Apply System</span>
            </Badge>
          </div>
          <p className="text-sm text-center text-blue-700">
            All tickets are automatically applied to the lottery as you earn them.
          </p>
        </div>

        {/* Status Message */}
        <div className="text-xs text-blue-600 text-center">
          {localTicketCount === 0 
            ? "Complete surveys or invite friends to earn tickets!" 
            : localTicketCount === 1
            ? "You have 1 entry in this week's lottery. Good luck! 🍀"
            : `You have ${localTicketCount} entries in this week's lottery. Good luck! 🍀`}
        </div>
        
        {/* Show ticket debug only if needed (survey completed and has discrepancy) or manually toggled */}
        {(showDebug || (surveyCompleted && hasDiscrepancy)) && (
          <TicketDebug userId={userId} initialTicketCount={localTicketCount} />
        )}
        
        {/* Show a "Ticket not showing?" button when survey is completed but no discrepancy detected */}
        {surveyCompleted && !hasDiscrepancy && localTicketCount === 0 && (
          <div className="mt-2">
            <button 
              onClick={() => setShowDebug(true)} 
              className="w-full py-2 px-3 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              Ticket not showing? Click here
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 