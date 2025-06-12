"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  Users, 
  Share2, 
  CheckCircle, 
  Lock, 
  ExternalLink,
  Instagram,
  Facebook,
  Youtube,
  Copy,
  Check
} from "lucide-react";
import { CPXSurveyModal } from "@/components/survey/cpx-survey-modal";

interface EarnTicketsProps {
  userId: string;
  appliedTickets: number;
}

export const EarnTickets = ({ userId, appliedTickets }: EarnTicketsProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [socialMediaFollowed, setSocialMediaFollowed] = useState(false);
  const [hasSurveyTicket, setHasSurveyTicket] = useState(false);
  const [surveyAttempted, setSurveyAttempted] = useState(false);
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);

  useEffect(() => {
    checkUserStatus();
    fetchReferralCode();
  }, []);

  const checkUserStatus = async () => {
    try {
      const response = await fetch('/api/user/status');
      if (response.ok) {
        const data = await response.json();
        setSocialMediaFollowed(data.socialMediaFollowed || false);
        setHasSurveyTicket(data.hasSurveyTicket || false);
        
        const recentAttempt = localStorage.getItem('survey_attempted');
        if ((data.hasSurveyTicket) || 
            (recentAttempt && Date.now() - parseInt(recentAttempt) < 24 * 60 * 60 * 1000)) {
          setSurveyAttempted(true);
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await fetch('/api/referrals/code');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferralCode(data.referralCode);
        }
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
    }
  };

  const handleSurveyComplete = (success = true) => {
    setSurveyAttempted(true);
    localStorage.setItem('survey_attempted', Date.now().toString());
    
    if (success) {
      setHasSurveyTicket(true);
      
      toast.success("🎉 Ticket added to your account!", {
        duration: 5000,
        icon: "🎫",
        style: {
          border: '2px solid #22c55e',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }
    
    router.refresh();
    
    setTimeout(() => {
      router.refresh();
      checkUserStatus();
    }, 2000);
  };

  const handleReferralClick = async () => {
    if (!hasSurveyTicket) {
      toast.error("⚠ You must complete a survey before unlocking this option.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
      return;
    }

    if (!referralCode) {
      toast.error("❌ Something went wrong. Please try again later.", {
        duration: 4000,
        icon: "❌",
        style: {
          border: '2px solid #ef4444',
          padding: '16px',
          fontSize: '14px',
        },
      });
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const referralLink = `${baseUrl}/?ref=${referralCode}`;
      
      await navigator.clipboard.writeText(referralLink);
      setReferralLinkCopied(true);
      
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
        setReferralLinkCopied(false);
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

  const openSocialMedia = (platform: string) => {
    if (!hasSurveyTicket) {
      toast.error("⚠ You must complete a survey before unlocking this option.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
      return;
    }

    const urls = {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com", 
      youtube: "https://youtube.com"
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  const handleSocialFollowComplete = async () => {
    if (!hasSurveyTicket) {
      toast.error("⚠ You must complete a survey before unlocking this option.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
      return;
    }

    try {
      setLoading("SOCIAL");
      
      const response = await fetch("/api/tickets/social-follow", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message, {
          duration: 5000,
          icon: "🎉",
          style: {
            border: '2px solid #22c55e',
            padding: '16px',
            fontSize: '14px',
          },
        });

        localStorage.setItem('ticket_awarded', JSON.stringify({
          source: 'SOCIAL',
          count: data.data?.ticketCount || 1,
        }));

        setSocialMediaFollowed(true);
        
        router.refresh();

        setTimeout(() => {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'ticket_awarded',
            newValue: JSON.stringify({
              source: 'SOCIAL',
              count: data.data?.ticketCount || 1,
            }),
          }));
        }, 1000);
      } else {
        if (data.message.includes("already") || data.message.includes("only earn 1")) {
          toast.error(data.message, {
            duration: 4000,
            icon: "⚠️",
            style: {
              border: '2px solid #f59e0b',
              padding: '16px',
              fontSize: '14px',
            },
          });
        } else {
          toast.error(data.message || "❌ Something went wrong. Please try again later.", {
            duration: 4000,
            icon: "❌",
            style: {
              border: '2px solid #ef4444',
              padding: '16px',
              fontSize: '14px',
            },
          });
        }
      }
    } catch (error) {
      toast.error("❌ Something went wrong. Please try again later.", {
        duration: 4000,
        icon: "❌",
        style: {
          border: '2px solid #ef4444',
          padding: '16px',
          fontSize: '14px',
        },
      });
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const getStatusMessage = () => {
    if (appliedTickets === 0) {
      return "Start by completing your first survey to unlock more ways to earn tickets!";
    }
    return "Great! Keep going — every new ticket increases your chance to win!";
  };

  const userData = session?.user ? {
    id: session.user.id as string,
    name: session.user.name,
    email: session.user.email,
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Earn Tickets & Increase Your chance</CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Method 1: Complete Survey - Now with Guaranteed Ticket System */}
          <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Step Indicator */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs font-medium px-2 py-1">
                Step 1 of 3
              </Badge>
            </div>
            
            <CardContent className="pt-8 md:pt-6 pr-20 md:pr-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-blue-800">Complete a Survey</h3>
                  <p className="text-sm text-blue-700">Get 1 ticket for sharing your opinion</p>
                </div>
              </div>
              
              <div className="mb-4 space-y-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  🎫 1 Ticket Reward
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Repeatable
                </Badge>
              </div>
              
              {userData ? (
                <>
                  <CPXSurveyModal 
                    user={userData}
                    onSurveyComplete={handleSurveyComplete}
                    isLoading={loading === "SURVEY"}
                  />
                  
                  {surveyAttempted && appliedTickets === 0 && !hasSurveyTicket && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <button
                        onClick={async () => {
                          try {
                            setLoading("FORCE_AWARD");
                            const response = await fetch('/api/tickets/force-award', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                              setHasSurveyTicket(true);
                              
                              toast.success("🎫 Ticket manually awarded!", {
                                duration: 5000,
                                icon: "🎯",
                                style: {
                                  border: '2px solid #3b82f6',
                                  padding: '16px',
                                  fontSize: '14px',
                                },
                              });
                              
                              router.refresh();
                              
                              setTimeout(() => {
                                router.refresh();
                                checkUserStatus();
                              }, 2000);
                            } else {
                              toast.error("Failed to award ticket: " + data.message, {
                                duration: 4000,
                              });
                            }
                          } catch (error) {
                            console.error("Error with force award:", error);
                            toast.error("Error awarding ticket", {
                              duration: 4000,
                            });
                          } finally {
                            setLoading(null);
                          }
                        }}
                        disabled={loading === "FORCE_AWARD"}
                        className="w-full py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200"
                      >
                        {loading === "FORCE_AWARD" ? "Processing..." : "Ticket not showing? Click here"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Button 
                  disabled
                  className="w-full bg-gray-300 text-gray-500 cursor-not-allowed font-semibold"
                >
                  Login Required
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Method 2: Invite a Friend */}
          <Card className={`relative overflow-hidden border-2 ${
            hasSurveyTicket 
              ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50' 
              : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
          }`}>
            {/* Step Indicator */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <Badge variant="secondary" className={
                hasSurveyTicket 
                  ? "bg-blue-100 text-blue-700 border-blue-300 text-xs font-medium px-2 py-1"
                  : "bg-gray-100 text-gray-600 border-gray-300 text-xs font-medium px-2 py-1"
              }>
                Step 2 of 3
              </Badge>
            </div>
            
            <CardContent className="pt-8 md:pt-6 pr-20 md:pr-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full mr-4 ${
                  hasSurveyTicket ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {hasSurveyTicket ? (
                    <Users className="h-6 w-6 text-blue-600" />
                  ) : (
                    <span className="text-2xl">✉</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${
                    hasSurveyTicket ? 'text-blue-800' : 'text-gray-600'
                  }`}>
                    Invite a Friend
                  </h3>
                  <p className={`text-sm ${
                    hasSurveyTicket 
                      ? 'text-blue-700' 
                      : 'text-gray-500'
                  }`}>
                    {hasSurveyTicket 
                      ? "Earn 1 ticket when your friend completes a survey"
                      : "Unlock this feature by completing your first survey"
                    }
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <Badge variant="secondary" className={
                  hasSurveyTicket 
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }>
                  {hasSurveyTicket ? "Repeatable" : "Locked"}
                </Badge>
              </div>
              
              <Button 
                onClick={handleReferralClick}
                disabled={!hasSurveyTicket}
                className={`w-full font-semibold ${
                  hasSurveyTicket
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {!hasSurveyTicket 
                  ? "Unlock by completing your first survey"
                  : referralLinkCopied 
                    ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    )
                    : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy your invite link
                      </>
                    )
                }
              </Button>
            </CardContent>
          </Card>

          {/* Method 3: Follow on Social Media */}
          <Card className={`relative overflow-hidden border-2 ${
            socialMediaFollowed
              ? 'border-gray-300 bg-gradient-to-br from-gray-100 to-slate-100'
              : hasSurveyTicket 
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50' 
                : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
          }`}>
            {/* Step Indicator */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <Badge variant="secondary" className={
                socialMediaFollowed
                  ? "bg-green-100 text-green-700 border-green-300 text-xs font-medium px-2 py-1"
                  : hasSurveyTicket 
                    ? "bg-purple-100 text-purple-700 border-purple-300 text-xs font-medium px-2 py-1"
                    : "bg-gray-100 text-gray-600 border-gray-300 text-xs font-medium px-2 py-1"
              }>
                Step 3 of 3
              </Badge>
            </div>
            
            <CardContent className="pt-8 pr-24 md:pt-8 md:pr-28">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full mr-4 ${
                  socialMediaFollowed
                    ? 'bg-gray-100'
                    : hasSurveyTicket 
                      ? 'bg-purple-100' 
                      : 'bg-gray-100'
                }`}>
                  {socialMediaFollowed ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : hasSurveyTicket ? (
                    <Share2 className="h-6 w-6 text-purple-600" />
                  ) : (
                    <span className="text-2xl">🤳</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${
                    socialMediaFollowed
                      ? 'text-gray-600'
                      : hasSurveyTicket 
                        ? 'text-purple-800' 
                        : 'text-gray-600'
                  }`}>
                    Follow Us on Social Media
                  </h3>
                  <p className={`text-sm ${
                    socialMediaFollowed
                      ? 'text-gray-500'
                      : hasSurveyTicket 
                        ? 'text-purple-700' 
                        : 'text-gray-500'
                  }`}>
                    {socialMediaFollowed
                      ? "You've already earned your social media ticket!"
                      : hasSurveyTicket 
                        ? "Follow us on any platform and earn 1 extra ticket"
                        : "Unlock this feature by completing your first survey"
                    }
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <Badge variant="secondary" className={
                  socialMediaFollowed
                    ? "bg-green-100 text-green-700 border-green-300"
                    : hasSurveyTicket 
                      ? "bg-purple-100 text-purple-700 border-purple-300"
                      : "bg-gray-100 text-gray-600 border-gray-300"
                }>
                  {socialMediaFollowed ? "Completed" : hasSurveyTicket ? "One-Time Only" : "Locked"}
                </Badge>
              </div>
              
              {socialMediaFollowed ? (
                <Button 
                  disabled
                  className="w-full bg-green-100 text-green-700 font-semibold cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed
                </Button>
              ) : hasSurveyTicket ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSocialMedia('instagram')}
                      className="p-2 border-purple-300 hover:bg-purple-50"
                    >
                      <Instagram className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSocialMedia('facebook')}
                      className="p-2 border-purple-300 hover:bg-purple-50"
                    >
                      <Facebook className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSocialMedia('youtube')}
                      className="p-2 border-purple-300 hover:bg-purple-50"
                    >
                      <Youtube className="h-4 w-4 text-purple-600" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSocialFollowComplete}
                    disabled={loading === "SOCIAL"}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  >
                    {loading === "SOCIAL" ? "Processing..." : "I followed — Get my ticket"}
                  </Button>
                </div>
              ) : (
                <Button 
                  disabled
                  className="w-full bg-gray-300 text-gray-500 cursor-not-allowed font-semibold"
                >
                  Unlock by completing your first survey
                </Button>
              )}
            </CardContent>
          </Card>

        </div>
      </CardContent>
    </Card>
  );
}; 