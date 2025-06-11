"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { CPXSurveyModal } from "@/components/survey/cpx-survey-modal";

interface LotteryCountdownProps {
  userId: string;
  drawDate: Date;
  prizeAmount: number;
}

export const LotteryCountdown = ({ 
  userId, 
  drawDate,
  prizeAmount
}: LotteryCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = drawDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [drawDate]);

  // Format numbers to always have two digits
  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <Card className="bg-blue-600 text-white rounded-3xl border-0 overflow-hidden shadow-lg h-full">
      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4 flex flex-col h-full">
        {/* Drawing Header */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2">
          <div className="flex items-center">
            <span className="text-lg md:text-xl font-semibold">Drawing on Thursday,</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">18:30 IST</div>
        </div>
        
        {/* Next Lottery Draw */}
        <div className="bg-white text-blue-900 rounded-full py-2 md:py-3 px-4 md:px-6 flex items-center justify-center space-x-2">
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-blue-900 flex items-center justify-center">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-900 rounded-full"></div>
          </div>
          <span className="text-base md:text-xl font-bold">Next Lottery Draw</span>
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

        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-1 md:gap-2">
          <div className="bg-blue-500 rounded-lg p-1 md:p-2 text-center">
            <div className="text-xl md:text-3xl font-bold">{formatNumber(timeLeft.days)}</div>
            <div className="text-xs md:text-sm">Days</div>
          </div>
          <div className="bg-blue-500 rounded-lg p-1 md:p-2 text-center">
            <div className="text-xl md:text-3xl font-bold">{formatNumber(timeLeft.hours)}</div>
            <div className="text-xs md:text-sm">Hours</div>
          </div>
          <div className="bg-blue-500 rounded-lg p-1 md:p-2 text-center">
            <div className="text-xl md:text-3xl font-bold">{formatNumber(timeLeft.minutes)}</div>
            <div className="text-xs md:text-sm">Minutes</div>
          </div>
          <div className="bg-blue-500 rounded-lg p-1 md:p-2 text-center">
            <div className="text-xl md:text-3xl font-bold">{formatNumber(timeLeft.seconds)}</div>
            <div className="text-xs md:text-sm">Seconds</div>
          </div>
        </div>

        {/* Claim Your Ticket Button */}
        <div className="mt-auto">
          <div className="relative">
            {/* Hidden CPXSurveyModal */}
            <div className="hidden">
              <CPXSurveyModal
                user={{ id: userId }}
                onSurveyComplete={() => {}}
              />
            </div>
            
            {/* Custom Button to Replace CPX Modal Trigger */}
            <button 
              onClick={() => {
                // Find and click the actual CPX modal button
                const modalButton = document.querySelector('[data-cpx-survey-button]');
                if (modalButton && modalButton instanceof HTMLButtonElement) {
                  modalButton.click();
                }
              }}
              className="w-full bg-gradient-to-r from-blue-400 to-blue-300 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <img src="/ticket-icon.png" alt="Ticket" className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-base md:text-lg">Claim Your Ticket</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 