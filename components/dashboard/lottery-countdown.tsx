"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Clock, ExternalLink } from "lucide-react";

import { generateCPXSurveyURL } from "@/lib/cpx-utils";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CPXSurveyModal } from "@/components/survey/cpx-survey-modal";

interface LotteryCountdownProps {
  userId: string;
  prizeAmount: number;
}

export const LotteryCountdown = ({ 
  userId, 
  prizeAmount
}: LotteryCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // Calculate next Thursday at 18:30 IST (same logic as landing page)
  const getNextThursdayIST = () => {
    const now = new Date();
    
    // Get day of week (0 = Sunday, 4 = Thursday)
    const currentDay = now.getDay();
    
    // Calculate days until next Thursday
    const daysUntilThursday = (4 - currentDay + 7) % 7;
    
    // If it's Thursday but after 18:30 IST, get next Thursday
    if (daysUntilThursday === 0) {
      // Convert to IST (UTC+5:30)
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      const istTime = hours * 60 + minutes + 5 * 60 + 30; // Convert to minutes and add IST offset
      const istHours = Math.floor(istTime / 60) % 24;
      const istMinutes = istTime % 60;
      
      if (istHours > 18 || (istHours === 18 && istMinutes >= 30)) {
        // It's past 18:30 IST, so get next Thursday
        return new Date(
          now.getFullYear(), 
          now.getMonth(), 
          now.getDate() + 7, 
          18 - 5, // 18:00 IST in UTC
          30 - 30, // 30 minutes in UTC
          0,
          0
        );
      }
    }
    
    // Set to next Thursday at 18:30 IST (13:00 UTC)
    const nextThursday = new Date(now);
    nextThursday.setDate(now.getDate() + daysUntilThursday);
    nextThursday.setUTCHours(13, 0, 0, 0); // 18:30 IST is 13:00 UTC
    
    return nextThursday;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextDrawDate = getNextThursdayIST();
      const difference = nextDrawDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        // When countdown reaches zero, restart for next Thursday
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // Wait a second and recalculate for next week
        setTimeout(() => {
          const newNextDrawDate = getNextThursdayIST();
          const newDifference = newNextDrawDate.getTime() - new Date().getTime();
          
          if (newDifference > 0) {
            const days = Math.floor(newDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((newDifference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((newDifference / 1000 / 60) % 60);
            const seconds = Math.floor((newDifference / 1000) % 60);
            
            setTimeLeft({ days, hours, minutes, seconds });
          }
        }, 1000);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Initial calculation
    updateCountdown();
    
    // Set up interval to update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Format numbers to always have two digits
  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  // Define time units for consistent display with landing page
  const timeUnits = [
    { value: timeLeft.days, label: "Days", color: "from-emerald-500 to-emerald-600" },
    { value: timeLeft.hours, label: "Hours", color: "from-blue-500 to-blue-600" },
    { value: timeLeft.minutes, label: "Minutes", color: "from-purple-500 to-purple-600" },
    { value: timeLeft.seconds, label: "Seconds", color: "from-orange-500 to-orange-600" },
  ];

  return (
    <Card className="bg-blue-600 text-white rounded-3xl border-0 overflow-hidden shadow-lg h-full">
      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4 flex flex-col h-full">
        {/* Drawing Header - Styled to match landing page */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center gap-3">
            <Clock className="h-6 w-6 text-white animate-pulse" />
            <span className="text-lg font-semibold">Next Lottery Draw</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 md:p-8">
          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {timeUnits.map((unit, index) => (
              <div key={unit.label} className="flex flex-col items-center group">
                {/* Number display */}
                <div className={`
                  bg-gradient-to-br ${unit.color} 
                  text-white rounded-2xl w-full
                  py-2 md:py-4 text-center 
                  shadow-lg shadow-black/10
                  transition-all duration-300 
                  group-hover:scale-105 group-hover:shadow-xl
                  relative overflow-hidden
                `}>
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Number */}
                  <span className="text-2xl md:text-4xl font-bold relative z-10 font-mono">
                    {formatNumber(unit.value)}
                  </span>
                  
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                </div>
                
                {/* Label */}
                <span className="mt-3 text-sm md:text-base font-medium text-white/80 transition-colors duration-300 group-hover:text-opacity-100">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>

          {/* Additional info */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-sm text-white/80 font-medium">
                Next draw: Thursday at 18:30 IST
              </p>
              <div className="flex items-center justify-center mt-2 gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/80">
                  Weekly lottery - tickets reset after each draw
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Prize Amount */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 md:p-6 flex flex-col items-center">
          <div className="flex items-center space-x-3 md:space-x-4">
            <span className="text-3xl md:text-5xl font-bold">${prizeAmount}</span>
            <div className="flex flex-col">
              <img src="/amazon-logo.png" alt="Amazon" className="h-6 md:h-8" />
              <span className="text-xl md:text-2xl">gift card</span>
            </div>
          </div>
        </div>

        {/* Claim Your Ticket Button */}
        <div className="mt-auto">
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
            className="w-full bg-gradient-to-r from-blue-400 to-blue-300 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-base md:text-lg">📱 Claim Your Ticket</span>
          </Button>
        </div>
      </CardContent>

      {/* Mobile Survey Modal */}
      <CPXSurveyModal
        user={{ id: userId }}
        open={showSurveyModal}
        onOpenChange={setShowSurveyModal}
        onSurveyComplete={(success) => {
          // Optional: Add any specific handling after survey completion
        }}
        isLoading={false}
        disabled={false}
      />
    </Card>
  );
}; 