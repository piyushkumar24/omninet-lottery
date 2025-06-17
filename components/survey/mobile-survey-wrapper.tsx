"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Home, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

interface MobileSurveyWrapperProps {
  children: React.ReactNode;
}

export const MobileSurveyWrapper = ({ children }: MobileSurveyWrapperProps) => {
  const router = useRouter();
  const [isMobileSurveyMode, setIsMobileSurveyMode] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>("");

  useEffect(() => {
    // Check if user is in mobile survey mode
    const surveyMode = sessionStorage.getItem('survey_mode');
    const storedReturnUrl = sessionStorage.getItem('survey_return_url');
    
    if (surveyMode === 'mobile' && storedReturnUrl) {
      setIsMobileSurveyMode(true);
      setReturnUrl(storedReturnUrl);
    }
  }, []);

  const handleReturnToDashboard = () => {
    // Clean up session storage
    sessionStorage.removeItem('survey_mode');
    sessionStorage.removeItem('survey_return_url');
    
    // Show return message
    toast.success("📱 Returning to dashboard...", {
      duration: 2000,
      style: {
        fontSize: '16px',
        padding: '16px',
        maxWidth: '300px',
      },
    });
    
    // Navigate back
    setTimeout(() => {
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        router.push('/dashboard');
      }
    }, 500);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Only show wrapper for mobile survey mode
  if (!isMobileSurveyMode) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Survey Header */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-blue-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800 text-sm">Survey in Progress</h1>
              <p className="text-xs text-slate-600">Complete to earn lottery ticket</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleReturnToDashboard}
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden xs:inline">Back</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Survey Content */}
      <div className="relative">
        {children}
      </div>

      {/* Mobile Survey Footer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-200 p-3 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-700 font-medium">Survey Active</span>
          </div>
          
          <Button
            onClick={handleReturnToDashboard}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4"
          >
            <Home className="h-4 w-4 mr-1" />
            Return to App
          </Button>
        </div>
      </div>
    </div>
  );
}; 