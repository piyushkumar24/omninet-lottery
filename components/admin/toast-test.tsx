"use client";

import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

export const ToastTest = () => {
  const showSuccessToast = () => {
    toast.success("Success! This toast should be visible above the navbar.", {
      duration: 4000,
      icon: "✅",
      style: {
        border: '2px solid #22c55e',
        padding: '16px',
        fontSize: '14px',
      },
    });
  };

  const showErrorToast = () => {
    toast.error("Error! This toast should also be visible above the navbar.", {
      duration: 4000,
      icon: "❌",
      style: {
        border: '2px solid #ef4444',
        padding: '16px',
        fontSize: '14px',
      },
    });
  };

  const showInfoToast = () => {
    toast("Info: Testing toast visibility with navbar.", {
      duration: 4000,
      icon: "ℹ️",
      style: {
        border: '2px solid #3b82f6',
        padding: '16px',
        fontSize: '14px',
        backgroundColor: '#eff6ff',
        color: '#1e40af',
      },
    });
  };

  const showWarningToast = () => {
    toast("⚠️ Warning: This is a warning toast message.", {
      duration: 4000,
      icon: "⚠️",
      style: {
        border: '2px solid #f59e0b',
        padding: '16px',
        fontSize: '14px',
        backgroundColor: '#fffbeb',
        color: '#92400e',
      },
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Toast Notification Test</h3>
      <p className="text-sm text-slate-600 mb-4">
        Test toast notifications to ensure they appear above the navbar correctly.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          onClick={showSuccessToast}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          size="sm"
        >
          <CheckCircle className="h-4 w-4" />
          Success
        </Button>
        
        <Button 
          onClick={showErrorToast}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          size="sm"
        >
          <XCircle className="h-4 w-4" />
          Error
        </Button>
        
        <Button 
          onClick={showInfoToast}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          size="sm"
        >
          <Info className="h-4 w-4" />
          Info
        </Button>
        
        <Button 
          onClick={showWarningToast}
          className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
          size="sm"
        >
          <AlertTriangle className="h-4 w-4" />
          Warning
        </Button>
      </div>
    </div>
  );
}; 