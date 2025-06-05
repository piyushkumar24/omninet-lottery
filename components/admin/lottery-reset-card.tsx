"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "react-hot-toast";

interface LotteryResetCardProps {
  activeDraw?: {
    id: string;
    totalTickets: number;
  } | null;
  totalTicketsInSystem: number;
  totalParticipants: number;
}

export const LotteryResetCard = ({ 
  activeDraw, 
  totalTicketsInSystem, 
  totalParticipants 
}: LotteryResetCardProps) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleLotteryReset = async () => {
    if (!activeDraw) return;

    try {
      setIsResetting(true);
      
      const response = await fetch('/api/admin/reset-lottery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drawId: activeDraw.id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Lottery reset successful! Reset tickets for ${data.data.usersReset} users.`);
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to reset lottery');
      }
    } catch (error) {
      console.error('Error resetting lottery:', error);
      toast.error('Failed to reset lottery');
    } finally {
      setIsResetting(false);
    }
  };

  // Only show if there's an active draw with participants
  if (!activeDraw || totalTicketsInSystem === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Lottery Reset Controls
        </CardTitle>
        <CardDescription className="text-red-700">
          Use this after announcing lottery results to reset all available tickets to 0 and prepare for the next lottery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-white p-4 rounded-lg border border-red-200 mb-4">
          <h4 className="font-semibold text-red-800 mb-2">Current Status:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• {totalParticipants} users have tickets in the current lottery</li>
            <li>• {totalTicketsInSystem} total available tickets will be reset to 0</li>
            <li>• Users&apos; lifetime earned tickets will be preserved</li>
            <li>• Draw will be marked as COMPLETED</li>
          </ul>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to reset the lottery? This will:\n\n• Reset ${totalTicketsInSystem} available tickets to 0\n• Mark the current draw as COMPLETED\n• Prepare for the next lottery\n\nThis action cannot be undone.`)) {
                handleLotteryReset();
              }
            }}
            disabled={isResetting}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {isResetting ? 'Resetting...' : 'Reset Lottery After Results'}
          </button>
          
          <div className="text-sm text-red-600 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Only use this AFTER announcing the lottery winner
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 