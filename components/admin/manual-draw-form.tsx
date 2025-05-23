"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { toast } from "react-hot-toast";

interface ManualDrawFormProps {
  canRunDraw: boolean;
  participantCount: number;
  totalTicketsInDraw: number;
}

export const ManualDrawForm = ({ 
  canRunDraw, 
  participantCount, 
  totalTicketsInDraw 
}: ManualDrawFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!canRunDraw) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/draws/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`🎉 Draw completed! Winner: ${data.winner.name}`);
        router.refresh();
      } else {
        toast.error(data.message || "Failed to run draw");
      }
    } catch (error) {
      console.error("Error running draw:", error);
      toast.error("An error occurred while running the draw");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-lg">Ready to Run Draw?</h3>
        {canRunDraw ? (
          <p className="text-sm text-green-600 mt-1">
            ✅ {participantCount} user{participantCount !== 1 ? 's have' : ' has'} participated with {totalTicketsInDraw} ticket{totalTicketsInDraw !== 1 ? 's' : ''} total
          </p>
        ) : (
          <p className="text-sm text-red-600 mt-1">
            ❌ No users have participated yet. Minimum 1 participant required.
          </p>
        )}
      </div>
      <Button 
        onClick={handleSubmit}
        disabled={!canRunDraw || isLoading}
        className={`flex items-center ${
          canRunDraw 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <Gift className="mr-2 h-4 w-4" />
        {isLoading 
          ? 'Running Draw...' 
          : canRunDraw 
            ? 'Run Draw Now' 
            : 'Waiting for Participants'
        }
      </Button>
    </div>
  );
}; 