"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, ClipboardList, Share, CheckCircle } from "lucide-react";

interface EarnTicketsProps {
  userId: string;
  hasSurveyTicket: boolean;
}

export const EarnTickets = ({ userId, hasSurveyTicket }: EarnTicketsProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [socialCompleted, setSocialCompleted] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);

  useEffect(() => {
    // Fetch the referral code when component mounts
    const fetchReferralCode = async () => {
      try {
        const response = await fetch('/api/referrals/code');
        
        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setReferralCode(data.referralCode);
        }
      } catch (error) {
        console.error("Error fetching referral code:", error);
      }
    };

    fetchReferralCode();
  }, []);

  const earnTicket = async (source: string) => {
    try {
      setLoading(source);
      
      const response = await fetch("/api/tickets/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
        }),
      });
      
      if (!response.ok) {
        console.error("API error:", response.status, response.statusText);
        toast.error(`Failed to earn ticket: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        if (source === "SOCIAL") {
          setSocialCompleted(true);
        }
        router.refresh();
      } else {
        toast.error(data.message || "Failed to earn ticket");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleSurveyClick = () => {
    // In a real implementation, this would redirect to a survey provider
    // or open a survey modal
    toast.success("Survey completed! Ticket earned.");
    earnTicket("SURVEY");
  };

  const handleSocialClick = () => {
    // In a real implementation, this would open social sharing options
    // or redirect to social media
    earnTicket("SOCIAL");
  };

  const handleReferralClick = async () => {
    setIsLoadingReferral(true);
    try {
      // If we don't have the referral code yet, fetch it
      if (!referralCode) {
        const response = await fetch('/api/referrals/code');
        
        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          toast.error("Failed to get referral code");
          setIsLoadingReferral(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setReferralCode(data.referralCode);
        } else {
          toast.error("Failed to get referral code");
          setIsLoadingReferral(false);
          return;
        }
      }
      
      // Get the base URL and create the referral link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const referralLink = `${baseUrl}/?ref=${referralCode}`;
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(referralLink);
        toast.success("Referral link copied to clipboard!");
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
        toast.error("Failed to copy to clipboard");
      }
    } catch (error) {
      console.error("Error copying referral link:", error);
      toast.error("Failed to copy referral link");
    } finally {
      setIsLoadingReferral(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Earn More Tickets</CardTitle>
        <CardDescription>Complete tasks to increase your chances of winning</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Complete Survey</h3>
                    <p className="text-sm text-slate-500">Answer questions to earn a ticket</p>
                  </div>
                </div>
                {hasSurveyTicket ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : null}
              </div>
              <Button 
                onClick={handleSurveyClick}
                disabled={loading === "SURVEY" || hasSurveyTicket}
                className="w-full"
                variant={hasSurveyTicket ? "outline" : "default"}
              >
                {hasSurveyTicket ? "Completed" : "Start Survey"}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <Share className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Social Share</h3>
                    <p className="text-sm text-slate-500">Share on social media</p>
                  </div>
                </div>
                {socialCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : null}
              </div>
              <Button 
                onClick={handleSocialClick}
                disabled={loading === "SOCIAL" || socialCompleted}
                className="w-full"
                variant={socialCompleted ? "outline" : "default"}
              >
                {socialCompleted ? "Completed" : "Share Now"}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <Ticket className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Refer Friends</h3>
                  <p className="text-sm text-slate-500">Earn a ticket for each referral</p>
                </div>
              </div>
              <Button 
                onClick={handleReferralClick}
                disabled={loading === "REFERRAL" || isLoadingReferral}
                className="w-full"
              >
                Copy Referral Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}; 