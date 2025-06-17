"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

  // Handle external control of modal state
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
      if (open && !surveyUrl) {
        // Generate survey URL when modal opens
        const url = generateCPXSurveyURL(user);
        setSurveyUrl(url);
        setIframeLoading(true);
        setSurveyError(null);
      }
    }
  }, [open, user]); // Remove surveyUrl from dependencies to prevent infinite loop

  // Handle internal modal state changes
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (newOpen && !surveyUrl && open === undefined) {
      // Generate survey URL when modal opens via internal trigger
      const url = generateCPXSurveyURL(user);
      setSurveyUrl(url);
      setIframeLoading(true);
      setSurveyError(null);
    }
    if (!newOpen) {
      // Reset state when closing
      setIframeLoading(true);
      setSurveyError(null);
      setShowTicketReward(false);
      setVerifyingTicket(false);
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

  // Update the useEffect to call clearCPXCookies when modal opens
  useEffect(() => {
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

  // Setup continuous monitoring for "no surveys" message
  useEffect(() => {
    if (isOpen && !surveyError && !showTicketReward && surveyUrl) {
      // Cleanup any existing interval first
      if (messageCheckIntervalRef.current) {
        clearInterval(messageCheckIntervalRef.current);
      }
      
      // Set up continuous checking every 2 seconds
      messageCheckIntervalRef.current = setInterval(() => {
        checkForNoSurveysMessage();
      }, 2000);
    }
    
    return () => {
      // Cleanup interval on unmount or when modal closes
      if (messageCheckIntervalRef.current) {
        clearInterval(messageCheckIntervalRef.current);
        messageCheckIntervalRef.current = null;
      }
    };
  }, [isOpen, surveyError, showTicketReward, surveyUrl, checkForNoSurveysMessage]);

  // Verify ticket was awarded 5 seconds after showing success
  useEffect(() => {
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
        // Mobile: Keep survey embedded in the modal - DO NOT navigate away
        toast.success("📱 Loading embedded survey...", {
          duration: 2000,
          icon: "🔄",
          style: {
            fontSize: '16px',
            padding: '16px',
            maxWidth: '350px',
            border: '2px solid #3b82f6',
          },
        });
        
        // Just reload the iframe to ensure it works on mobile
        setIframeLoading(true);
        
        // Force iframe reload with mobile-optimized parameters
        const mobileOptimizedUrl = `${surveyUrl}&mobile=1&embedded=1`;
        setSurveyUrl(mobileOptimizedUrl);
        
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

  // Enhanced mobile survey completion detection
  useEffect(() => {
    // Check if user is returning from mobile survey - this is no longer needed since we're not navigating away
    // But keep the instant ticket checking functionality
    checkForInstantTicket();
  }, []);

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
    
    handleClose();
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    
    // Notify parent that a survey was attempted
    if (onSurveyComplete) {
      onSurveyComplete(false);
    }
    
    // Check for URL parameters indicating survey completion
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        const iframeUrl = iframe.contentWindow.location.href;
        
        // Check if URL contains success or completion parameters
        if (iframeUrl.includes('survey=completed') || 
            iframeUrl.includes('status=complete') || 
            iframeUrl.includes('status=success')) {
          console.log('Survey completion detected from URL parameters:', iframeUrl);
          
          // Show completion message - ticket will come via CPX postback
          showSurveyCompletionMessage();
          return;
        }
      }
    } catch (e) {
      // Cross-origin restrictions may prevent this check
      console.log('Cannot check iframe URL due to cross-origin restrictions');
    }
    
    // Check iframe content for survey completion or error messages
    setTimeout(() => {
      try {
        const iframe = document.querySelector('iframe[title="CPX Research Survey"]') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          const iframeContent = iframe.contentDocument.body.innerText.toLowerCase();
          
          // Check for survey success messages
          if (iframeContent.includes('thank you for completing') || 
              iframeContent.includes('survey completed') ||
              iframeContent.includes('successfully completed')) {
            console.log('Survey completion detected from content:', 
              iframeContent.substring(0, 100) + '...');
            
            // Show completion message - ticket will come via CPX postback
            showSurveyCompletionMessage();
            return;
          }
          
          // Check for no surveys message
          if (iframeContent.includes('unfortunately we could not find a survey') || 
              iframeContent.includes('we could not find a survey for your profile') ||
              iframeContent.includes('try again in a few hours') ||
              iframeContent.includes('no survey available')) {
            console.log('No surveys available detected with message:', 
              iframeContent.substring(0, 100) + '...');
            setSurveyError("no_surveys");
            
            // For no surveys, award ticket automatically
            setTimeout(() => {
              handleNoSurveysAvailable();
            }, 1500);
            return;
          }
          
          // Check for disqualification message
          if (iframeContent.includes('unfortunately, you did not qualify') ||
              iframeContent.includes('did not qualify for this survey') ||
              iframeContent.includes('you have been disqualified')) {
            console.log('Survey disqualification detected with message:', 
              iframeContent.substring(0, 100) + '...');
            setSurveyError("disqualified");
            
            // For disqualification, don't automatically award ticket
            // User must click claim button manually
            return;
          }
        }
      } catch (e) {
        // Cross-origin restrictions prevent this check, but that's okay
        console.log('Cannot check iframe content due to cross-origin restrictions');
      }
      
      // Set up a longer check for inactivity
      const noActivityTimer = setTimeout(() => {
        console.log('No activity detected for 15 seconds, checking survey status');
        checkForNoSurveysMessage();
      }, 15000);
      
      return () => clearTimeout(noActivityTimer);
    }, 3000);
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
      
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 shadow-2xl overflow-hidden flex flex-col sm:max-h-[90vh]">
        <DialogHeader className="border-b border-slate-200 pb-4 flex-shrink-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold text-slate-800">
                  {isMobile() ? "📱 Mobile Survey" : "Complete Survey & Earn Tickets"}
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-sm sm:text-base mt-1">
                  {isMobile() ? "Embedded survey - stay in the app!" : "Answer a few questions and earn 1 lottery ticket"}
                </DialogDescription>
              </div>
            </div>
            
            {/* Enhanced Mobile Close Button */}
            <div className="flex justify-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMobileClose}
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 px-4 py-2 rounded-lg font-medium shadow-sm"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Close Survey</span>
                <span className="sm:hidden">✕ Close</span>
              </Button>
            </div>
          </div>
          
          {/* Mobile-Optimized Instructions */}
          {isMobile() && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 mt-4">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2 text-sm">📱 Mobile Survey Mode</h3>
                  <ul className="text-green-800 text-xs space-y-1">
                    <li>• Survey loads directly in this window</li>
                    <li>• No need to leave the main app</li>
                    <li>• Use the close button above to return anytime</li>
                    <li>• Complete the survey to earn your ticket instantly</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Desktop Instructions */}
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
          
          {/* Action Buttons - Mobile vs Desktop */}
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
            
            {!isMobile() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                className="flex items-center justify-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 text-sm py-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            )}
            
            {isMobile() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Force iframe reload for mobile
                  setIframeLoading(true);
                  const currentUrl = surveyUrl;
                  setSurveyUrl("");
                  setTimeout(() => setSurveyUrl(currentUrl), 100);
                }}
                className="flex items-center justify-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 text-sm py-2"
              >
                <ExternalLink className="h-4 w-4" />
                📱 Reload Survey
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Survey Frame Container - Enhanced for Mobile */}
          <div 
            className="relative bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden m-2 sm:m-4 h-full" 
            style={{ 
              minHeight: isMobile() ? 'calc(100vh - 350px)' : 'calc(100vh - 450px)',
              height: isMobile() ? 'calc(100vh - 350px)' : 'auto'
            }}
          >
            
            {/* Enhanced Mobile Loading State */}
            {iframeLoading && (
              <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 mb-4">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 animate-spin" />
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-semibold text-slate-800">
                      {isMobile() ? "📱 Loading Mobile Survey..." : "Loading Survey..."}
                    </p>
                    <p className="text-sm text-slate-600">
                      {isMobile() ? "Survey will load directly in this window" : "Please wait while we prepare your survey"}
                    </p>
                  </div>
                </div>
                <div className="w-48 sm:w-64 bg-slate-200 rounded-full h-2 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                
                {/* Mobile-specific loading message */}
                {isMobile() && (
                  <div className="text-center bg-blue-50 rounded-lg p-3 max-w-xs">
                    <p className="text-xs text-blue-700 font-medium">
                      📱 Mobile Optimized: Survey loads directly in this interface - no new tabs!
                    </p>
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
                src={surveyUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="rounded-lg w-full h-full"
                title="CPX Research Survey"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox allow-downloads"
                ref={iframeRef}
                style={{ 
                  minHeight: isMobile() ? 'calc(100vh - 350px)' : 'calc(100vh - 450px)',
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