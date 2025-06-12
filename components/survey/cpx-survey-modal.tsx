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
}

export const CPXSurveyModal = ({ 
  user, 
  onSurveyComplete, 
  isLoading = false,
  disabled = false,
  nonWinnerToken
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

  // Award fallback ticket - declared early for dependencies
  const awardFallbackTicket = useCallback(async () => {
    try {
      console.log('🔄 Trying fallback ticket award...');
      setVerifyingTicket(true);
      
      const fallbackResponse = await fetch('/api/tickets/force-award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('✅ Fallback ticket award successful:', fallbackData);
        
        setTicketAwarded(true);
        setTicketId(fallbackData.data?.ticketId);
        
        setTimeout(() => {
          router.refresh();
        }, 1000);
        
        return true;
      } else {
        console.error('❌ Fallback ticket award failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error in fallback ticket award:', error);
      return false;
    } finally {
      setVerifyingTicket(false);
    }
  }, [router]);

  // Award participation ticket function
  const awardParticipationTicket = useCallback(async () => {
    try {
      console.log('🎫 Attempting to award participation ticket...');
      
      // Add non-winner token to the request URL if available
      const url = nonWinnerToken 
        ? `/api/survey/complete?token=${nonWinnerToken}`
        : '/api/survey/complete';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Participation ticket successfully awarded:', data);
        
        const ticketMessage = data.data?.ticketCount === 2 || data.bonusTickets
          ? "🎉 2 LOTTERY TICKETS awarded for completing the survey!"
          : "🎫 1 LOTTERY TICKET awarded for completing the survey!";
        
        toast.success(ticketMessage, {
          duration: 5000,
        });

        // Store notification data for dashboard wrapper
        localStorage.setItem('ticket_awarded', JSON.stringify({
          source: 'SURVEY',
          count: data.data?.ticketCount || (data.bonusTickets ? 2 : 1),
        }));

        setShowTicketReward(true);
        setTicketAwarded(true);
        setTicketId(data.data?.ticketId || data.data?.ticketIds?.[0]);
        
        setTimeout(() => {
          if (onSurveyComplete) {
            onSurveyComplete(true);
          }
          // Force refresh dashboard to show updated ticket count
          router.refresh();

          // Trigger notification after refresh
          setTimeout(() => {
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'ticket_awarded',
              newValue: JSON.stringify({
                source: 'SURVEY',
                count: data.data?.ticketCount || (data.bonusTickets ? 2 : 1),
              }),
            }));
          }, 500);
        }, 1500);
      } else {
        console.error('❌ Failed to award participation ticket:', data.message);
        
        // Show success toast anyway to prevent user confusion
        toast.success("🎫 1 LOTTERY TICKET will be awarded shortly!", {
          duration: 4000,
        });
        setShowTicketReward(true);
        
        // Try fallback ticket award through verification endpoint
        console.log('🔄 Trying fallback ticket award method...');
        await awardFallbackTicket();
        
        setTimeout(() => {
          if (onSurveyComplete) {
            onSurveyComplete(true);
          }
          router.refresh();
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Error awarding participation ticket:', error);
      
      // Show success toast anyway to prevent user confusion
      toast.success("🎫 1 LOTTERY TICKET will be awarded shortly!", {
        duration: 4000,
      });
      setShowTicketReward(true);
      
      // Try fallback ticket award
      console.log('🔄 Trying fallback ticket award after error...');
      await awardFallbackTicket();
      
      setTimeout(() => {
        if (onSurveyComplete) {
          onSurveyComplete(true);
        }
        router.refresh();
      }, 1500);
    }
  }, [nonWinnerToken, onSurveyComplete, router, awardFallbackTicket]);

  // Special handler for when no surveys are available
  const handleNoSurveysAvailable = useCallback(async () => {
    try {
      console.log('🔍 No surveys available, forcing ticket award...');
      
      // Call the special force-award endpoint
      const response = await fetch('/api/survey/force-award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'no_surveys_available'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Force ticket award successful:', data);
        
        toast.success("🎫 1 LOTTERY TICKET awarded for participation!", {
          duration: 4000,
        });
        setShowTicketReward(true);
        setTicketAwarded(true);
        setTicketId(data.data?.ticketId);
        
        setTimeout(() => {
          if (onSurveyComplete) {
            onSurveyComplete(true);
          }
          // Force refresh dashboard to show updated ticket count
          router.refresh();
          
          // Second refresh after a delay to ensure UI is updated
          setTimeout(() => {
            router.refresh();
          }, 2000);
        }, 1500);
      } else {
        console.error('❌ Force ticket award failed:', data.message);
        
        // Try force-award endpoint as a last resort
        console.log('🔄 Trying emergency force award method...');
        const forceResponse = await fetch('/api/tickets/force-award', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const forceData = await forceResponse.json();
        
        if (forceData.success) {
          console.log('✅ Emergency force ticket award successful:', forceData);
          toast.success("🎫 Lottery ticket awarded through backup method!", {
            duration: 4000,
          });
          setShowTicketReward(true);
          setTicketAwarded(true);
          setTicketId(forceData.data?.ticketId);
          
          setTimeout(() => {
            if (onSurveyComplete) {
              onSurveyComplete(true);
            }
            router.refresh();
            
            setTimeout(() => {
              router.refresh();
            }, 2000);
          }, 1500);
          
          return;
        }
        
        // If all else fails, try regular award as fallback
        await awardParticipationTicket();
      }
    } catch (error) {
      console.error('❌ Error in force ticket award:', error);
      
      // Try emergency force award
      try {
        console.log('🔄 Trying emergency force award after error...');
        const emergencyResponse = await fetch('/api/tickets/force-award', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (emergencyResponse.ok) {
          const emergencyData = await emergencyResponse.json();
          console.log('✅ Emergency force ticket successful:', emergencyData);
          
          toast.success("🎫 Lottery ticket awarded through emergency method!", {
            duration: 4000,
          });
          setShowTicketReward(true);
          setTicketAwarded(true);
          setTicketId(emergencyData.data?.ticketId);
          
          setTimeout(() => {
            if (onSurveyComplete) {
              onSurveyComplete(true);
            }
            router.refresh();
            
            setTimeout(() => {
              router.refresh();
            }, 2000);
          }, 1500);
          
          return;
        }
      } catch (emergencyError) {
        console.error('❌ Emergency force award failed:', emergencyError);
      }
      
      // Fall back to regular ticket award as last resort
      await awardParticipationTicket();
    }
  }, [awardParticipationTicket, onSurveyComplete, router]);

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

  // Verify ticket was awarded
  const verifyTicketAwarded = useCallback(async () => {
    try {
      setVerifyingTicket(true);
      
      // First check using verify-all endpoint for accurate ticket information
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
          console.log('⚠️ No survey tickets found during verification');
        }
      }
      
      // If verification fails or no tickets found, try to award a ticket manually
      return await awardFallbackTicket();
    } catch (error) {
      console.error('Error verifying ticket:', error);
      return await awardFallbackTicket();
    } finally {
      setVerifyingTicket(false);
    }
  }, [awardFallbackTicket, onSurveyComplete]);

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

  const handleOpenInNewTab = () => {
    if (surveyUrl) {
      window.open(surveyUrl, '_blank', 'noopener,noreferrer');
      toast.success("Survey opened in new tab!");
    }
  };

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

  const handleClose = async () => {
    // Ensure we mark this as a survey attempt even if modal is closed
    if (!showTicketReward && onSurveyComplete) {
      onSurveyComplete(false);
    }
    
    // Only try to award if not already showing reward
    if (!showTicketReward) {
      try {
        console.log('🎫 Attempting to award participation ticket on close...');
        
        // Add non-winner token to the request URL if available
        const url = nonWinnerToken 
          ? `/api/survey/complete?token=${nonWinnerToken}`
          : '/api/survey/complete';
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Participation ticket successfully awarded:', data);
          
          const ticketMessage = data.bonusTickets 
            ? "🎉 2 BONUS tickets awarded!"
            : "🎫 Lottery ticket awarded!";
          
          toast.success(ticketMessage, {
            duration: 4000,
          });
          setShowTicketReward(true);
          setTicketAwarded(true);
          setTicketId(data.data?.ticketId || data.data?.ticketIds?.[0]);
          
          // Allow time for ticket reward message to be seen
          setTimeout(() => {
            setIsOpen(false);
            
            // Force refresh to show updated ticket count
            router.refresh();
            
            // Second refresh after a delay to ensure UI is updated
            setTimeout(() => {
              if (onSurveyComplete) {
                onSurveyComplete(true);
              }
            }, 1000);
          }, 2000);
          
          return; // Exit early since we're handling the close with a delay
        } else {
          console.error('❌ Failed to award participation ticket:', data.message);
          
          // Try fallback method
          console.log('🔄 Trying force award method...');
          const forceResponse = await fetch('/api/tickets/force-award', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const forceData = await forceResponse.json();
          
          if (forceData.success) {
            console.log('✅ Force ticket award successful:', forceData);
            toast.success("🎫 Lottery ticket awarded through backup method!", {
              duration: 4000,
            });
            
            // Close after a delay
            setTimeout(() => {
              setIsOpen(false);
              router.refresh();
              
              setTimeout(() => {
                if (onSurveyComplete) {
                  onSurveyComplete(true);
                }
              }, 1000);
            }, 2000);
            
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error awarding participation ticket:', error);
      }
    }
    
    // If we reach here, either ticket was already awarded or fallbacks failed
    setIsOpen(false);
    setIframeLoading(true);
    setSurveyError(null);
    setRetryCount(0);
    setShowTicketReward(false);
    
    // Force refresh to show updated ticket count in case a ticket was awarded
    router.refresh();
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
          
          // Award ticket on successful completion
          awardParticipationTicket();
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
            
            // Award ticket on successful completion
            awardParticipationTicket();
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200 pb-4 flex-shrink-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold text-slate-800">
                  Complete Survey & Earn Tickets
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-sm sm:text-base mt-1">
                  Answer a few questions and earn 1 lottery ticket
                </DialogDescription>
              </div>
            </div>
            
            {/* Mobile Close Button */}
            <div className="flex justify-center sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
          
          {/* How it Works - Always at top */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4 mt-4">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">📋 How it Works</h3>
                <ul className="text-blue-800 text-xs sm:text-sm space-y-1">
                  <li>• Complete the survey questions honestly and thoroughly</li>
                  <li>• Survey typically takes 2-5 minutes to complete</li>
                  <li>• You'll earn 1 lottery ticket upon completion</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Centered below How it Works */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center justify-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            
            {/* Desktop Close Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="hidden sm:flex items-center justify-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 text-sm"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Survey Frame Container */}
          <div className="relative bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden m-4" style={{ minHeight: 'calc(100vh - 400px)' }}>
            {iframeLoading && (
              <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
                  <div className="text-center sm:text-left">
                    <p className="text-base sm:text-lg font-semibold text-slate-800">Loading Survey...</p>
                    <p className="text-sm text-slate-600">Please wait while we prepare your survey</p>
                  </div>
                </div>
                <div className="w-48 sm:w-64 bg-slate-200 rounded-full h-2 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}

            {/* Ticket Reward Success State */}
            {showTicketReward && (
              <div className="absolute inset-0 bg-green-50 z-20 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-md">
                  <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">Ticket Awarded!</h3>
                  <p className="text-green-700 mb-4 text-sm sm:text-base">
                    🎫 You&apos;ve successfully earned 1 lottery ticket!
                  </p>
                  <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-green-200">
                    <p className="text-green-800 font-semibold text-sm sm:text-base">
                      Your ticket has been automatically added to the current lottery draw.
                    </p>
                    {verifyingTicket && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-amber-600">
                        <RotateCw className="h-4 w-4 animate-spin" />
                        Verifying ticket was credited...
                      </div>
                    )}
                    {ticketAwarded && !verifyingTicket && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Ticket confirmed: {ticketId?.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error States - Mobile Optimized */}
            {surveyError === "no_surveys" && (
              <div className="absolute inset-0 bg-amber-50 z-10 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-md">
                  <Info className="h-10 w-10 sm:h-12 sm:w-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">No Surveys Available Right Now</h3>
                  <p className="text-amber-700 mb-4 text-sm sm:text-base">
                    No worries! Even though there are no surveys available at the moment, 
                    you&apos;ll still receive a lottery ticket for your participation attempt.
                  </p>
                  <div className="space-y-3 w-full">
                    <Button onClick={handleNoSurveysAvailable} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base">
                      <Ticket className="h-4 w-4 mr-2" />
                      Claim Your Ticket
                    </Button>
                    <Button onClick={handleRetry} variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 text-sm sm:text-base">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again Later
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {surveyError === "disqualified" && (
              <div className="absolute inset-0 bg-orange-50 z-10 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-orange-800 mb-2">Survey Not Completed</h3>
                  <p className="text-orange-700 mb-4 text-sm sm:text-base">
                    You didn&apos;t qualify for this survey or were screened out during the process. 
                    This happens sometimes based on the survey&apos;s specific requirements.
                  </p>
                  <div className="space-y-3 w-full">
                    <Button onClick={handleNoSurveysAvailable} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base">
                      <Ticket className="h-4 w-4 mr-2" />
                      Still Want a Ticket? Click Here
                    </Button>
                    <Button onClick={handleRetry} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 text-sm sm:text-base">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try a Different Survey
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {surveyError === "loading_failed" && (
              <div className="absolute inset-0 bg-red-50 z-10 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Survey Failed to Load</h3>
                  <p className="text-red-700 mb-4 text-sm sm:text-base">
                    There was a problem loading the survey. You can try again or claim a ticket anyway.
                  </p>
                  <div className="space-y-3 w-full">
                    <Button onClick={handleNoSurveysAvailable} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base">
                      <Ticket className="h-4 w-4 mr-2" />
                      Claim Your Ticket
                    </Button>
                    <Button onClick={handleRetry} variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50 text-sm sm:text-base">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Loading
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {surveyUrl && !surveyError && !showTicketReward && (
              <iframe
                src={surveyUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="rounded-lg min-h-[400px] sm:min-h-[600px]"
                title="CPX Research Survey"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                ref={iframeRef}
                style={{ minHeight: 'calc(100vh - 400px)' }}
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