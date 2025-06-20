"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Ticket, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LotteryResetCardProps {
  activeDraw: any;
  totalTicketsInSystem: number;
  totalParticipants: number;
}

export const LotteryResetCard = ({ 
  activeDraw, 
  totalTicketsInSystem, 
  totalParticipants 
}: LotteryResetCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resetType, setResetType] = useState<'draw' | 'tickets'>('draw');
  
  const handleReset = async () => {
    if (!activeDraw) return;
    
    setIsLoading(true);
    
    try {
      let endpoint = '/api/admin/reset-lottery';
      let body = resetType === 'draw' ? { drawId: activeDraw.id } : {};
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(resetType === 'draw' 
          ? `Lottery reset successful! Reset tickets for ${data.data.usersReset} users.`
          : `Successfully reset all active tickets for ${data.data.usersReset} users.`
        );
        
        // Force a hard refresh to ensure all data is updated
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to reset lottery');
      }
    } catch (error) {
      console.error('Error resetting lottery:', error);
      toast.error('Failed to reset lottery');
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };
  
  const openConfirmDialog = (type: 'draw' | 'tickets') => {
    setResetType(type);
    setShowConfirmDialog(true);
  };

  if (!activeDraw) return null;

  return (
    <>
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Lottery Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-amber-700 mb-2">
                There are currently <strong>{totalTicketsInSystem}</strong> active tickets in the system
                from <strong>{totalParticipants}</strong> users.
              </p>
              <p className="text-sm text-amber-600">
                Use these options to manage the lottery tickets and draws.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => openConfirmDialog('tickets')}
                disabled={isLoading || totalTicketsInSystem === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Ticket className="h-4 w-4 mr-2" />
                Reset All Active Tickets
              </Button>
              
              <Button
                onClick={() => openConfirmDialog('draw')}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reset Lottery Draw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {resetType === 'draw' ? 'Confirm Lottery Reset' : 'Confirm Ticket Reset'}
            </DialogTitle>
            <DialogDescription className="text-amber-700 pt-2">
              {resetType === 'draw' ? (
                <>
                  This will reset the current lottery draw and clear all users' active tickets.
                  This action is typically performed after completing a draw and selecting a winner.
                </>
              ) : (
                <>
                  This will clear all users' active tickets without completing the current draw.
                  Use this option to manually reset all tickets between draws.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 my-2">
            <p className="text-amber-800 font-medium">Warning:</p>
            <p className="text-sm text-amber-700">
              {resetType === 'draw' 
                ? 'This action will mark the current draw as completed and reset all tickets.' 
                : 'This action will reset all users\' active tickets to zero. Users will need to earn new tickets for the current draw.'}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className={resetType === 'draw' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {resetType === 'draw' ? 'Reset Lottery Draw' : 'Reset All Tickets'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 