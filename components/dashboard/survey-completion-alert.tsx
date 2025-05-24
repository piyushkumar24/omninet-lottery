"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  X, 
  Ticket, 
  Sparkles,
  Trophy,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";

export const SurveyCompletionAlert = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    // Show success toast
    toast.success("🎉 Survey completed successfully! Your ticket has been added.", {
      duration: 5000,
      icon: "🎫",
    });

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`transition-all duration-300 ${
        fadeOut ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
      }`}
    >
      <Card className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 shadow-xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-green-300/20 to-transparent animate-pulse"></div>
        </div>
        
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Success Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-3 w-3 text-yellow-800" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-800 mb-2 flex items-center gap-2">
                  🎉 Survey Completed Successfully!
                  <Ticket className="h-5 w-5 text-green-600 animate-pulse" />
                </h3>
                
                <p className="text-green-700 mb-4 text-base leading-relaxed">
                  Congratulations! You&apos;ve successfully completed the survey and earned <span className="font-bold">1 lottery ticket</span>. 
                  Your ticket has been automatically added to your account and is ready for the next lottery draw.
                </p>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-green-800 font-semibold text-sm">Ticket Earned</p>
                        <p className="text-green-700 text-xs">Added to your account</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-blue-800 font-semibold text-sm">Ready for Draw</p>
                        <p className="text-blue-700 text-xs">Next draw: Thursday</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium mb-1">🚀 What&apos;s Next?</p>
                  <p className="text-blue-700 text-xs">
                    Complete more surveys to earn additional tickets, or participate in the lottery draw with your current tickets to increase your chances of winning!
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex-shrink-0 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress indicator (auto-hide timer) */}
        <div className="absolute bottom-0 left-0 h-1 bg-green-500 animate-pulse" style={{
          animation: 'shrink 10s linear forwards'
        }}>
        </div>
      </Card>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}; 