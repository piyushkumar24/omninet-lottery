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
        <CardTitle className="text-xl md:text-2xl">Earn Tickets & Increase Your chance</CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Method 1: Complete Survey - Now with Guaranteed Ticket System */}
          <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Step Indicator */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs font-medium px-2 py-1">
                Step 1 of 3
              </Badge>
            </div>
            
            <CardContent className="pt-6 px-4 md:pt-6 md:px-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 md:p-3 rounded-full mr-3 md:mr-4 flex-shrink-0">
                  <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base md:text-lg text-blue-800 truncate">Complete a Survey</h3>
                  <p className="text-xs md:text-sm text-blue-700 truncate">Get 1 ticket for sharing your opinion</p>
                </div>
              </div>
              
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                  🎫 1 Ticket Reward
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
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
            
            <CardContent className="pt-6 px-4 md:pt-6 md:px-6">
              <div className="flex items-center mb-4">
                <div className={`p-2 md:p-3 rounded-full mr-3 md:mr-4 flex-shrink-0 ${
                  hasSurveyTicket ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {hasSurveyTicket ? (
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  ) : (
                    <span className="text-xl md:text-2xl">✉</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base md:text-lg truncate ${
                    hasSurveyTicket ? 'text-blue-800' : 'text-gray-600'
                  }`}>
                    Invite a Friend
                  </h3>
                  <p className={`text-xs md:text-sm truncate ${
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
                    ? "bg-blue-100 text-blue-700 border-blue-300 text-xs"
                    : "bg-gray-100 text-gray-600 border-gray-300 text-xs"
                }>
                  {hasSurveyTicket ? "Repeatable" : "Locked"}
                </Badge>
              </div>
              
              <Button 
                onClick={handleReferralClick}
                disabled={!hasSurveyTicket}
                className={`w-full font-semibold text-xs md:text-sm py-2 ${
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
                  ? "bg-gray-100 text-gray-600 border-gray-300 text-xs font-medium px-2 py-1"
                  : hasSurveyTicket
                    ? "bg-purple-100 text-purple-700 border-purple-300 text-xs font-medium px-2 py-1"
                    : "bg-gray-100 text-gray-600 border-gray-300 text-xs font-medium px-2 py-1"
              }>
                Step 3 of 3
              </Badge>
            </div>
            
            <CardContent className="pt-6 px-4 md:pt-6 md:px-6">
              <div className="flex items-center mb-4">
                <div className={`p-2 md:p-3 rounded-full mr-3 md:mr-4 flex-shrink-0 ${
                  socialMediaFollowed
                    ? 'bg-gray-100'
                    : hasSurveyTicket
                      ? 'bg-purple-100'
                      : 'bg-gray-100'
                }`}>
                  {socialMediaFollowed ? (
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
                  ) : hasSurveyTicket ? (
                    <Instagram className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  ) : (
                    <Lock className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base md:text-lg truncate ${
                    socialMediaFollowed
                      ? 'text-gray-600'
                      : hasSurveyTicket
                        ? 'text-purple-800'
                        : 'text-gray-600'
                  }`}>
                    Follow on Social Media
                  </h3>
                  <p className={`text-xs md:text-sm truncate ${
                    socialMediaFollowed
                      ? 'text-gray-500'
                      : hasSurveyTicket
                        ? 'text-purple-700'
                        : 'text-gray-500'
                  }`}>
                    {socialMediaFollowed
                      ? "You've already claimed this reward"
                      : hasSurveyTicket
                        ? "Earn 1 ticket by following our social media"
                        : "Unlock this feature by completing your first survey"
                    }
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <Badge variant="secondary" className={
                  socialMediaFollowed
                    ? "bg-gray-100 text-gray-600 border-gray-300 text-xs"
                    : hasSurveyTicket
                      ? "bg-purple-100 text-purple-700 border-purple-300 text-xs"
                      : "bg-gray-100 text-gray-600 border-gray-300 text-xs"
                }>
                  {socialMediaFollowed
                    ? "Claimed"
                    : hasSurveyTicket
                      ? "One-time"
                      : "Locked"
                  }
                </Badge>
              </div>
              
              {/* Social Media Buttons */}
              {!socialMediaFollowed && hasSurveyTicket ? (
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => openSocialMedia('instagram')}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 hover:border-pink-300 hover:bg-pink-100 text-pink-600"
                    >
                      <Instagram className="h-4 w-4 mr-1" />
                      <span className="text-xs">Instagram</span>
                    </Button>
                    <Button
                      onClick={() => openSocialMedia('facebook')}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-600"
                    >
                      <Facebook className="h-4 w-4 mr-1" />
                      <span className="text-xs">Facebook</span>
                    </Button>
                  </div>
                  <Button
                    onClick={() => openSocialMedia('youtube')}
                    variant="outline"
                    size="sm"
                    className="w-full bg-gradient-to-r from-red-50 to-rose-50 border-red-200 hover:border-red-300 hover:bg-red-100 text-red-600"
                  >
                    <Youtube className="h-4 w-4 mr-1" />
                    <span className="text-xs">YouTube</span>
                  </Button>
                  <Button
                    onClick={handleSocialFollowComplete}
                    disabled={loading === "SOCIAL"}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs md:text-sm py-2"
                  >
                    {loading === "SOCIAL" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm You Followed
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  disabled
                  className={`w-full font-semibold text-xs md:text-sm py-2 ${
                    socialMediaFollowed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {socialMediaFollowed
                    ? "Already Claimed"
                    : "Unlock by completing your first survey"
                  }
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}; 