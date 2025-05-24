"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Share, User, Check, Info, Users, Gift, TrendingUp, ExternalLink, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Referral {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
}

export default function ReferPage() {
  const { data: session } = useSession();
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${baseUrl}/?ref=${referralCode}` : 'Loading...';

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
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReferralCode(data.referralCode);
      } else {
        toast.error(data.message || "Failed to get referral code");
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
      toast.error("Failed to load referral code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/referrals');
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReferrals(data.referrals);
      } else {
        console.error("API Error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referrals. Please refresh the page.");
    }
  };

  const copyToClipboard = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      toast.success("Referral link copied to clipboard!");
      
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard.");
    }
  };

  const shareViaEmail = () => {
    if (!referralCode) return;
    
    const subject = encodeURIComponent("Join me in the Social Lottery");
    const body = encodeURIComponent(`Hey, I thought you might be interested in this social lottery platform. You can win Amazon gift cards by completing surveys and other social activities. Use my referral link to sign up: ${referralLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Invite Friends</h1>
              <p className="text-slate-600 mt-1">Share your referral link and earn tickets together</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-xl mr-4 shadow-md">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Tickets Earned</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-green-900">{referrals.length}</p>
              <p className="text-sm text-green-700 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                From successful referrals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-xl mr-4 shadow-md">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-800">Friends Referred</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-blue-900">{referrals.length}</p>
              <p className="text-sm text-blue-700 mt-2 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Total successful invitations
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Referral Link Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Share className="h-6 w-6" />
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-blue-700">
              Share this link with friends. When they sign up and complete their first survey, you'll both earn a ticket!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex space-x-3">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-sm bg-slate-50 border-2 border-slate-200 focus:border-blue-500"
                  disabled={isLoading || !referralCode}
                />
                <Button 
                  onClick={copyToClipboard} 
                  disabled={isLoading || !referralCode}
                  variant={isCopied ? "outline" : "default"}
                  className={`min-w-[120px] ${
                    isCopied 
                      ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={shareViaEmail}
                  disabled={isLoading || !referralCode}
                  variant="outline"
                  className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 text-blue-700 font-medium"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Share via Email
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
            
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-amber-800">
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2">💡 How Referrals Work</p>
                  <ul className="text-amber-800 text-sm space-y-1">
                    <li>• Share your unique referral link with friends</li>
                    <li>• When they sign up using your link, they get marked as your referral</li>
                    <li>• Once they complete their first survey, you automatically earn 1 ticket</li>
                    <li>• Your friend also gets their survey completion ticket</li>
                    <li>• Both of you can now participate in lottery draws!</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Referrals List */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Gift className="h-6 w-6" />
              Your Successful Referrals
            </CardTitle>
            <CardDescription className="text-green-700">
              Track the friends you've referred and the tickets you've earned
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {referrals.length > 0 ? (
              <div className="space-y-4">
                {referrals.map((referral, index) => (
                  <div 
                    key={referral.id} 
                    className="group p-6 bg-gradient-to-r from-white to-green-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            {referral.name || "Anonymous User"}
                          </h3>
                          <p className="text-sm text-slate-600">{referral.email}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <User className="h-4 w-4" />
                            Joined {formatDate(new Date(referral.createdAt), 'short')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 text-sm font-semibold">
                          +1 Ticket Earned
                        </Badge>
                        <p className="text-xs text-green-600 mt-2">
                          Referral #{index + 1}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No Referrals Yet</h3>
                <p className="text-slate-600 text-lg mb-4">
                  You haven't referred anyone yet. Start sharing your link to earn tickets!
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-blue-800 font-medium mb-2">🚀 Get Started</p>
                  <p className="text-blue-700 text-sm">
                    Copy your referral link above and share it with friends on social media, 
                    email, or messaging apps. Every successful referral earns you a lottery ticket!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 