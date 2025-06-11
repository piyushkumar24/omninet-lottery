"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Share, User, Check, Info, Users, Gift, TrendingUp, ExternalLink, Mail, Ticket } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Referral {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  hasCompletedSurvey: boolean;
  surveyCompletedAt: string | null;
}

interface ReferralStats {
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  referralTicketsEarned: number;
}

interface ReferralData {
  availableTickets: number;
  totalTicketsEarned: number;
  referralStats: ReferralStats;
  referrals: Referral[];
}

export default function ReferralPage() {
  const { data: session } = useSession();
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${baseUrl}/?ref=${referralCode}` : 'Loading...';

  useEffect(() => {
    if (session?.user?.id) {
      fetchReferralData();
      fetchReferralCode();
    }
  }, [session?.user?.id]);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/referrals/stats', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReferralData(data.data);
      } else {
        toast.error(data.message || "Failed to load referral data");
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferralCode = async () => {
    try {
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
    }
  };

  const copyToClipboard = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsCopied(true);
      toast.success("✅ Referral link copied", {
        duration: 3000,
        icon: "📋",
        style: {
          border: '2px solid #22c55e',
          padding: '16px',
          fontSize: '14px',
        },
      });
      
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("❌ Something went wrong. Please try again later.", {
        duration: 4000,
        icon: "❌",
        style: {
          border: '2px solid #ef4444',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }
  };

  const shareViaEmail = () => {
    if (!referralCode) return;
    
    const subject = encodeURIComponent("Join me in the 0mninet Lottery");
    const body = encodeURIComponent(`Hey, I thought you might be interested in the 0mninet lottery platform. You can win Amazon gift cards by completing surveys while supporting digital inclusion initiatives worldwide. Use my referral link to sign up: ${referralLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (isLoading || !referralData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  const { availableTickets, referralStats, referrals } = referralData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800">Invite Friends</h1>
              <p className="text-sm md:text-base text-slate-600 mt-1">Share your referral link and earn tickets together</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="bg-green-100 p-2 md:p-3 rounded-xl mr-3 md:mr-4 shadow-md">
                  <Ticket className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-green-800">Referral Tickets</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2 text-green-900">{referralStats.referralTicketsEarned}</p>
              <p className="text-xs md:text-sm text-green-700 mt-1 md:mt-2 flex items-center">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Tickets earned from referrals
              </p>
              <p className="text-xs text-green-600 mt-1">
                {availableTickets > 0 && `${availableTickets} tickets available for the next draw`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="bg-blue-100 p-2 md:p-3 rounded-xl mr-3 md:mr-4 shadow-md">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-blue-800">Total Referrals</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2 text-blue-900">{referralStats.totalReferrals}</p>
              <p className="text-xs md:text-sm text-blue-700 mt-1 md:mt-2 flex items-center">
                <User className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Friends who signed up
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-xl sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center mb-3 md:mb-4">
                <div className="bg-amber-100 p-2 md:p-3 rounded-xl mr-3 md:mr-4 shadow-md">
                  <Gift className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-amber-800">Qualified Referrals</h3>
              </div>
              <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2 text-amber-900">{referralStats.qualifiedReferrals}</p>
              <p className="text-xs md:text-sm text-amber-700 mt-1 md:mt-2 flex items-center">
                <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Completed their first survey
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Referral Link Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 py-4 px-4 md:py-6 md:px-6">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Share className="h-5 w-5 md:h-6 md:w-6" />
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-blue-700 text-xs md:text-sm">
              Share this link with friends. When they sign up and complete their first survey, you&apos;ll both earn a ticket for the lottery!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-xs md:text-sm bg-slate-50 border-2 border-slate-200 focus:border-blue-500"
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
                  className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 text-blue-700 font-medium text-xs md:text-sm"
                >
                  <Mail className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Share via Email
                  <ExternalLink className="h-3 w-3 md:h-4 md:w-4 ml-2" />
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 mt-4">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-2 text-sm md:text-base">
                <Gift className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                How to Earn Referral Tickets
              </h3>
              <ol className="text-xs md:text-sm text-blue-700 space-y-1 md:space-y-2 ml-5 md:ml-6 list-decimal">
                <li>Share your unique referral link with friends</li>
                <li>When they sign up using your link, they become your referral</li>
                <li>When your referral completes their first survey, you earn a referral ticket</li>
                <li>Your ticket is automatically entered into the current lottery draw</li>
                <li>Track your referrals and earned tickets in this dashboard</li>
              </ol>
            </div>
          </CardContent>
        </Card>
        
        {/* Referrals List */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 py-4 px-4 md:py-6 md:px-6">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Gift className="h-5 w-5 md:h-6 md:w-6" />
              Your Referrals & Tickets
            </CardTitle>
            <CardDescription className="text-green-700 text-xs md:text-sm">
              Track the friends you&apos;ve referred and see which ones have earned you tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {referrals.length > 0 && (
              <div className="bg-white rounded-xl p-3 md:p-6 border border-slate-200 shadow-sm">
                <h4 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Your Referrals ({referrals.length})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm md:text-base">{referral.name}</p>
                            <p className="text-xs md:text-sm text-slate-600">{referral.email}</p>
                            <p className="text-xs text-slate-500">
                              Joined {formatDate(new Date(referral.joinedAt), 'dateOnly')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        {referral.hasCompletedSurvey ? (
                          <>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-1 text-xs md:text-sm">
                              <Check className="h-3 w-3 mr-1" />
                              Completed Survey
                            </Badge>
                            <p className="text-xs text-green-600 mt-1 md:mt-2">
                              ✅ Qualified Referral #{referrals.filter(r => r.hasCompletedSurvey).findIndex(r => r.id === referral.id) + 1}
                            </p>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mb-1 text-xs md:text-sm">
                              <Info className="h-3 w-3 mr-1" />
                              Pending Survey
                            </Badge>
                            <p className="text-xs text-amber-600 mt-1 md:mt-2">
                              Needs to complete survey to earn you a ticket
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {referralStats.pendingReferrals > 0 && (
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-start md:items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <Info className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm md:text-base">
                      {referralStats.pendingReferrals} friend{referralStats.pendingReferrals === 1 ? '' : 's'} haven&apos;t completed surveys yet
                    </p>
                    <p className="text-xs md:text-sm text-amber-700 mt-1">
                      Once they complete their first survey, you&apos;ll automatically earn referral tickets!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {referrals.length === 0 && (
              <div className="text-center py-8 md:py-16">
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 md:h-10 md:w-10 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 md:mb-3">No Referrals Yet</h3>
                <p className="text-slate-600 text-base md:text-lg mb-4">
                  You haven&apos;t referred anyone yet. Start sharing your link to earn tickets!
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 md:p-6 max-w-md mx-auto">
                  <p className="text-blue-800 font-medium mb-2">🚀 Get Started</p>
                  <p className="text-blue-700 text-xs md:text-sm">
                    Copy your referral link above and share it with friends on social media, 
                    email, or messaging apps. Every friend who completes their first survey earns you a lottery ticket!
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