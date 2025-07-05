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
    
    // Handle new ticket confirmation from email
    const ticketConfirmed = searchParams.get('ticket_confirmed');
    const confirmationCode = searchParams.get('confirmation');

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

    // Handle ticket confirmation from email link
    if (ticketConfirmed === 'true') {
      // Show enhanced confirmation message
      toast.success("✅ Welcome back! Your lottery ticket is confirmed and active.", {
        duration: 8000,
        icon: "🎯",
        style: {
          border: '2px solid #10b981',
          padding: '18px',
          fontSize: '16px',
          backgroundColor: '#ecfdf5',
          color: '#064e3b',
          maxWidth: '400px',
        },
      });
      
      // Show additional info about the confirmation
      if (confirmationCode) {
        setTimeout(() => {
          toast(`🎫 Confirmation: ${confirmationCode}`, {
            duration: 6000,
            icon: "📋",
            style: {
              border: '2px solid #3b82f6',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
            },
          });
        }, 1000);
      }
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
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

    // Check URL for ticket related query parameters
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

    // Enhanced real-time checking for instant ticket notifications with retry logic
    const checkForInstantNotifications = async (retryCount = 0) => {
      try {
        console.log('Checking for instant ticket notifications...');
        const response = await fetch('/api/tickets/instant-verify', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data.notifications?.length > 0) {
            console.log('Found notifications:', data.data.notifications.length);
            // Show notifications for new tickets
            data.data.notifications.forEach((notification: any) => {
              if (notification.type === 'TICKET_AWARDED') {
                // Set notification data for popup display
                setNotificationData({
                  source: notification.source || "SURVEY",
                  count: notification.ticketCount || 1,
                });
                setShowNotification(true);
                
                // Also show toast notification for immediate feedback
                toast.success(notification.message, {
                  duration: 8000, // Extended duration for better visibility
                  icon: "🎫",
                  style: {
                    border: '2px solid #10b981',
                    padding: '16px',
                    fontSize: '16px',
                    backgroundColor: '#ecfdf5',
                    maxWidth: '400px',
                  },
                });
              }
            });
            
            // Mark notifications as read
            fetch('/api/tickets/instant-verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                notificationIds: data.data.notifications.map((n: any) => n.id),
              }),
            }).catch(err => {
              console.error('Error marking notifications as read:', err);
            });
            
            // Refresh the page to update ticket counts
            setTimeout(() => {
              router.refresh();
            }, 1000);
          }
        } else if (retryCount < 3) {
          // Retry up to 3 times with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying notification check in ${delay}ms (attempt ${retryCount + 1}/3)`);
          setTimeout(() => checkForInstantNotifications(retryCount + 1), delay);
        }
      } catch (error) {
        console.error('Error checking for instant notifications:', error);
        
        // Retry on failure
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying notification check after error in ${delay}ms (attempt ${retryCount + 1}/3)`);
          setTimeout(() => checkForInstantNotifications(retryCount + 1), delay);
        }
      }
    };

    // Check for instant notifications on mount and set up periodic checks
    checkForInstantNotifications();
    
    // Set up polling for notifications every 15 seconds
    const pollingInterval = setInterval(() => {
      checkForInstantNotifications();
    }, 15000);

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
      clearInterval(pollingInterval);
    };
  }, [searchParams, router]);

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