"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share, User, Check, Info } from "lucide-react";

export default function ReferPage() {
  const { data: session } = useSession();
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl}/?ref=${referralCode}`;

  useEffect(() => {
    if (session?.user?.id) {
      // Generate or fetch referral code
      fetchReferralCode();
      // Fetch referrals
      fetchReferrals();
    }
  }, [session?.user?.id]);

  const fetchReferralCode = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/referrals/code');
      const data = await response.json();
      
      if (data.success) {
        setReferralCode(data.referralCode);
      } else {
        toast.error("Failed to get referral code");
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/referrals');
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast.success("Referral link copied to clipboard!");
    
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("Join me in the Social Lottery");
    const body = encodeURIComponent(`Hey, I thought you might be interested in this social lottery platform. You can win Amazon gift cards by completing surveys and other social activities. Use my referral link to sign up: ${referralLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Refer Friends</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends. When they sign up, you'll both earn a ticket!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="font-mono text-sm"
              disabled={isLoading || !referralCode}
            />
            <Button 
              onClick={copyToClipboard} 
              disabled={isLoading || !referralCode}
              variant={isCopied ? "outline" : "default"}
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="flex justify-center space-x-4 mt-6">
            <Button
              onClick={shareViaEmail}
              disabled={isLoading || !referralCode}
              variant="outline"
              className="flex-1"
            >
              <Share className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm flex items-start mt-4">
            <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">How it works</p>
              <p className="mt-1">When someone signs up using your referral link, you'll automatically receive a ticket once they earn their first ticket through a survey.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>
            Track the friends you've referred and the tickets you've earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <div className="space-y-4 divide-y">
              {referrals.map((referral) => (
                <div key={referral.id} className="pt-4 first:pt-0">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 rounded-full p-2 mr-3">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{referral.name || "Anonymous User"}</p>
                      <p className="text-sm text-slate-500">Joined {new Date(referral.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                      +1 Ticket
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <User className="h-10 w-10 mx-auto mb-3 text-slate-400" />
              <p>You haven't referred anyone yet</p>
              <p className="mt-1 text-sm">Share your referral link to start earning tickets!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 