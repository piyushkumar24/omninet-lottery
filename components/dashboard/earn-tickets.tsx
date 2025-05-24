"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface EarnTicketsProps {
  userId: string;
  availableTickets: number;
}

export const EarnTickets = ({ userId, availableTickets }: EarnTicketsProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [socialMediaFollowed, setSocialMediaFollowed] = useState(false);
  const [hasSurveyTicket, setHasSurveyTicket] = useState(false);
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

  const handleSurveyClick = async () => {
    try {
      setLoading("SURVEY");
      
      const response = await fetch("/api/tickets/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "SURVEY" }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        if (data.firstSurvey) {
          setHasSurveyTicket(true);
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

  const handleReferralClick = async () => {
    if (!hasSurveyTicket) {
      toast.error("Complete your first survey to unlock referral features!");
      return;
    }

    if (!referralCode) {
      toast.error("Referral code not available");
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const referralLink = `${baseUrl}/?ref=${referralCode}`;
      
      await navigator.clipboard.writeText(referralLink);
      setReferralLinkCopied(true);
      toast.success("Referral link copied to clipboard!");
      
      setTimeout(() => {
        setReferralLinkCopied(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const openSocialMedia = (platform: string) => {
    if (!hasSurveyTicket) {
      toast.error("Complete your first survey to unlock social media following!");
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
      toast.error("Complete your first survey first!");
      return;
    }

    try {
      setLoading("SOCIAL");
      
      const response = await fetch("/api/tickets/social-follow", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setSocialMediaFollowed(true);
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

  const getStatusMessage = () => {
    if (availableTickets === 0) {
      return "Start by completing your first survey to unlock more ways to earn tickets!";
    }
    return "Great! Keep going — every new ticket increases your chance to win!";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Earn More Tickets</CardTitle>
        <CardDescription>{getStatusMessage()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Method 1: Complete Survey */}
          <Card className="relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <ClipboardList className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-green-800">Complete a Survey</h3>
                  <p className="text-sm text-green-700">Answer a quick survey and get 1 ticket instantly</p>
                </div>
              </div>
              
              <div className="mb-4">
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                  Repeatable
                </Badge>
              </div>
              
              <Button 
                onClick={handleSurveyClick}
                disabled={loading === "SURVEY"}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {loading === "SURVEY" ? "Processing..." : "Go to Survey"}
              </Button>
            </CardContent>
          </Card>

          {/* Method 2: Invite a Friend */}
          <Card className={`relative overflow-hidden border-2 ${
            hasSurveyTicket 
              ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50' 
              : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full mr-4 ${
                  hasSurveyTicket ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {hasSurveyTicket ? (
                    <Users className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Lock className="h-6 w-6 text-gray-500" />
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
            <CardContent className="pt-6">
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
                    <Lock className="h-6 w-6 text-gray-500" />
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