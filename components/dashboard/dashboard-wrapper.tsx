"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const searchParams = useSearchParams();

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

  }, [searchParams]);

  return <>{children}</>;
}; 