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
  Clock,
  PartyPopper,
  Coins
} from "lucide-react";
import { toast } from "react-hot-toast";

export const SurveyCompletionAlert = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Auto-hide after 15 seconds (extended for better visibility)
    const timer = setTimeout(() => {
      handleClose();
    }, 15000);

    // Show multiple success notifications for clarity
    toast.success("🎉 Ticket added to your account!", {
      duration: 6000,
      icon: "🎫",
      style: {
        border: '2px solid #3b82f6',
        padding: '16px',
        fontSize: '14px',
      },
    });

    // Secondary confirmation toast
    setTimeout(() => {
      toast("✅ 1 lottery ticket has been added to your account!", {
        duration: 8000,
        icon: "🎟️",
        style: {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          border: '2px solid #3b82f6',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }, 2000);

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
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-4 border-blue-300 shadow-2xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-300/30 to-transparent animate-pulse"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-transparent via-indigo-300/30 to-transparent animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Success Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                    <CheckCircle2 className="h-9 w-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <PartyPopper className="h-4 w-4 text-yellow-800" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-blue-800 mb-3 flex items-center gap-3">
                  🎉 Congratulations! Survey Completed!
                  <Ticket className="h-7 w-7 text-blue-600 animate-pulse" />
                </h3>
                
                <div className="bg-white/80 rounded-xl p-4 mb-4 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Coins className="h-6 w-6 text-blue-600" />
                    <p className="text-xl font-bold text-blue-800">
                      ✅ 1 Lottery Ticket Earned Successfully!
                    </p>
                  </div>
                  <p className="text-blue-700 text-base leading-relaxed">
                    Your survey has been completed and verified by CPX Research. Your lottery ticket has been 
                    <span className="font-bold text-blue-800"> automatically added to your account</span> and is 
                    ready for the next lottery draw.
                  </p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-300 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-blue-800 font-bold text-base">Ticket Status</p>
                        <p className="text-blue-700 font-semibold">✅ Successfully Added</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-300 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-blue-800 font-bold text-base">Draw Status</p>
                        <p className="text-blue-700 font-semibold">Ready for Thursday Draw</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
                  <p className="text-blue-800 text-base font-bold mb-2">🚀 What&apos;s Next?</p>
                  <div className="space-y-2">
                    <p className="text-blue-700 text-sm">
                      • <strong>Participate in Lottery:</strong> Use your tickets to enter the Thursday draw
                    </p>
                    <p className="text-blue-700 text-sm">
                      • <strong>Earn More Tickets:</strong> Complete additional surveys to increase your chances
                    </p>
                    <p className="text-blue-700 text-sm">
                      • <strong>Invite Friends:</strong> Share your referral link to earn bonus tickets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex-shrink-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-2 h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress indicator (auto-hide timer) */}
        <div className="absolute bottom-0 left-0 h-2 bg-blue-600 animate-pulse" style={{
          animation: 'shrink 15s linear forwards'
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