"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateCPXSurveyURL } from "@/lib/cpx-utils";
import { 
  ExternalLink, 
  X, 
  ClipboardCheck, 
  Shield, 
  Clock,
  CheckCircle2,
  Loader2,
  Monitor,
  Smartphone,
  Info,
  RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";

interface MobileSurveyEmbedProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  onSurveyComplete?: (success?: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const MobileSurveyEmbed = ({ 
  user, 
  onSurveyComplete, 
  isLoading = false,
  disabled = false 
}: MobileSurveyEmbedProps) => {
  const router = useRouter();
  const [surveyUrl, setSurveyUrl] = useState<string>("");
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  useEffect(() => {
    if (user) {
      const url = generateCPXSurveyURL(user);
      setSurveyUrl(url);
    }
  }, [user]);

  const handleOpenEmbedded = () => {
    setIsEmbedded(true);
    setLoading(true);
    
    // Show loading for 2 seconds, then show embed
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    // Start checking for completion
    startCompletionCheck();
  };

  const handleOpenNewTab = () => {
    if (surveyUrl) {
      window.open(surveyUrl, '_blank', 'noopener,noreferrer,width=400,height=600');
      toast.success("🔗 Survey opened in new tab! Complete it to earn your ticket.", {
        duration: 6000,
        icon: "🎫",
        style: {
          border: '2px solid #3b82f6',
          padding: '16px',
          fontSize: '14px',
          maxWidth: '350px',
        },
      });
      
      // Mark as attempted
      if (onSurveyComplete) {
        onSurveyComplete(false);
      }
      
      // Start checking for completion
      startCompletionCheck();
    }
  };

  const startCompletionCheck = () => {
    let attempts = 0;
    const maxAttempts = 30; // Check for 1 minute
    
    const checkCompletion = async () => {
      try {
        attempts++;
        const response = await fetch('/api/tickets/instant-verify');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data.hasNewTickets) {
            setSurveyCompleted(true);
            
            toast.success("🎉 Survey completed! Your ticket has been instantly credited.", {
              duration: 8000,
              style: {
                fontSize: '16px',
                padding: '16px',
                maxWidth: '400px',
                border: '2px solid #22c55e',
                backgroundColor: '#ecfdf5',
              },
            });
            
            if (onSurveyComplete) {
              onSurveyComplete(true);
            }
            
            setTimeout(() => {
              router.refresh();
            }, 2000);
            
            return;
          }
        }
        
        // Continue checking if not completed and haven't exceeded max attempts
        if (attempts < maxAttempts) {
          setTimeout(checkCompletion, 2000);
        }
        
      } catch (error) {
        console.error('Error checking survey completion:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkCompletion, 2000);
        }
      }
    };
    
    // Start checking after a short delay
    setTimeout(checkCompletion, 3000);
  };

  const handleClose = () => {
    setIsEmbedded(false);
    setLoading(false);
    setSurveyCompleted(false);
  };

  if (surveyCompleted) {
    return (
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Success!</h3>
          <p className="text-green-700 mb-4 text-lg">
            Survey completed! Your ticket has been instantly credited.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3"
          >
            🎯 View My Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  if (isEmbedded) {
    return (
      <Card className="p-4 bg-white border-2 border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">📋 Survey</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading your survey...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Mobile-Optimized Survey</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Complete this survey directly in the app for the best mobile experience.
                  </p>
                  <Button
                    onClick={handleOpenNewTab}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Start Survey
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">How it Works</h4>
                  <ul className="text-amber-800 text-sm space-y-1">
                    <li>• Survey opens in a mobile-friendly popup</li>
                    <li>• Takes 2-5 minutes to complete</li>
                    <li>• Ticket is instantly credited upon completion</li>
                    <li>• You'll receive a confirmation notification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="text-center">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg w-fit mx-auto mb-4">
          <ClipboardCheck className="h-8 w-8" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">Mobile Survey Experience</h3>
        <p className="text-slate-600 mb-6">
          Choose your preferred way to complete the survey on mobile
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={handleOpenEmbedded}
            disabled={disabled || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                Optimized Mobile Experience
              </>
            )}
          </Button>
          
          <Button
            onClick={handleOpenNewTab}
            variant="outline"
            disabled={disabled || isLoading}
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 py-3"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>2-5 minutes</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Instant credit</span>
          </div>
        </div>
      </div>
    </Card>
  );
}; 