"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Home, CheckCircle2 } from "lucide-react";

export const MobileReturnButton = () => {
  const router = useRouter();
  const [showReturnButton, setShowReturnButton] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  useEffect(() => {
    // Check if user came from mobile survey
    const surveyMode = sessionStorage.getItem('survey_mode');
    const returnUrl = sessionStorage.getItem('survey_return_url');
    
    if (surveyMode === 'mobile' && returnUrl) {
      setShowReturnButton(true);
      
      // Check if survey was completed
      checkSurveyCompletion();
    }
  }, []);

  const checkSurveyCompletion = async () => {
    try {
      const response = await fetch('/api/tickets/instant-verify');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.hasNewTickets) {
          setSurveyCompleted(true);
        }
      }
    } catch (error) {
      console.error('Error checking survey completion:', error);
    }
  };

  const handleReturnToDashboard = () => {
    // Clean up session storage
    sessionStorage.removeItem('survey_mode');
    sessionStorage.removeItem('survey_return_url');
    
    // Navigate back to dashboard
    router.push('/dashboard');
  };

  if (!showReturnButton) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden">
      <Card className="p-4 bg-white border-2 border-blue-200 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {surveyCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Home className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {surveyCompleted ? "✅ Survey Complete!" : "Return to Dashboard"}
              </p>
              <p className="text-xs text-slate-600">
                {surveyCompleted ? "Your ticket has been credited" : "Tap to go back to main app"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleReturnToDashboard}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}; 