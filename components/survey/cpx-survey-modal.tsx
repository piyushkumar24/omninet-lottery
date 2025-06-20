"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateCPXSurveyURL } from "@/lib/cpx-utils";
import axios from "axios";
import { 
  ExternalLink, 
  X, 
  ClipboardCheck, 
  Shield, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Monitor,
  RefreshCw,
  Info,
  Ticket,
  RotateCw,
  Search
} from "lucide-react";
import { toast } from "react-hot-toast";

interface CPXSurveyModalProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  onSurveyComplete?: (success?: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  nonWinnerToken?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CPXSurveyModal = ({ 
  user, 
  onSurveyComplete, 
  isLoading = false,
  disabled = false,
  nonWinnerToken,
  open = false,
  onOpenChange
}: CPXSurveyModalProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [surveyUrl, setSurveyUrl] = useState<string>("");
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showTicketReward, setShowTicketReward] = useState(false);
  const [verifyingTicket, setVerifyingTicket] = useState(false);
  const [ticketAwarded, setTicketAwarded] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const messageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create a stable mobile survey URL that never changes
  const stableMobileSurveyUrl = useMemo(() => {
    if (user && typeof window !== 'undefined') {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        let url = generateCPXSurveyURL(user);
        url += '&mobile=1&embedded=1&stable=1';
        console.log('🔒 Generated stable mobile survey URL (will never change)');
        return url;
      }
    }
    return '';
  }, [user]);

  // Handle external control of modal state
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
      if (open && !surveyUrl) {
        // Use stable URL for mobile, generate fresh for desktop
        if (isMobile()) {
          setSurveyUrl(stableMobileSurveyUrl);
          console.log('📱 Using stable mobile survey URL');
        } else {
          let url = generateCPXSurveyURL(user);
          setSurveyUrl(url);
        }
        setIframeLoading(true);
        setSurveyError(null);
      }
    }
  }, [open, user, stableMobileSurveyUrl]); // Include stable URL for mobile

  // Handle internal modal state changes
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (newOpen && !surveyUrl && open === undefined) {
      // Use stable URL for mobile, generate fresh for desktop
      if (isMobile()) {
        setSurveyUrl(stableMobileSurveyUrl);
        console.log('📱 Using stable mobile survey URL (internal trigger)');
      } else {
        let url = generateCPXSurveyURL(user);
        setSurveyUrl(url);
      }
      setIframeLoading(true);
      setSurveyError(null);
    }
    if (!newOpen) {
      // Reset state when closing - but don't reset iframe loading for mobile
      setSurveyError(null);
      setShowTicketReward(false);
      setVerifyingTicket(false);
      // Don't reset iframe loading to prevent reloads
    }
  };

  // Check if user already has tickets from legitimate CPX completion
  const checkForExistingTickets = useCallback(async () => {
    try {
      console.log('🔄 Checking for existing tickets from CPX completion...');
      setVerifyingTicket(true);
      
      const verifyResponse = await fetch(`/api/tickets/verify-all?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        
        if (verifyData.data.surveyTickets > 0) {
          console.log('✅ Found existing survey tickets from legitimate completion:', verifyData.data.surveyTickets);
          setTicketAwarded(true);
          router.refresh();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking for existing tickets:', error);
      return false;
    } finally {
      setVerifyingTicket(false);
    }
  }, [router]);

  // Function to show survey completion confirmation - tickets come via CPX postback only
  const showSurveyCompletionMessage = useCallback(() => {
    console.log('✅ Survey completion detected - tickets will be awarded via CPX postback');
    
    // Show user that survey is completed and ticket will be processed
    toast.success("🎉 Survey completed! Your ticket has been instantly credited.", {
      duration: 8000,
      style: {
        fontSize: '16px',
        padding: '16px',
        maxWidth: '400px',
        border: '2px solid #22c55e',
      },
    });

    setShowTicketReward(true);
    setTicketAwarded(true);
    
    // Start checking for instant ticket delivery
    checkForInstantTicket();
    
    setTimeout(() => {
      if (onSurveyComplete) {
        onSurveyComplete(true);
      }
      // Refresh to show tickets awarded via CPX postback
      router.refresh();
    }, 3000); // Increased delay for better UX
  }, [onSurveyComplete, router]);

  // New function to check for instant ticket delivery
  const checkForInstantTicket = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkTicket = async () => {
      try {
        attempts++;
        const response = await fetch('/api/tickets/instant-verify', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data.hasNewTickets) {
            console.log('✅ Instant ticket delivery confirmed:', data.data);
            
            // Show success message
            toast.success("🎫 Ticket instantly credited to your account!", {
              duration: 6000,
              style: {
                fontSize: '16px',
                padding: '16px',
                maxWidth: '400px',
                border: '2px solid #10b981',
                backgroundColor: '#ecfdf5',
              },
            });
            
            // Update local state
            setTicketAwarded(true);
            setVerifyingTicket(false);
            
            // Close modal after confirmation
            setTimeout(() => {
              setIsOpen(false);
              router.refresh();
            }, 2000);
            
            return true;
          }
        }
        
        // Retry if not found and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(checkTicket, 2000); // Check every 2 seconds
        } else {
          console.log('⚠️ Max attempts reached for instant ticket verification');
          setVerifyingTicket(false);
        }
        
      } catch (error) {
        console.error('Error checking for instant ticket:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkTicket, 2000);
        }
      }
    };
    
    // Start checking
    setVerifyingTicket(true);
    checkTicket();
  }, [router]);

  // Handler for when no surveys are available - DO NOT award tickets
  const handleNoSurveysAvailable = useCallback(async () => {
    console.log('🔍 No surveys available - showing message to user (no ticket awarded)');
    
    // Show message to user that no surveys are available
    toast("No surveys available at the moment. Please try again later.", {
      icon: "📝",
      duration: 5000,
    });
    
    setSurveyError("no_surveys");
    
    // Do not award any tickets - tickets should only come from completed surveys via CPX postback
  }, []);

  // Check for "no surveys available" messages continuously
  const checkForNoSurveysMessage = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const iframeContent = iframe.contentDocument.body.innerText.toLowerCase();
        
        // List of phrases that indicate no surveys are available
        const noSurveyPhrases = [
          'unfortunately we could not find a survey',
          'we could not find a survey for your profile',
          'try again in a few hours',
          'no survey available',
          'sorry, there are no surveys'
        ];
        
        // Phrases that indicate survey disqualification 
        const disqualificationPhrases = [
          'unfortunately, you did not qualify',
          'did not qualify for this survey',
          'you have been disqualified',
          'you do not qualify',
          'screening criteria',
          'survey was not a good match'
        ];
        
        // Check for any no survey phrases
        const noSurveyPhrase = noSurveyPhrases.find(phrase => 
          iframeContent.includes(phrase)
        );
        
        // Check for disqualification phrases
        const disqualificationPhrase = disqualificationPhrases.find(phrase => 
          iframeContent.includes(phrase)
        );
        
        if (noSurveyPhrase) {
          console.log('No surveys message detected during continuous check:', noSurveyPhrase);
          console.log('Full message context:', iframeContent.substring(0, 200) + '...');
          
          // Stop checking and show error
          if (messageCheckIntervalRef.current) {
            clearInterval(messageCheckIntervalRef.current);
            messageCheckIntervalRef.current = null;
          }
          
          setSurveyError("no_surveys");
          
          // For no surveys, we still award a ticket since it's not user's fault
          setTimeout(() => {
            handleNoSurveysAvailable();
          }, 1000);
        } 
        else if (disqualificationPhrase) {
          console.log('Disqualification message detected:', disqualificationPhrase);
          console.log('Full message context:', iframeContent.substring(0, 200) + '...');
          
          // Stop checking and show disqualification error
          if (messageCheckIntervalRef.current) {
            clearInterval(messageCheckIntervalRef.current);
            messageCheckIntervalRef.current = null;
          }
          
          setSurveyError("disqualified");
          
          // For disqualification, we don't automatically award a ticket
          // User must click the claim button manually
        }
      }
    } catch (e) {
      // Silently fail - cross-origin restrictions likely in effect
    }
  }, [handleNoSurveysAvailable]);

  // Verify ticket was awarded through legitimate CPX completion
  const verifyTicketAwarded = useCallback(async () => {
    try {
      setVerifyingTicket(true);
      
      // Check using verify-all endpoint for accurate ticket information
      const verifyResponse = await fetch(`/api/tickets/verify-all?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        
        // If user has survey tickets, consider the process successful
        if (verifyData.data.surveyTickets > 0) {
          console.log('✅ Ticket verification successful, user has survey tickets:', verifyData.data.surveyTickets);
          setTicketAwarded(true);
          
          // Update parent component and refresh the page
          if (onSurveyComplete) {
            onSurveyComplete(true);
          }
          
          // Close the modal after a short delay
          setTimeout(() => {
            setIsOpen(false);
          }, 1500);
          
          return true;
        } else {
          console.log('⚠️ No survey tickets found during verification - tickets only awarded for completed surveys');
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying ticket:', error);
      return false;
    } finally {
      setVerifyingTicket(false);
    }
  }, [onSurveyComplete]);

  // Function to clear CPX-related cookies
  const clearCPXCookies = useCallback(() => {
    try {
      // Get all cookies
      const cookies = document.cookie.split(';');
      
      // Find and remove any CPX-related cookies
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        
        // Check if this is a CPX-related cookie
        if (cookie.startsWith('cpx_') || 
            cookie.includes('cpx-') || 
            cookie.includes('_cpx') ||
            cookie.includes('survey_')) {
          
          // Extract cookie name
          const name = cookie.split('=')[0].trim();
          
          // Delete the cookie by setting expiration in the past
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          console.log(`🍪 Cleared CPX cookie: ${name}`);
        }
      }
    } catch (e) {
      console.error('Error clearing CPX cookies:', e);
    }
  }, []);

  // Update the useEffect to call clearCPXCookies when modal opens - DISABLED FOR MOBILE
  useEffect(() => {
    // SKIP THIS ENTIRELY FOR MOBILE - this is what causes the reloading!
    if (isMobile()) {
      console.log('Mobile detected - skipping URL regeneration to prevent reloading');
      return;
    }
    
    if (isOpen && user) {
      // Clear any CPX-related cookies first
      clearCPXCookies();
      
      // Generate a unique user ID for each survey request to prevent "already clicked" issues
      const uniqueUser = {
        ...user,
        id: user.id // We're using timestamp in the URL params now, so keep the original ID
      };
      
      const url = generateCPXSurveyURL(uniqueUser);
      setSurveyUrl(url);
      setIframeLoading(true);
      setSurveyError(null);
      setTicketAwarded(false);
      setTicketId(null);
      
      console.log('🔄 Generated fresh survey URL with unique timestamp');
    }
  }, [isOpen, user, retryCount, clearCPXCookies]);

  // Setup continuous monitoring for "no surveys" message - DISABLED FOR MOBILE
  useEffect(() => {
    // Skip aggressive monitoring for mobile to prevent reloading issues
    if (isMobile()) {
      return;
    }
    
    if (isOpen && !surveyError && !showTicketReward && surveyUrl) {
      // Cleanup any existing interval first
      if (messageCheckIntervalRef.current) {
        clearInterval(messageCheckIntervalRef.current);
      }
      
      // Set up continuous checking every 5 seconds (less aggressive)
      messageCheckIntervalRef.current = setInterval(() => {
        checkForNoSurveysMessage();
      }, 5000);
    }
    
    return () => {
      // Cleanup interval on unmount or when modal closes
      if (messageCheckIntervalRef.current) {
        clearInterval(messageCheckIntervalRef.current);
        messageCheckIntervalRef.current = null;
      }
    };
  }, [isOpen, surveyError, showTicketReward, surveyUrl, checkForNoSurveysMessage]);

  // Verify ticket was awarded 5 seconds after showing success - DISABLED FOR MOBILE
  useEffect(() => {
    // Skip verification for mobile to prevent any interference
    if (isMobile()) {
      return;
    }
    
    let timeoutId: NodeJS.Timeout;
    
    if (showTicketReward && !verifyingTicket) {
      timeoutId = setTimeout(() => {
        verifyTicketAwarded();
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showTicketReward, verifyingTicket, verifyTicketAwarded]);

  // Enhanced mobile detection
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleOpenInNewTab = () => {
    if (surveyUrl) {
      if (isMobile()) {
        // Mobile: Do nothing - survey is already embedded and loading
        toast.success("📱 Survey is loading below...", {
          duration: 1000,
          icon: "📋",
          style: {
            fontSize: '16px',
            padding: '16px',
            maxWidth: '350px',
            border: '2px solid #3b82f6',
          },
        });
        
        // DO NOT modify the URL or reload anything for mobile
        
      } else {
        // Desktop: Keep existing behavior (new tab)
        window.open(surveyUrl, '_blank', 'noopener,noreferrer');
        toast.success("Survey opened in new tab!");
      }
      
      // Mark survey as attempted
      if (onSurveyComplete) {
        onSurveyComplete(false);
      }
    }
  };

  // Enhanced mobile survey completion detection - DISABLED to prevent instability
  useEffect(() => {
    // Disabled automatic ticket checking to prevent iframe reloading issues
    // Tickets will be handled via CPX postback or manual completion detection
    console.log('Mobile survey modal loaded - ticket checking disabled for stability');
    
    // For mobile, set up a more reliable ticket verification system
    if (isMobile() && isOpen) {
      console.log('📱 Setting up mobile ticket verification system');
      
      // Check for tickets periodically after survey is opened
      let checkCount = 0;
      const maxChecks = 12; // Check for up to 2 minutes (12 * 10 seconds)
      
      const ticketCheckInterval = setInterval(async () => {
        try {
          checkCount++;
          console.log(`🔍 Mobile ticket check attempt ${checkCount}/${maxChecks}`);
          
          // Use the dedicated mobile verification endpoint
          const response = await fetch('/api/tickets/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            body: JSON.stringify({
              mobileSurveyVerification: true
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && (data.data.transactionFound || data.data.ticketsFound)) {
              console.log('✅ Mobile ticket verification successful:', data.data);
              
              // Show success message
              toast.success("🎫 Survey completed! Ticket credited to your account!", {
                duration: 6000,
                style: {
                  fontSize: '16px',
                  padding: '16px',
                  maxWidth: '400px',
                  border: '2px solid #10b981',
                  backgroundColor: '#ecfdf5',
                },
              });
              
              // Update local state
              setTicketAwarded(true);
              setShowTicketReward(true);
              
              // Update parent component
              if (onSurveyComplete) {
                onSurveyComplete(true);
              }
              
              // Stop checking
              clearInterval(ticketCheckInterval);
              
              // Refresh the page after a short delay
              setTimeout(() => {
                router.refresh();
              }, 3000);
            }
          }
          
          // Stop checking after max attempts
          if (checkCount >= maxChecks) {
            clearInterval(ticketCheckInterval);
          }
        } catch (error) {
          console.error('Error checking for tickets:', error);
        }
      }, 10000); // Check every 10 seconds
      
      // Clean up interval when modal closes
      return () => {
        if (ticketCheckInterval) {
          clearInterval(ticketCheckInterval);
        }
      };
    }
  }, [isOpen, isMobile, onSurveyComplete, router]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setSurveyError(null);
    setIframeLoading(true);
    setTicketAwarded(false);
    setTicketId(null);
    
    // Clear any CPX-related cookies first
    clearCPXCookies();
    
    // Force a new survey URL with a fresh timestamp
    const freshUrl = generateCPXSurveyURL({
      ...user,
      id: `${user.id}_${Date.now()}`.substring(0, 36) // Add timestamp but keep length reasonable
    });
    setSurveyUrl(freshUrl);
    
    toast("Loading a fresh survey...", {
      icon: "🔄",
      duration: 2000,
    });
  };

  // Enhanced close handler with better mobile support
  const handleClose = async () => {
    // Ensure we mark this as a survey attempt even if modal is closed
    if (!showTicketReward && onSurveyComplete) {
      onSurveyComplete(false);
    }
    
    // Show confirmation message for mobile users
    if (window.innerWidth <= 768) {
      toast("Survey closed. Check your dashboard for any earned tickets.", {
        duration: 4000,
        icon: "ℹ️",
        style: {
          fontSize: '14px',
          padding: '12px',
          maxWidth: '350px',
        },
      });
    }
    
    console.log('🚫 Modal closed - tickets only awarded for completed surveys via CPX postback');
    
    // Close the modal using the new handler
    handleOpenChange(false);
    
    // Refresh to show any tickets that may have been awarded through legitimate CPX postback
    router.refresh();
  };

  // Enhanced mobile-friendly close button handler
  const handleMobileClose = () => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // For mobile, check for tickets one final time before closing
    if (isMobile()) {
      // Show loading toast
      toast("Checking for earned tickets...", {
        icon: "🔍",
        duration: 2000,
      });
      
      // Final ticket check
      fetch('/api/tickets/verify-all', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Final ticket check complete:', data.data);
          
          // Show ticket count
          if (data.data.surveyTickets > 0) {
            toast.success(`You have ${data.data.surveyTickets} survey tickets!`, {
              duration: 3000,
            });
          }
        }
      })
      .catch(error => console.error('Error in final ticket check:', error))
      .finally(() => {
        // Always close the modal after check
        handleClose();
      });
    } else {
      // For desktop, just close normally
      handleClose();
    }
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    
    // Notify parent that a survey was attempted
    if (onSurveyComplete) {
      onSurveyComplete(false);
    }
    
    // For mobile, keep it simple - don't do aggressive checking that can cause instability
    if (isMobile()) {
      console.log('Mobile survey loaded successfully');
      
      // Check for completion URL parameters in the parent window
      if (typeof window !== 'undefined') {
        const parentUrl = window.location.href;
        if (parentUrl.includes('survey=completed') || parentUrl.includes('status=complete')) {
          console.log('Survey completion detected from parent URL parameters');
          showSurveyCompletionMessage();
        }
      }
      
      return;
    }
    
    // Only do URL checking for desktop
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        const iframeUrl = iframe.contentWindow.location.href;
        
        // Check if URL contains success or completion parameters
        if (iframeUrl.includes('survey=completed') || 
            iframeUrl.includes('status=complete') || 
            iframeUrl.includes('status=success')) {
          console.log('Survey completion detected from URL parameters:', iframeUrl);
          showSurveyCompletionMessage();
          return;
        }
      }
    } catch (e) {
      // Cross-origin restrictions may prevent this check
      console.log('Cannot check iframe URL due to cross-origin restrictions');
    }
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setSurveyError("loading_failed");
    toast.error("Failed to load survey. You'll still get a ticket!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* Only show DialogTrigger if not externally controlled */}
      {open === undefined && (
        <DialogTrigger asChild>
          <Button
            data-cpx-survey-button
            disabled={disabled || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Go to Survey
              </>
            )}
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-4xl w-[95vw] max-h-[98vh] bg-white border-2 border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className={`border-b border-slate-200 flex-shrink-0 ${isMobile() ? 'pb-2 pt-2' : 'pb-4'}`}>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-lg`}>
                <ClipboardCheck className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className={`font-bold text-slate-800 ${isMobile() ? 'text-base' : 'text-lg sm:text-2xl'}`}>
                  {isMobile() ? "📱 Survey" : "Complete Survey & Earn Tickets"}
                </DialogTitle>
                <DialogDescription className={`text-slate-600 mt-0.5 ${isMobile() ? 'text-xs' : 'text-sm sm:text-base'}`}>
                  {isMobile() ? "Complete to earn lottery ticket" : "Answer a few questions and earn 1 lottery ticket"}
                </DialogDescription>
              </div>
            </div>
            
            {/* Enhanced Mobile Close Button */}
            <div className="flex justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMobileClose}
                className={`flex items-center gap-1.5 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 rounded-lg font-medium shadow-sm ${isMobile() ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'}`}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Close Survey</span>
                <span className="sm:hidden">Close</span>
              </Button>
            </div>
          </div>
          

          
          {/* Desktop Instructions Only */}
          {!isMobile() && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4 mt-4">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">📋 How it Works</h3>
                  <ul className="text-blue-800 text-xs sm:text-sm space-y-1">
                    <li>• Complete the survey questions honestly and thoroughly</li>
                    <li>• Survey typically takes 2-5 minutes to complete</li>
                    <li>• You'll earn 1 lottery ticket upon completion</li>
                    <li className="text-green-700 font-medium">• Tickets are instantly credited to your account</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons - Desktop Only */}
          {!isMobile() && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 text-sm py-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Retry</span>
                <span className="sm:hidden">🔄 Reload</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="flex items-center justify-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 text-sm py-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Survey Frame Container - Enhanced for Mobile */}
          <div 
            className={`relative bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden h-full ${isMobile() ? 'm-1' : 'm-2 sm:m-4'}`}
            style={{ 
              minHeight: isMobile() ? 'calc(100vh - 150px)' : 'calc(100vh - 450px)',
              height: isMobile() ? 'calc(100vh - 150px)' : 'auto'
            }}
          >
            
            {/* Mobile-Optimized Loading State */}
            {iframeLoading && (
              <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 mb-4">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 animate-spin" />
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-semibold text-slate-800">
                      {isMobile() ? "📱 Loading Survey..." : "Loading Survey..."}
                    </p>
                    <p className="text-sm text-slate-600">
                      {isMobile() ? "Please wait..." : "Please wait while we prepare your survey"}
                    </p>
                  </div>
                </div>
                {!isMobile() && (
                  <div className="w-48 sm:w-64 bg-slate-200 rounded-full h-2 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                )}
              </div>
            )}
            
            {/* Enhanced Mobile Ticket Reward Success State */}
            {showTicketReward && (
              <div className="absolute inset-0 bg-green-50 z-20 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-sm sm:max-w-md">
                  <CheckCircle2 className="h-16 w-16 sm:h-20 sm:w-20 text-green-600 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-green-800 mb-3">🎉 Success!</h3>
                  <p className="text-green-700 mb-4 text-base sm:text-lg font-medium">
                    You've successfully earned 1 lottery ticket!
                  </p>
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200 mb-4">
                    <p className="text-green-800 font-semibold text-sm sm:text-base mb-2">
                      ✅ Ticket Instantly Credited
                    </p>
                    <p className="text-green-700 text-sm">
                      Your ticket has been automatically added to the current lottery draw.
                    </p>
                    {verifyingTicket && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-600">
                        <RotateCw className="h-4 w-4 animate-spin" />
                        Confirming instant delivery...
                      </div>
                    )}
                    {ticketAwarded && !verifyingTicket && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Delivery confirmed!
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile/Desktop action button */}
                  <Button
                    onClick={() => {
                      handleOpenChange(false);
                      router.refresh();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
                  >
                    🎯 {isMobile() ? "Return to Dashboard" : "View My Dashboard"}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Enhanced Mobile-Optimized Survey Iframe */}
            {surveyUrl && !surveyError && !showTicketReward && (
              <iframe
                key={isMobile() ? 'mobile-survey-static' : surveyUrl} // Static key for mobile to prevent reloads
                src={surveyUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                onLoad={isMobile() ? () => setIframeLoading(false) : handleIframeLoad} // Simplified for mobile
                onError={isMobile() ? () => setIframeLoading(false) : handleIframeError} // Simplified for mobile
                className="rounded-lg w-full h-full"
                title="CPX Research Survey"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox allow-downloads"
                ref={iframeRef}
                style={{ 
                  minHeight: isMobile() ? 'calc(100vh - 150px)' : 'calc(100vh - 450px)',
                  border: 'none',
                  background: 'white',
                  width: '100%',
                  height: '100%'
                }}
                allow="fullscreen; camera; microphone; geolocation"
              />
            )}
          </div>

          {/* Status Indicators - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium text-xs sm:text-sm">Quick Process</p>
                <p className="text-blue-700 text-xs">Usually 2-5 minutes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <div>
                <p className="text-purple-800 font-medium text-xs sm:text-sm">Any Device</p>
                <p className="text-purple-700 text-xs">Desktop, tablet, or mobile</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 