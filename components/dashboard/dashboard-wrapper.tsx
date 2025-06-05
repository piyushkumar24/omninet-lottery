"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { TicketNotification } from "@/components/dashboard/ticket-notification";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    source: "SURVEY" | "SOCIAL" | "REFERRAL";
    count: number;
  } | null>(null);

  useEffect(() => {
    // Handle various URL parameters for different success/error states
    const referralStatus = searchParams.get('referral');
    const socialStatus = searchParams.get('social');
    const errorType = searchParams.get('error');
    const newsletterStatus = searchParams.get('newsletter');

    // Handle referral success/error
    if (referralStatus === 'success') {
      toast.success("🎉 Ticket added to your account!", {
        duration: 5000,
        icon: "🎫",
        style: {
          border: '2px solid #22c55e',
          padding: '16px',
          fontSize: '14px',
        },
      });
    } else if (referralStatus === 'already_used') {
      toast.error("⚠ Referral already used or your friend has not completed a survey.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }

    // Handle social media status
    if (socialStatus === 'success') {
      toast.success("🎉 Thanks for following us! Your reward has been added.", {
        duration: 5000,
        icon: "🎉",
        style: {
          border: '2px solid #22c55e',
          padding: '16px',
          fontSize: '14px',
        },
      });
    } else if (socialStatus === 'already_claimed') {
      toast.error("⚠ You've already claimed the social follow reward.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }

    // Handle newsletter status
    if (newsletterStatus === 'subscribed') {
      toast.success("🎉 Successfully subscribed to the 0mninet newsletter!", {
        duration: 5000,
        icon: "📩",
        style: {
          border: '2px solid #22c55e',
          padding: '16px',
          fontSize: '14px',
        },
      });
    } else if (newsletterStatus === 'unsubscribed') {
      toast.success("✅ You've been unsubscribed from the newsletter.", {
        duration: 4000,
        icon: "✅",
        style: {
          border: '2px solid #22c55e',
          padding: '16px',
          fontSize: '14px',
        },
      });
    }

    // Handle general errors
    if (errorType === 'survey_required') {
      toast.error("⚠ You must complete a survey before unlocking this option.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
    } else if (errorType === 'unavailable') {
      toast.error("⚠ This action is currently unavailable.", {
        duration: 4000,
        icon: "⚠️",
        style: {
          border: '2px solid #f59e0b',
          padding: '16px',
          fontSize: '14px',
        },
      });
    } else if (errorType === 'server_error') {
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

    // Check for ticket award notifications from URL parameters
    const ticketAwarded = searchParams.get('ticket_awarded');
    const ticketSource = searchParams.get('ticket_source') as "SURVEY" | "SOCIAL" | "REFERRAL" | null;
    const ticketCount = parseInt(searchParams.get('ticket_count') || '1');
    
    if (ticketAwarded === 'true' && ticketSource) {
      setNotificationData({
        source: ticketSource,
        count: ticketCount,
      });
      setShowNotification(true);
      
      // Clean up URL parameters after showing notification
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // Check for survey completion notification
    const surveyCompleted = searchParams.get('survey_completed');
    if (surveyCompleted === 'true') {
      setNotificationData({
        source: "SURVEY",
        count: 1,
      });
      setShowNotification(true);
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    // Listen for ticket award events from localStorage (for cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ticket_awarded' && e.newValue) {
        const data = JSON.parse(e.newValue);
        setNotificationData({
          source: data.source,
          count: data.count || 1,
        });
        setShowNotification(true);
        
        // Clear the localStorage notification
        localStorage.removeItem('ticket_awarded');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check for existing ticket award in localStorage on mount
    const existingAward = localStorage.getItem('ticket_awarded');
    if (existingAward) {
      const data = JSON.parse(existingAward);
      setNotificationData({
        source: data.source,
        count: data.count || 1,
      });
      setShowNotification(true);
      localStorage.removeItem('ticket_awarded');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [searchParams]);

  const handleNotificationClose = () => {
    setShowNotification(false);
    setNotificationData(null);
  };

  const handleViewDashboard = () => {
    setShowNotification(false);
    setNotificationData(null);
    // Refresh the page to show updated ticket count
    router.refresh();
  };

  return (
    <>
      {children}
      
      {/* Ticket Notification */}
      {showNotification && notificationData && (
        <TicketNotification
          show={showNotification}
          ticketSource={notificationData.source}
          ticketCount={notificationData.count}
          onClose={handleNotificationClose}
          onViewDashboard={handleViewDashboard}
        />
      )}
    </>
  );
}; 