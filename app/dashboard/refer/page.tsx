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
  name: string | null;
  email: string | null;
  createdAt: string;
  hasCompletedSurvey: boolean;
  surveyCompletedAt: string | null;
}

interface UserStatus {
  success: boolean;
  referralTicketCount: number;
  referralStats: {
    totalReferrals: number;
    qualifiedReferrals: number;
    pendingReferrals: number;
  };
  referrals: Referral[];
}

export default function ReferPage() {
  const { data: session } = useSession();
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${baseUrl}/?ref=${referralCode}` : 'Loading...';

  useEffect(() => {
    if (session?.user?.id) {
      // Generate or fetch referral code
      fetchReferralCode();
      // Fetch user status which includes referral data
      fetchUserStatus();
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

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/user/status');
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUserStatus(data);
      } else {
        console.error("API Error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
      toast.error("Failed to load referral data. Please refresh the page.");
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

  const referrals = userStatus?.referrals || [];
  const referralTicketCount = userStatus?.referralTicketCount || 0;
  const totalReferrals = userStatus?.referralStats?.totalReferrals || 0;
  const qualifiedReferrals = userStatus?.referralStats?.qualifiedReferrals || 0;
  const pendingReferrals = userStatus?.referralStats?.pendingReferrals || 0;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-xl mr-4 shadow-md">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Referral Tickets</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-green-900">{referralTicketCount}</p>
              <p className="text-sm text-green-700 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Tickets earned from referrals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-xl mr-4 shadow-md">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-800">Total Referrals</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-blue-900">{totalReferrals}</p>
              <p className="text-sm text-blue-700 mt-2 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Friends who signed up
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-3 rounded-xl mr-4 shadow-md">
                  <Gift className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-amber-800">Qualified Referrals</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-amber-900">{qualifiedReferrals}</p>
              <p className="text-sm text-amber-700 mt-2 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                Completed their first survey
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
              Share this link with friends. When they sign up and complete their first survey, you&apos;ll both earn a ticket!
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
              Your Referrals & Tickets
            </CardTitle>
            <CardDescription className="text-green-700">
              Track the friends you&apos;ve referred and see which ones have earned you tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {referrals.length > 0 ? (
              <div className="space-y-4">
                {referrals.map((referral, index) => (
                  <div 
                    key={referral.id} 
                    className={`group p-6 rounded-xl hover:shadow-lg transition-all duration-300 border-2 ${
                      referral.hasCompletedSurvey 
                        ? 'bg-gradient-to-r from-white to-green-50 border-green-200' 
                        : 'bg-gradient-to-r from-white to-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl group-hover:scale-105 transition-transform ${
                          referral.hasCompletedSurvey 
                            ? 'bg-green-100 group-hover:bg-green-200' 
                            : 'bg-amber-100 group-hover:bg-amber-200'
                        }`}>
                          <User className={`h-6 w-6 ${
                            referral.hasCompletedSurvey ? 'text-green-600' : 'text-amber-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            {referral.name || "Anonymous User"}
                          </h3>
                          <p className="text-sm text-slate-600">{referral.email}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Joined {formatDate(new Date(referral.createdAt), 'short')}
                            </p>
                            {referral.hasCompletedSurvey && referral.surveyCompletedAt && (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                Survey completed {formatDate(new Date(referral.surveyCompletedAt), 'short')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {referral.hasCompletedSurvey ? (
                          <>
                            <Badge className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 text-sm font-semibold">
                              <Ticket className="h-4 w-4 mr-1" />
                              +1 Ticket Earned
                            </Badge>
                            <p className="text-xs text-green-600 mt-2">
                              ✅ Qualified Referral #{qualifiedReferrals - referrals.filter((r, i) => i <= index && r.hasCompletedSurvey).length + referrals.filter((r, i) => i <= index && r.hasCompletedSurvey).length}
                            </p>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border border-amber-300 px-4 py-2 text-sm font-semibold">
                              <Info className="h-4 w-4 mr-1" />
                              Pending Survey
                            </Badge>
                            <p className="text-xs text-amber-600 mt-2">
                              ⏳ No ticket yet
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {!referral.hasCompletedSurvey && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                          💡 <strong>Almost there!</strong> Once {referral.name || "this friend"} completes their first survey, you&apos;ll automatically earn a referral ticket.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="h-10 w-10 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No Referrals Yet</h3>
                <p className="text-slate-600 text-lg mb-4">
                  You haven&apos;t referred anyone yet. Start sharing your link to earn tickets!
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-blue-800 font-medium mb-2">🚀 Get Started</p>
                  <p className="text-blue-700 text-sm">
                    Copy your referral link above and share it with friends on social media, 
                    email, or messaging apps. Every friend who completes their first survey earns you a lottery ticket!
                  </p>
                </div>
              </div>
            )}
            
            {pendingReferrals > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Info className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">
                      {pendingReferrals} friend{pendingReferrals === 1 ? '' : 's'} haven&apos;t completed surveys yet
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Encourage them to complete their first survey to earn more tickets!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 