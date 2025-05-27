"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="grid grid-cols-4 gap-3 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="bg-gray-300 rounded-2xl w-full h-20 md:h-24"></div>
              <div className="bg-gray-300 rounded mt-3 h-4 w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days", color: "from-emerald-500 to-emerald-600" },
    { value: timeLeft.hours, label: "Hours", color: "from-blue-500 to-blue-600" },
    { value: timeLeft.minutes, label: "Minutes", color: "from-purple-500 to-purple-600" },
    { value: timeLeft.seconds, label: "Seconds", color: "from-orange-500 to-orange-600" },
  ];

  const containerBg = theme === "dark" 
    ? "bg-white/10 backdrop-blur-lg border border-white/20" 
    : "bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-xl";
    
  const textColor = theme === "dark" ? "text-white" : "text-gray-700";
  const labelColor = theme === "dark" ? "text-white/80" : "text-gray-600";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header with clock icon */}
      <div className="flex items-center justify-center mb-6">
        <div className={`${containerBg} rounded-2xl px-6 py-3 flex items-center gap-3`}>
          <Clock className={`h-6 w-6 ${textColor} animate-pulse`} />
          <span className={`text-lg font-semibold ${textColor}`}>
            Next Lottery Draw
          </span>
        </div>
      </div>

      {/* Main countdown display */}
      <div className={`${containerBg} rounded-3xl p-6 md:p-8`}>
        <div className="grid grid-cols-4 gap-3 md:gap-6">
          {timeUnits.map((unit, index) => (
            <div key={unit.label} className="flex flex-col items-center group">
              {/* Number display */}
              <div className={`
                bg-gradient-to-br ${unit.color} 
                text-white rounded-2xl w-20 
                py-2 md:py-4 text-center 
                shadow-lg shadow-black/10
                transition-all duration-300 
                group-hover:scale-105 group-hover:shadow-xl
                relative overflow-hidden
              `}>
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Number */}
                <span className="text-2xl md:text-4xl lg:text-5xl font-bold relative z-10 font-mono">
                  {unit.value.toString().padStart(2, '0')}
                </span>
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              </div>
              
              {/* Label */}
              <span className={`
                mt-3 text-sm md:text-base font-medium ${labelColor}
                transition-colors duration-300 group-hover:text-opacity-100
              `}>
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-6 pt-6 border-t border-gray-200/20">
          <div className="text-center">
            <p className={`text-sm ${labelColor} font-medium`}>
              Next draw: Thursday at 18:30 IST
            </p>
            <div className="flex items-center justify-center mt-2 gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-xs ${labelColor}`}>
                Weekly lottery - tickets reset after each draw
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 