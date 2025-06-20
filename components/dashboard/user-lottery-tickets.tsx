"use client";

import { Ticket, Trophy, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketDebug } from "@/components/dashboard/ticket-debug";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { generateCPXSurveyURL } from "@/lib/cpx-utils";
import { toast } from "react-hot-toast";
import { CPXSurveyModal } from "@/components/survey/cpx-survey-modal";
import { SurveyCompletionAlert } from "./survey-completion-alert";
import { NonWinnerBonusAlert } from "./NonWinnerBonusAlert";

interface LotteryStatus {
  userTicketsInDraw: number;
  totalTicketsInDraw: number;
  winningChance: number;
  winningChancePercent: number;
  userAvailableTickets: number;
  isParticipating: boolean;
  drawId: string;
  drawEndTime: string | null;
}

interface UserLotteryTicketsProps {
  userId: string;
  surveyCompleted?: boolean;
  totalTicketsInDraw?: number;
}

export const UserLotteryTickets = ({
  userId,
  surveyCompleted = false,
  totalTicketsInDraw = 0,
}: UserLotteryTicketsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatus | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch lottery status from API
  const fetchLotteryStatus = async (showLoader = false) => {
    if (showLoader) {
      setIsRefreshing(true);
    }
    
    try {
      // Add cache-busting timestamp to prevent stale data
      const timestamp = Date.now();
      const response = await fetch(`/api/dashboard/lottery-status?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLotteryStatus(data.data);
          setLastRefreshed(new Date());
        } else {
          console.error('[DASHBOARD] Failed to fetch lottery status:', data.message);
        }
      } else {
        console.error('[DASHBOARD] Error response from lottery status API:', response.status);
      }
    } catch (err) {
      console.error("[DASHBOARD] Error fetching lottery status:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLotteryStatus(true);
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLotteryStatus(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // Manual refresh handler
  const refreshTicketData = async () => {
    await fetchLotteryStatus(true);
    
    toast.success("Refreshed lottery data", {
      duration: 2000,
      position: "bottom-center",
    });
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 flex items-center">
            <Ticket className="h-5 w-5 mr-2 text-blue-600" />
            Your Lottery Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-blue-200 rounded mb-2"></div>
              <div className="h-3 w-24 bg-blue-100 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get ticket counts from lottery status
  const userTicketsInDraw = lotteryStatus?.userTicketsInDraw || 0;
  const totalTicketsInCurrentDraw = lotteryStatus?.totalTicketsInDraw || totalTicketsInDraw || 0;
  
  // Calculate winning chance
  const winningChancePercent = lotteryStatus?.winningChancePercent || 0;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-blue-800 flex items-center">
            <Ticket className="h-5 w-5 mr-2 text-blue-600" />
            Your Lottery Tickets
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshTicketData}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
            title="Refresh ticket data"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-6">
          {/* Ticket Count */}
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-700">{userTicketsInDraw}</div>
            <div className="text-sm text-blue-600 mt-1">
              {userTicketsInDraw === 1 ? "Ticket Applied" : "Tickets Applied"}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              to this week&apos;s lottery
            </div>
          </div>

          {/* Win Probability Information */}
          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
            <div className="text-center mb-2">
              <div className="text-3xl font-bold text-blue-700">{Math.round(winningChancePercent)}%</div>
              <div className="text-sm text-blue-600">Winning Chance</div>
            </div>
            
            <div className="text-center text-xs text-blue-500 mt-2">
              {userTicketsInDraw > 0 
                ? `${userTicketsInDraw} of ${totalTicketsInCurrentDraw} total tickets`
                : totalTicketsInCurrentDraw > 0 
                  ? "You have no tickets in this draw"
                  : "No tickets in the current draw yet"
              }
            </div>
            
            {userTicketsInDraw === 0 && (
              <div className="text-center text-xs text-blue-600 mt-3 p-2 bg-blue-50 rounded-md">
                Earn tickets to participate in the lottery draw
              </div>
            )}
          </div>
          
          <div className="text-xs text-blue-400 text-center">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 