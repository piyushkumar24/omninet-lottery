"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  CheckCircle2, 
  X, 
  Bell,
  Sparkles,
  Globe,
  Gift,
  TrendingUp
} from "lucide-react";
import { toast } from "react-hot-toast";

interface NewsletterCTAProps {
  userId: string;
}

export const NewsletterCTA = ({ userId }: NewsletterCTAProps) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/user/newsletter-status');
      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.subscribed || false);
      }
    } catch (error) {
      console.error("Error fetching newsletter status:", error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSubscribed(true);
        toast.success(data.message, {
          duration: 5000,
          icon: "📩",
          style: {
            border: '2px solid #22c55e',
            padding: '16px',
            fontSize: '14px',
          },
        });
      } else {
        toast.error(data.message, {
          duration: 4000,
          icon: "⚠️",
          style: {
            border: '2px solid #f59e0b',
            padding: '16px',
            fontSize: '14px',
          },
        });
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
      console.error("Error subscribing to newsletter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Don't show if subscribed or dismissed
  if (isSubscribed || !isVisible) return null;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-xl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-purple-300/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-300/20 to-blue-300/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-700 hover:bg-white/50 rounded-full p-2 h-8 w-8 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-800">📩 Newsletter CTA</h3>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-1">
                    Stay Updated
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Want to stay updated with news, prizes, and community milestones?
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Global Updates</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Gift className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span>Prize Alerts</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Milestones</span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Subscribe to the 0mninet Newsletter
                  </>
                )}
              </Button>

              {/* Disclaimer */}
              <p className="text-xs text-slate-500 mt-2 text-center">
                🔒 We respect your privacy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}; 