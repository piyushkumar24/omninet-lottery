"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertCircle, Wrench, AlertTriangle } from "lucide-react";

interface TicketDebugProps {
  userId: string;
  initialTicketCount: number;
}

export const TicketDebug = ({ userId, initialTicketCount }: TicketDebugProps) => {
  const [ticketCount, setTicketCount] = useState(initialTicketCount);
  const [participationCount, setParticipationCount] = useState<number | null>(null);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshTime, setRefreshTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixingTickets, setFixingTickets] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  const refreshTicketCount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/tickets/verify-all?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketCount(data.data.totalTickets);
        setParticipationCount(data.data.participationTotal);
        setHasDiscrepancy(data.data.hasDiscrepancy);
        setRefreshTime(new Date().toLocaleTimeString());
        setRecentTickets(data.data.recentTickets || []);
        
        if (data.data.totalTickets !== initialTicketCount) {
          console.log(`[${timestamp}] Ticket count changed:`, {
            before: initialTicketCount, 
            after: data.data.totalTickets
          });
        }
        
        // Auto-fix discrepancies if they exist
        if (data.data.hasDiscrepancy) {
          setError("Ticket count discrepancy detected between database and admin panel");
        }
      } else {
        setError("Failed to refresh ticket count");
      }
    } catch (err) {
      setError("Error fetching ticket count");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fixTickets = async () => {
    try {
      setFixingTickets(true);
      setError(null);
      
      // Add a timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/tickets/verify-all?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFixResult(data);
        
        // Refresh ticket count after fixing
        await refreshTicketCount();
        
        // If any fixes were made, we show a success message
        if (data.data.fixedDraws?.length > 0 || data.data.fixedTickets?.length > 0) {
          setError("Fixed ticket issues. The page will now reload to see updated count.");
          
          // Auto-reload the page after 3 seconds to ensure everything is updated
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setError(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fix tickets");
      }
    } catch (err) {
      setError("Error fixing tickets");
      console.error(err);
    } finally {
      setFixingTickets(false);
    }
  };

  const forceAwardTicket = async () => {
    try {
      setFixingTickets(true);
      setError(null);
      
      // Add a timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/tickets/verify?t=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Refresh ticket count after awarding
        await refreshTicketCount();
        
        setError("Emergency ticket awarded. The page will now reload to see updated count.");
        
        // Auto-reload the page after 3 seconds to ensure everything is updated
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to award emergency ticket");
      }
    } catch (err) {
      setError("Error awarding emergency ticket");
      console.error(err);
    } finally {
      setFixingTickets(false);
    }
  };

  useEffect(() => {
    // Set initial refresh time
    setRefreshTime(new Date().toLocaleTimeString());
    
    // Initial refresh of ticket count
    refreshTicketCount();
  }, []);

  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-blue-800">Ticket Verification</h3>
        {refreshTime && (
          <Badge variant="outline" className="text-xs font-normal bg-white border-blue-200 text-blue-600">
            Last updated: {refreshTime}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasDiscrepancy ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : error ? (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="text-blue-700">
            Current ticket count: <strong>{ticketCount}</strong>
            {participationCount !== null && (
              <span className={hasDiscrepancy ? "text-amber-600 ml-1" : "text-gray-500 ml-1"}>
                {hasDiscrepancy ? "(admin panel shows: " : "(in admin panel: "}
                <strong>{participationCount}</strong>
                {hasDiscrepancy ? ")" : ")"}
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshTicketCount}
            disabled={loading}
            className="h-7 px-2 py-0 text-xs border-blue-200 hover:bg-blue-100"
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="ml-1">Refresh</span>
          </Button>
          
          <Button 
            size="sm" 
            variant={hasDiscrepancy ? "default" : "outline"}
            onClick={fixTickets}
            disabled={fixingTickets}
            className={hasDiscrepancy 
              ? "h-7 px-2 py-0 text-xs bg-amber-500 hover:bg-amber-600"
              : "h-7 px-2 py-0 text-xs border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
            }
          >
            {fixingTickets ? (
              <Wrench className="h-3 w-3 animate-spin" />
            ) : (
              <Wrench className="h-3 w-3" />
            )}
            <span className="ml-1">Fix Issues</span>
          </Button>
        </div>
      </div>
      
      {hasDiscrepancy && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
          <p className="font-medium">
            <AlertTriangle className="h-3 w-3 inline-block mr-1" />
            Discrepancy detected between database and admin panel
          </p>
          <p className="mt-1">
            Click &quot;Fix Issues&quot; to synchronize ticket counts and repair any inconsistencies.
          </p>
        </div>
      )}
      
      {ticketCount === 0 && (
        <div className="mt-2">
          <Button 
            size="sm" 
            variant="default"
            onClick={forceAwardTicket}
            disabled={fixingTickets}
            className="w-full h-8 px-2 py-0 text-xs bg-green-600 hover:bg-green-700"
          >
            Award Emergency Ticket
          </Button>
        </div>
      )}
      
      {error && !hasDiscrepancy && (
        <p className="text-xs text-amber-600 mt-1">{error}</p>
      )}
      
      {fixResult && (fixResult.data.fixedDraws?.length > 0 || fixResult.data.fixedTickets?.length > 0) && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-xs text-green-700">
          <p className="font-medium">Fixes applied:</p>
          <ul className="list-disc list-inside mt-1">
            {fixResult.data.fixedDraws?.map((fix: any, index: number) => (
              <li key={`draw-${index}`}>
                {fix.action === 'created' && `Created participation with ${fix.ticketCount} tickets`}
                {fix.action === 'updated' && `Updated ticket count from ${fix.oldCount} to ${fix.newCount}`}
                {fix.action === 'deleted_orphaned' && `Removed orphaned participation with ${fix.oldCount} tickets`}
                {fix.action === 'emergency_ticket_awarded' && 'Awarded emergency ticket'}
              </li>
            ))}
            {fixResult.data.fixedTickets?.map((fix: any, index: number) => (
              <li key={`ticket-${index}`}>
                {fix.action === 'reset_ticket' && `Reset ticket ${fix.ticketId.substring(0, 8)}...`}
                {fix.action === 'applied_ticket' && `Applied ticket ${fix.ticketId.substring(0, 8)}... to current draw`}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-green-600 font-medium">
            The page will reload in 3 seconds to apply changes...
          </p>
        </div>
      )}
      
      {recentTickets.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-blue-800 mb-1">Recent Tickets:</h4>
          <div className="max-h-24 overflow-y-auto bg-white/70 rounded-md border border-blue-200 p-1">
            {recentTickets.map((ticket, index) => (
              <div key={ticket.id} className="text-xs p-1 flex justify-between items-center">
                <span className="text-blue-700">
                  {ticket.source} ticket {ticket.isUsed ? "(used)" : "(available)"}
                </span>
                <span className="text-gray-500">{ticket.timeAgo}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 