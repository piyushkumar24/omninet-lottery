"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PartyPopper, Trophy, X, Ticket, ExternalLink } from "lucide-react";

interface WinnerBannerProps {
  prizeAmount: number;
  drawDate: Date;
  couponCode: string | null;
}

export function WinnerBanner({ prizeAmount, drawDate, couponCode }: WinnerBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-300 shadow-xl mb-6 relative overflow-hidden">
      {/* Background confetti effect */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-100 rounded-full opacity-60" />
      <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-amber-100 rounded-full opacity-60" />
      
      {/* Close button */}
      <button 
        onClick={() => setDismissed(true)} 
        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-amber-700 hover:text-amber-800 transition-colors z-10"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="p-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 bg-gradient-to-br from-yellow-200 to-amber-300 p-4 rounded-full">
            <Trophy className="h-14 w-14 text-yellow-700" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <PartyPopper className="h-5 w-5 text-amber-600" />
              <h2 className="text-2xl font-bold text-amber-800">Congratulations! You Won!</h2>
              <PartyPopper className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-amber-700">
              You&apos;ve won the 0mninet lottery draw that took place on {formatDate(drawDate, 'full')}!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-3">
              <div className="bg-white/80 rounded-lg px-4 py-3 border border-amber-200">
                <p className="text-sm text-amber-700">Prize Amount</p>
                <p className="text-2xl font-bold text-green-600">${prizeAmount.toFixed(2)}</p>
              </div>
              
              {couponCode && (
                <div className="bg-white/80 rounded-lg px-4 py-3 border border-amber-200 flex-1">
                  <p className="text-sm text-amber-700">Your Amazon Gift Card Code</p>
                  <p className="text-xl font-mono font-bold text-blue-600 tracking-wider">{couponCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Use this code to redeem your prize on Amazon</p>
                </div>
              )}
            </div>
            
            {couponCode ? (
              <div className="mt-4">
                <a 
                  href="https://www.amazon.com/gc/redeem" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-amber-800 hover:text-amber-900 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Redeem your gift card on Amazon
                </a>
              </div>
            ) : (
              <p className="text-sm text-amber-700 mt-4">
                Your prize is being processed. The admin will email you shortly with your coupon code.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
} 