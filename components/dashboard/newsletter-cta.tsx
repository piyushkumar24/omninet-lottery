"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mail, 
  X, 
  Bell,
  BellOff,
  Check,
  Loader2,
  Settings
} from "lucide-react";
import { toast } from "react-hot-toast";

interface NewsletterSectionProps {
  userId: string;
}

export const NewsletterSection = ({ userId }: NewsletterSectionProps) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
      setIsSubscribed(false);
    } finally {
      setInitialLoading(false);
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
          duration: 4000,
          icon: "📩",
        });
      } else {
        toast.error(data.message, {
          duration: 4000,
          icon: "⚠️",
        });
      }
    } catch (error) {
      toast.error("❌ Something went wrong. Please try again later.", {
        duration: 4000,
        icon: "❌",
      });
      console.error("Error subscribing to newsletter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsSubscribed(false);
        toast.success(data.message, {
          duration: 4000,
          icon: "✅",
        });
      } else {
        toast.error(data.message, {
          duration: 4000,
          icon: "⚠️",
        });
      }
    } catch (error) {
      toast.error("❌ Something went wrong. Please try again later.", {
        duration: 4000,
        icon: "❌",
      });
      console.error("Error unsubscribing from newsletter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't render anything while loading initially
  if (initialLoading) {
    return (
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading newsletter settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if dismissed and not subscribed
  if (isDismissed && !isSubscribed) return null;

  return (
    <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isSubscribed 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {isSubscribed ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Mail className="h-6 w-6" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {isSubscribed ? 'Newsletter Subscription Active' : 'Newsletter Updates'}
              </h3>
              
              <p className="text-sm text-slate-600 mb-4">
                {isSubscribed 
                  ? "You're receiving updates about news, prizes, and community milestones."
                  : "Stay updated with news, prizes, and community milestones."
                }
              </p>

              {/* Action Button */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                  disabled={isLoading}
                  variant={isSubscribed ? "outline" : "default"}
                  className={`${
                    isSubscribed 
                      ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } transition-colors duration-200`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
                    </>
                  ) : (
                    <>
                      {isSubscribed ? (
                        <>
                          <BellOff className="h-4 w-4 mr-2" />
                          Unsubscribe
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </>
                  )}
                </Button>

                {isSubscribed && (
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <Check className="h-3 w-3 mr-1" />
                    Subscribed
                  </div>
                )}
              </div>

              {/* Features for non-subscribed users */}
              {!isSubscribed && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center text-xs text-slate-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span>Global Updates</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      <span>Prize Alerts</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Milestones</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Close button for non-subscribed users */}
          {!isSubscribed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Privacy note */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 flex items-center">
            <Settings className="h-3 w-3 mr-1" />
            You can change your subscription preferences anytime. We respect your privacy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 