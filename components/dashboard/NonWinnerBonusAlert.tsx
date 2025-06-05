"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Gift, Award, ExternalLink, Check } from "lucide-react";
import axios from "axios";

export const NonWinnerBonusAlert = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState<"unclaimed" | "processing" | "claimed" | "error" | null>(null);
  const [message, setMessage] = useState("");
  
  const token = searchParams.get("token");
  const isNonWinnerFlow = token && token.startsWith("nw_");
  
  useEffect(() => {
    if (isNonWinnerFlow) {
      verifyToken();
    }
  }, [isNonWinnerFlow, token]);
  
  const verifyToken = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tickets/non-winner-bonus?token=${token}`);
      
      if (response.data.success) {
        setClaimStatus("unclaimed");
      } else if (response.data.data?.alreadyClaimed) {
        setClaimStatus("claimed");
        setMessage("You've already claimed your bonus tickets.");
      } else {
        setClaimStatus("error");
        setMessage(response.data.message || "This bonus link is invalid or expired.");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      setClaimStatus("error");
      setMessage("Error verifying your bonus token. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const claimBonusTickets = async () => {
    try {
      setLoading(true);
      setClaimStatus("processing");
      
      const response = await axios.post("/api/tickets/non-winner-bonus", { token });
      
      if (response.data.success) {
        setClaimStatus("claimed");
        setMessage("You've received 2 bonus tickets for the next lottery draw!");
      } else {
        setClaimStatus("error");
        setMessage(response.data.message || "An error occurred while claiming your bonus tickets.");
      }
    } catch (error) {
      console.error("Error claiming bonus tickets:", error);
      setClaimStatus("error");
      setMessage("Something went wrong while claiming your bonus tickets.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isNonWinnerFlow || claimStatus === null) {
    return null;
  }
  
  if (claimStatus === "claimed") {
    return (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
        <div className="flex gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-green-800">Bonus tickets claimed!</h3>
            <p className="text-green-700">
              Your 2 bonus tickets have been successfully applied to the next lottery draw.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (claimStatus === "error") {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <div className="flex gap-3">
          <Gift className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-red-800">Invalid bonus link</h3>
            <p className="text-red-700">{message}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-md">
          <Gift className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Non-Winner Bonus Opportunity!
          </h3>
          
          <div className="mt-2">
            <p className="text-indigo-800">
              We're sorry you didn't win the last lottery, but we have a special bonus for you!
              Claim <strong>2 free bonus tickets</strong> for the next lottery draw.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={claimBonusTickets}
                disabled={loading || claimStatus === "processing"}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
              >
                {loading || claimStatus === "processing" ? (
                  "Processing..."
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Claim 2 Bonus Tickets
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/surveys')}
                className="bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Take a Survey Instead
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 