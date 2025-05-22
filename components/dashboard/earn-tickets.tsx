"use client";

import { useState } from "react";
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
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        if (source === "SOCIAL") {
          setSocialCompleted(true);
        }
        router.refresh();
      } else {
        toast.error(data.message);
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

  const handleReferralClick = () => {
    // In a real implementation, this would copy a referral link
    // or show a referral modal
    navigator.clipboard.writeText(`https://sociallottery.com/ref/${userId}`);
    toast.success("Referral link copied to clipboard!");
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
                disabled={loading === "REFERRAL"}
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