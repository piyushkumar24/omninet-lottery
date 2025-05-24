"use client";

import { Clock, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface NextDrawProps {
  nextDraw: Date;
  tickets: number;
}

export const NextDraw = ({ nextDraw, tickets }: NextDrawProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = nextDraw.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextDraw]);
  
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <h3 className="text-lg font-semibold text-purple-800">Next Lottery Draw</h3>
        <div className="p-2 bg-purple-100 rounded-lg">
          <Clock className="w-5 h-5 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown Timer - Main Display */}
        <div className="bg-white/70 rounded-xl p-4 border border-purple-200">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">{timeLeft.days}</div>
              <p className="text-xs font-medium text-purple-700">Days</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">{timeLeft.hours}</div>
              <p className="text-xs font-medium text-purple-700">Hours</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">{timeLeft.minutes}</div>
              <p className="text-xs font-medium text-purple-700">Min</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">{timeLeft.seconds}</div>
              <p className="text-xs font-medium text-purple-700">Sec</p>
            </div>
          </div>
        </div>
        
        {/* Draw Info - Secondary Display */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <Calendar className="w-4 h-4 text-orange-600" />
          <div className="text-center">
            <p className="text-sm font-medium text-orange-800">Your Participation</p>
            <p className="text-lg font-bold text-orange-900">{tickets} tickets</p>
          </div>
        </div>
        
        {/* Helpful Context */}
        <div className="text-xs text-purple-600 text-center">
          {tickets === 0 
            ? "⚡ Get tickets to join the next draw!" 
            : tickets === 1
            ? "🎯 You're entered! Get more tickets for better odds!"
            : `🚀 Great odds with ${tickets} tickets!`}
        </div>
      </CardContent>
    </Card>
  );
}; 