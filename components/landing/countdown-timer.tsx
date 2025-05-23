"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: Date;
  theme?: "light" | "dark";
}

export const CountdownTimer = ({ targetDate, theme = "light" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Determine styling based on theme
  const bgColorClass = theme === "dark" 
    ? "bg-indigo-800/80 border border-indigo-700" 
    : "bg-indigo-600";
  const labelColorClass = theme === "dark" 
    ? "text-indigo-200" 
    : "text-slate-600";

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <div className="flex flex-col items-center">
          <div className={`${bgColorClass} text-white rounded-lg w-full py-4 md:py-6 text-center`}>
            <span className="text-2xl md:text-4xl font-bold">{timeLeft.days}</span>
          </div>
          <span className={`mt-2 text-xs md:text-sm ${labelColorClass}`}>Days</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`${bgColorClass} text-white rounded-lg w-full py-4 md:py-6 text-center`}>
            <span className="text-2xl md:text-4xl font-bold">{timeLeft.hours}</span>
          </div>
          <span className={`mt-2 text-xs md:text-sm ${labelColorClass}`}>Hours</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`${bgColorClass} text-white rounded-lg w-full py-4 md:py-6 text-center`}>
            <span className="text-2xl md:text-4xl font-bold">{timeLeft.minutes}</span>
          </div>
          <span className={`mt-2 text-xs md:text-sm ${labelColorClass}`}>Minutes</span>
        </div>
        <div className="flex flex-col items-center">
          <div className={`${bgColorClass} text-white rounded-lg w-full py-4 md:py-6 text-center`}>
            <span className="text-2xl md:text-4xl font-bold">{timeLeft.seconds}</span>
          </div>
          <span className={`mt-2 text-xs md:text-sm ${labelColorClass}`}>Seconds</span>
        </div>
      </div>
    </div>
  );
}; 