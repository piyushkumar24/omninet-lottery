"use client";

import { Clock } from "lucide-react";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h3 className="text-sm font-medium">Next Draw</h3>
        <Clock className="w-4 h-4 text-indigo-600" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.days}</div>
            <p className="text-xs text-slate-500">Days</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.hours}</div>
            <p className="text-xs text-slate-500">Hours</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.minutes}</div>
            <p className="text-xs text-slate-500">Minutes</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{timeLeft.seconds}</div>
            <p className="text-xs text-slate-500">Seconds</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          You have {tickets} tickets for the next draw
        </p>
      </CardContent>
    </Card>
  );
}; 