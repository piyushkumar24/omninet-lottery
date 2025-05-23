"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, X } from "lucide-react";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessPopup = ({ isOpen, onClose }: SuccessPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white border-0 shadow-2xl">
        {/* Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>

        <div className="text-center space-y-6 py-4">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>

          {/* Header */}
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2">
              🎉 You&apos;re almost there!
            </DialogTitle>
          </DialogHeader>

          {/* Email Icon */}
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>

          {/* Message */}
          <div className="space-y-4 text-slate-600">
            <DialogDescription className="text-base leading-relaxed">
              We&apos;ve just sent you a confirmation email.
            </DialogDescription>
            
            <DialogDescription className="text-base leading-relaxed">
              📩 Please check your inbox (or spam) and click the link to activate your account.
            </DialogDescription>
            
            <DialogDescription className="text-base leading-relaxed">
              Once confirmed, you&apos;ll get instant access to your personal dashboard and start earning tickets!
            </DialogDescription>
          </div>

          {/* Support Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600">
              <strong>Having trouble?</strong> Check your spam folder or contact{" "}
              <a 
                href="mailto:support@0mninet.com" 
                className="text-blue-600 hover:text-blue-700 underline"
              >
                support@0mninet.com
              </a>
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-3 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 