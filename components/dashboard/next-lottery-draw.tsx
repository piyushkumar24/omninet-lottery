"use client";

import { Clock, Calendar, DollarSign, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface NextLotteryDrawProps {
  draw: {
    id: string;
    drawDate: string;
    prizeAmount: number;
    totalTickets: number;
    status?: string;
  };
  userTickets: number;
  isWinner?: boolean;
}

export const NextLotteryDraw = ({ 
  draw, 
  userTickets,
  isWinner = false 
}: NextLotteryDrawProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isExpired, setIsExpired] = useState(false);
  const [nextDrawDate, setNextDrawDate] = useState<Date | null>(null);
  
  const drawDate = useMemo(() => new Date(draw.drawDate), [draw.drawDate]);
  const isDrawCompleted = draw.status === "COMPLETED";
  
  // Calculate next draw date (next Thursday at 18:30 IST)
  const calculateNextDrawDate = () => {
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
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        nextWeek.setHours(18, 30, 0, 0);
        return nextWeek;
      }
    }
    
    // Set to next Thursday at 18:30
    const nextDraw = new Date(now);
    nextDraw.setDate(now.getDate() + daysUntilThursday);
    nextDraw.setHours(18, 30, 0, 0);
    
    return nextDraw;
  };
  
  useEffect(() => {
    // If draw is already completed or expired, calculate next draw date
    if (isDrawCompleted || isExpired) {
      setNextDrawDate(calculateNextDrawDate());
    }
  }, [isDrawCompleted, isExpired]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Use the next draw date if available, otherwise use the current draw date
      const targetDate = nextDrawDate || drawDate;
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        
        if (!nextDrawDate) {
          // Original draw expired, calculate next draw date
          setIsExpired(true);
          const nextDraw = calculateNextDrawDate();
          setNextDrawDate(nextDraw);
        }
        
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
  }, [drawDate, nextDrawDate]);
  
  if (isWinner) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
          <CardTitle className="text-lg font-semibold text-amber-800">Congratulations!</CardTitle>
          <div className="p-2 bg-amber-100 rounded-lg">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-white/70 rounded-xl border border-amber-200">
            <div className="inline-flex justify-center items-center mb-4 w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">You Won the Lottery!</h2>
            <p className="text-amber-700">
              You've won a ${draw.prizeAmount} Amazon Gift Card!
            </p>
            <Badge className="mt-3 bg-amber-100 text-amber-800 border-amber-300">
              Check your email for details
            </Badge>
          </div>
          
          <div className="bg-white/70 rounded-xl p-4 border border-amber-200">
            <p className="text-sm text-center text-amber-700">
              All your tickets have been reset. Start collecting new tickets for the next draw!
            </p>
          </div>
          
          <div className="text-xs text-amber-600 text-center">
            The next lottery draw will be held next Thursday.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-lg font-semibold text-purple-800">
          {nextDrawDate ? "Next Lottery Draw" : "Current Lottery Draw"}
        </CardTitle>
        <div className="p-2 bg-purple-100 rounded-lg">
          <Clock className="w-5 h-5 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prize Amount */}
        <div className="text-center p-4 bg-white/70 rounded-xl border border-purple-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div className="text-3xl font-bold text-green-800">${draw.prizeAmount}</div>
          </div>
          <p className="text-sm font-medium text-purple-700">Prize Pool</p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-white/70 rounded-xl p-4 border border-purple-200">
          <p className="text-sm font-medium text-purple-700 text-center mb-3">
            {isExpired && !nextDrawDate 
              ? "Draw results being processed..." 
              : nextDrawDate 
                ? "Time Until Next Week's Draw" 
                : "Time Until Draw"}
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="text-xl font-bold text-purple-900">{timeLeft.days}</div>
              <p className="text-xs font-medium text-purple-700">Days</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="text-xl font-bold text-purple-900">{timeLeft.hours}</div>
              <p className="text-xs font-medium text-purple-700">Hours</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="text-xl font-bold text-purple-900">{timeLeft.minutes}</div>
              <p className="text-xs font-medium text-purple-700">Min</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="text-xl font-bold text-purple-900">{timeLeft.seconds}</div>
              <p className="text-xs font-medium text-purple-700">Sec</p>
            </div>
          </div>
        </div>
        
        {/* Draw Date */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <Calendar className="w-4 h-4 text-blue-600" />
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800">Draw Date</p>
            <p className="text-lg font-bold text-blue-900">
              {(nextDrawDate || drawDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })}
            </p>
          </div>
        </div>

        {/* Your Participation Status */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
          <Trophy className="w-4 h-4 text-orange-600" />
          <div className="text-center">
            <p className="text-sm font-medium text-orange-800">Your Entries</p>
            <p className="text-lg font-bold text-orange-900">{userTickets} tickets</p>
          </div>
        </div>
        
        {/* Status Message */}
        <div className="text-xs text-purple-600 text-center">
          {nextDrawDate 
            ? "A new lottery draw is scheduled. Keep earning tickets!"
            : userTickets === 0 
              ? "🎯 Earn tickets to join this draw!" 
              : userTickets === 1
                ? "🍀 You're entered! Good luck!"
                : `🚀 Great chances with ${userTickets} tickets!`}
        </div>
      </CardContent>
    </Card>
  );
}; 