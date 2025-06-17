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

interface UserLotteryTicketsProps {
  userId: string;
  appliedTickets: number;
  userParticipation?: {
    ticketsUsed: number;
  } | null;
  drawId: string;
  surveyCompleted?: boolean;
  totalTicketsInDraw: number;
}

interface LotteryStatus {
  userTicketsInDraw: number;
  userAvailableTickets: number;
  userTotalTicketsEarned: number;
  totalTicketsInDraw: number;
  winningChancePercent: number;
  drawId: string | null;
  drawDate: string;
  prizeAmount: number;
  hasParticipation: boolean;
}

export const UserLotteryTickets = ({
  userId,
  appliedTickets,
  userParticipation,
  drawId,
  surveyCompleted = false,
  totalTicketsInDraw = 100, // Default value if not provided
}: UserLotteryTicketsProps) => {
  const [showDebug, setShowDebug] = useState(false);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lotteryStatus, setLotteryStatus] = useState<LotteryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // Fetch lottery status from optimized endpoint
  const fetchLotteryStatus = async (showLoader = false) => {
    if (showLoader) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch(`/api/dashboard/lottery-status?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLotteryStatus(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching lottery status:", err);
    } finally {
      if (showLoader) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
      setIsLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchLotteryStatus();
    
    const interval = setInterval(() => {
      fetchLotteryStatus(false);
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(interval);
  }, [userId]);

  // Format probability with appropriate decimal places
  const formattedProbability = (() => {
    if (!lotteryStatus) return "0";
    
    const percent = lotteryStatus.winningChancePercent;
    // For very small percentages (under 1%), show one decimal place
    if (percent < 1 && percent > 0) {
      return percent.toFixed(1);
    }
    // For percentages between 1-10%, show one decimal place for precision
    if (percent < 10 && percent >= 1) {
      return percent.toFixed(1);
    }
    // Otherwise show as whole number
    return Math.floor(percent).toString();
  })();

  // Check for ticket discrepancy if survey was just completed
  useEffect(() => {
    if (surveyCompleted) {
      checkForDiscrepancy();
    }
  }, [surveyCompleted]);

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

  const refreshTicketData = async () => {
    await fetchLotteryStatus(true);
    // Also refresh the ticket verification
    await checkForDiscrepancy();
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl border-0 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700">Loading lottery status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const userTicketsInDraw = lotteryStatus?.userTicketsInDraw || 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl border-0 shadow-lg h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-3 space-y-0 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base md:text-xl font-bold text-blue-900">Your Lottery Tickets</CardTitle>
          <div className="p-1 bg-blue-200 rounded-md">
            <Ticket className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-blue-100 hover:bg-blue-200"
          onClick={refreshTicketData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 md:px-6 md:pb-6 flex flex-col">
        {/* Applied Tickets Display */}
        <div className="text-center p-4 bg-white rounded-2xl border border-blue-200">
          <div className="text-5xl font-bold text-blue-900 mb-2">{userTicketsInDraw}</div>
          <p className="text-lg font-medium text-blue-800">
            Tickets Applied
          </p>
          <p className="text-sm text-blue-700 mt-1">
            to this week&apos;s lottery
          </p>
          {lotteryStatus && lotteryStatus.userAvailableTickets > 0 && (
            <p className="text-xs text-blue-600 mt-2">
              +{lotteryStatus.userAvailableTickets} available to apply
            </p>
          )}
        </div>

        {/* Win Probability Information */}
        <div className="text-center p-4 bg-white rounded-2xl border border-blue-200">
          <div className="text-5xl font-bold text-blue-900 mb-2">{formattedProbability}%</div>
          <p className="text-lg font-medium text-blue-800">
            Winning Chance
          </p>
          {lotteryStatus && lotteryStatus.totalTicketsInDraw > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              {userTicketsInDraw} of {lotteryStatus.totalTicketsInDraw} total tickets
            </p>
          )}
        </div>

        {/* Complete Surveys Message */}
        <div className="text-center text-blue-900 text-lg font-medium py-2">
          Complete surveys to earn tickets!
        </div>

        {/* Claim Your Ticket Button */}
        <div>
          <Button 
            onClick={() => {
              try {
                // Check if user is on mobile
                const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                if (isMobile) {
                  // Mobile: Open the survey modal popup
                  setShowSurveyModal(true);
                  
                  toast.success("📱 Opening survey popup...", {
                    duration: 2000,
                    icon: "🎫",
                    style: {
                      border: '2px solid #3b82f6',
                      padding: '16px',
                      fontSize: '14px',
                      maxWidth: '350px',
                    },
                  });
                  
                } else {
                  // Desktop: Generate the CPX survey URL and open in new tab
                  const surveyUrl = generateCPXSurveyURL({ id: userId });
                  window.open(surveyUrl, '_blank', 'noopener,noreferrer');
                  
                  toast.success("🔗 Survey opened in new tab! Complete it to earn your ticket.", {
                    duration: 6000,
                    icon: "🎫",
                    style: {
                      border: '2px solid #3b82f6',
                      padding: '16px',
                      fontSize: '14px',
                    },
                  });
                  
                  // Refresh data after potential survey completion for desktop
                  setTimeout(() => {
                    fetchLotteryStatus(false);
                  }, 2000);
                }
                
              } catch (error) {
                console.error("Error opening survey:", error);
                toast.error("❌ Failed to open survey. Please try again.", {
                  duration: 4000,
                  style: {
                    border: '2px solid #ef4444',
                    padding: '16px',
                    fontSize: '14px',
                  },
                });
              }
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-lg">📱 Claim Your Ticket</span>
          </Button>
        </div>
        
        {/* Show ticket debug only if needed (survey completed and has discrepancy) or manually toggled */}
        {(showDebug || (surveyCompleted && hasDiscrepancy)) && (
          <TicketDebug userId={userId} initialTicketCount={userTicketsInDraw} />
        )}
        
        {/* Show a "Ticket not showing?" button when survey is completed but no discrepancy detected */}
        {surveyCompleted && !hasDiscrepancy && userTicketsInDraw === 0 && (
          <div className="mt-2">
            <button 
              onClick={() => setShowDebug(true)} 
              className="w-full py-2 px-3 text-xs md:text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            >
              Ticket not showing? Click here
            </button>
          </div>
        )}
      </CardContent>

      {/* Mobile Survey Modal */}
      <CPXSurveyModal
        user={{ id: userId }}
        open={showSurveyModal}
        onOpenChange={setShowSurveyModal}
        onSurveyComplete={(success) => {
          // Refresh lottery status after survey completion
          fetchLotteryStatus(false);
        }}
        isLoading={false}
        disabled={false}
      />
    </Card>
  );
}; 