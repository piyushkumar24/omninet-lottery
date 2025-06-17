"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { 
  Bug, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Copy,
  RefreshCw
} from "lucide-react";

interface CPXDebugPanelProps {
  userId: string;
}

export const CPXDebugPanel = ({ userId }: CPXDebugPanelProps) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/cpx-test');
      const data = await response.json();
      
      if (data.success) {
        setDebugInfo(data);
        toast.success("Debug info loaded successfully");
      } else {
        toast.error(`Debug test failed: ${data.message}`);
      }
    } catch (error) {
      toast.error("Failed to run debug test");
      console.error('Debug test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runManualTest = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/debug/cpx-test', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("✅ Manual test successful! Check your dashboard for the new ticket.");
        // Refresh the page to show new ticket
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`❌ Manual test failed: ${data.message}`);
      }
    } catch (error) {
      toast.error("Failed to run manual test");
      console.error('Manual test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          CPX Debug Panel (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runDebugTest}
            disabled={loading}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Bug className="h-4 w-4 mr-2" />
                Run Debug Test
              </>
            )}
          </Button>
          
          <Button
            onClick={runManualTest}
            disabled={testing || !debugInfo}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Test Postback
              </>
            )}
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-3 text-sm">
            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold text-orange-800 mb-2">User Info</h4>
              <div className="space-y-1 text-gray-700">
                <p><strong>ID:</strong> {debugInfo.debug_info.user.id}</p>
                <p><strong>Email:</strong> {debugInfo.debug_info.user.email}</p>
                <p><strong>Current Tickets:</strong> {debugInfo.debug_info.user.currentTickets}</p>
                <p><strong>Total Earned:</strong> {debugInfo.debug_info.user.totalEarned}</p>
                <p><strong>Survey Tickets:</strong> {debugInfo.debug_info.user.surveyTickets}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold text-orange-800 mb-2">URLs & Security</h4>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Postback URL:</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-gray-100 p-1 rounded flex-1">
                      {debugInfo.debug_info.urls.postbackEndpoint}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(debugInfo.debug_info.urls.postbackEndpoint)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium">Expected Hash:</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-gray-100 p-1 rounded flex-1">
                      {debugInfo.debug_info.security.expectedHash}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(debugInfo.debug_info.security.expectedHash)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <h4 className="font-semibold text-orange-800 mb-2">Manual Test Command</h4>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-gray-100 p-1 rounded flex-1 font-mono">
                  {debugInfo.debug_info.test.manualTestCommand}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(debugInfo.debug_info.test.manualTestCommand)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {debugInfo.debug_info.recent_activity.transactions.length > 0 && (
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold text-orange-800 mb-2">Recent Transactions</h4>
                <div className="space-y-1">
                  {debugInfo.debug_info.recent_activity.transactions.map((t: any, i: number) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium">{t.key}</span> - {t.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo.debug_info.recent_activity.errors.length > 0 && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Recent Errors</h4>
                <div className="space-y-1">
                  {debugInfo.debug_info.recent_activity.errors.map((e: any, i: number) => (
                    <div key={i} className="text-xs text-red-700">
                      <span className="font-medium">{e.key}</span> - {e.error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 