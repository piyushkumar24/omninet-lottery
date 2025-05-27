"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PartyPopper, Trophy, X, Ticket, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateWinnerStatus } from "@/actions/user-status";
import { useRouter } from "next/navigation";

interface WinnerBannerProps {
  prizeAmount: number;
  drawDate: Date;
  couponCode: string | null;
  winnerId: string;
}

export function WinnerBanner({ prizeAmount, drawDate, couponCode, winnerId }: WinnerBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Memoize the dismiss handler to prevent unnecessary re-renders
  const handleDismiss = useCallback(async () => {
    if (isProcessing) return; // Prevent multiple clicks
    
    try {
      console.log("Dismissing winner banner...");
      setIsProcessing(true);
      
      // Force immediate UI update first
      setDismissed(true);
      
      // Handle localStorage
      const storageKey = 'dismissedWinners';
      const storedData = localStorage.getItem(storageKey);
      const dismissedWinners = storedData ? JSON.parse(storedData) : {};
      
      // Update the dismissedWinners object
      dismissedWinners[winnerId] = true;
      
      // Store back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(dismissedWinners));
      
      // Update the user's hasWon status on the server
      const result = await updateWinnerStatus(true);
      
      if (result.error) {
        console.error("Error updating winner status:", result.error);
      }
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('winnerBannerDismissed'));
      
      // Refresh the page to update the UI
      router.refresh();
      
      // Show a toast confirmation
      toast.success("Congratulations on your win! Your tickets have been reset for the next lottery.", {
        duration: 4000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error in handleDismiss:", error);
      // UI is already updated via setDismissed(true) at the beginning
    } finally {
      setIsProcessing(false);
    }
  }, [winnerId, router, isProcessing]);

  // Check if the banner was previously dismissed
  useEffect(() => {
    try {
      const storageKey = 'dismissedWinners';
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return;
      
      const dismissedWinners = JSON.parse(storedData);
      if (dismissedWinners && dismissedWinners[winnerId]) {
        console.log("Banner was previously dismissed");
        setDismissed(true);
        
        // Also update the server state if needed
        updateWinnerStatus(true).catch(err => 
          console.error("Error updating server winner status:", err)
        );
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
  }, [winnerId]);

  // Add an escape key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [handleDismiss]);

  if (dismissed) return null;

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-300 shadow-xl mb-6 relative overflow-hidden">
      {/* Background confetti effect */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-100 rounded-full opacity-60" />
      <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-amber-100 rounded-full opacity-60" />
      
      {/* Enhanced close button with better visibility */}
      <button 
        onClick={handleDismiss} 
        className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 text-amber-700 hover:text-amber-900 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Close winner announcement"
        type="button"
        disabled={isProcessing}
      >
        <X className="h-5 w-5" />
      </button>
      
      {/* Additional dismiss button for mobile */}
      <div className="w-full flex justify-end mt-2 mb-0 px-4 md:hidden">
        <Button 
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
          disabled={isProcessing}
        >
          Dismiss
        </Button>
      </div>
      
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
            
            {/* Explicit dismiss button at the bottom */}
            <div className="mt-6 hidden md:block">
              <Button 
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
                disabled={isProcessing}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Dismiss Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 