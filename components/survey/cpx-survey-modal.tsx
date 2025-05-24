"use client";

import { useState, useEffect } from "react";
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
import { 
  ExternalLink, 
  X, 
  ClipboardCheck, 
  Shield, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Monitor
} from "lucide-react";
import { toast } from "react-hot-toast";

interface CPXSurveyModalProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  onSurveyComplete?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const CPXSurveyModal = ({ 
  user, 
  onSurveyComplete, 
  isLoading = false,
  disabled = false 
}: CPXSurveyModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [surveyUrl, setSurveyUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && user) {
      const url = generateCPXSurveyURL(user);
      setSurveyUrl(url);
      setIframeLoading(true);
    }
  }, [isOpen, user]);

  const handleOpenInNewTab = () => {
    if (surveyUrl) {
      window.open(surveyUrl, '_blank', 'noopener,noreferrer');
      toast.success("Survey opened in new tab!");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIframeLoading(true);
    if (onSurveyComplete) {
      onSurveyComplete();
    }
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          disabled={isLoading || disabled}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
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
      
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  Complete Survey & Earn Tickets
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-base mt-1">
                  Answer a few questions and earn lottery tickets instantly
                </DialogDescription>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">📋 How it Works</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Complete the survey questions honestly and thoroughly</li>
                  <li>• Survey typically takes 3-10 minutes to complete</li>
                  <li>• You'll automatically earn 1 lottery ticket upon completion</li>
                  <li>• You'll be redirected back to your dashboard when finished</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Survey Frame Container */}
          <div className="relative bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
            {iframeLoading && (
              <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-lg font-semibold text-slate-800">Loading Survey...</p>
                    <p className="text-sm text-slate-600">Please wait while we prepare your survey</p>
                  </div>
                </div>
                <div className="w-64 bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
            
            {surveyUrl && (
              <iframe
                src={surveyUrl}
                width="100%"
                height="600px"
                frameBorder="0"
                onLoad={handleIframeLoad}
                className="rounded-lg"
                title="CPX Research Survey"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
              />
            )}
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium text-sm">Secure Platform</p>
                <p className="text-green-700 text-xs">Protected by CPX Research</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium text-sm">Quick Completion</p>
                <p className="text-blue-700 text-xs">Usually 3-10 minutes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Monitor className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-purple-800 font-medium text-sm">Any Device</p>
                <p className="text-purple-700 text-xs">Desktop, tablet, or mobile</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">⚡ Important Notice</p>
                <p className="text-amber-800 text-sm">
                  Complete the entire survey to earn your ticket. Closing this window early will not award any tickets. 
                  Your progress is automatically saved by CPX Research.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Having issues? Try opening the survey in a new tab.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleOpenInNewTab}
              className="border-slate-300 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              New Tab
            </Button>
            
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 