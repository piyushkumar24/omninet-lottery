"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ClipboardCheck, 
  Share2, 
  Users, 
  Ticket,
  X,
  History,
  Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TicketSource } from "@prisma/client";

interface TicketHistoryModalProps {
  tickets: Array<{
    id: string;
    source: TicketSource;
    isUsed: boolean;
    drawId: string | null;
    createdAt: Date;
  }>;
}

const getSourceIcon = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return <ClipboardCheck className="h-4 w-4 text-indigo-600" />;
    case "SOCIAL":
      return <Share2 className="h-4 w-4 text-indigo-600" />;
    case "REFERRAL":
      return <Users className="h-4 w-4 text-indigo-600" />;
    default:
      return <Ticket className="h-4 w-4 text-indigo-600" />;
  }
};

const getSourceLabel = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return "Survey Completion";
    case "SOCIAL":
      return "Social Media Follow";
    case "REFERRAL":
      return "Friend Invitation";
    default:
      return "Unknown Source";
  }
};

const getSourceBadgeColor = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "SOCIAL":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "REFERRAL":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const TicketHistoryModal = ({ tickets }: TicketHistoryModalProps) => {
  const [open, setOpen] = useState(false);
  
  // Show recent tickets first (latest 3)
  const recentTickets = tickets.slice(0, 3);
  const hasMoreTickets = tickets.length > 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 text-slate-700 font-medium transition-all duration-300 hover:shadow-md"
          onClick={() => setOpen(true)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Complete History
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 shadow-2xl">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <History className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-800">
                Complete Ticket History
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-base mt-1">
                View all your earned tickets and their details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-slate-100">
          {tickets.length > 0 ? (
            <div className="space-y-4 mt-4">
              {tickets.map((ticket, index) => (
                <div 
                  key={ticket.id} 
                  className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-xl ${getSourceBadgeColor(ticket.source)} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}>
                        {getSourceIcon(ticket.source)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg group-hover:text-blue-800 transition-colors">
                            {getSourceLabel(ticket.source)}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Earned on {formatDate(new Date(ticket.createdAt), 'full')}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant="outline"
                            className={`${getSourceBadgeColor(ticket.source)} font-medium`}
                          >
                            {ticket.source}
                          </Badge>
                          
                          <Badge 
                            variant="outline"
                            className="bg-blue-100 text-blue-700 border-blue-300 font-medium"
                          >
                            Applied to Lottery
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {ticket.drawId && (
                          <div className="flex items-center gap-2 text-sm">
                            <Ticket className="h-4 w-4 text-blue-600" />
                            <span className="text-slate-600">
                              Used in draw: 
                              <span className="font-mono text-blue-600 ml-1">
                                {ticket.drawId.substring(0, 8)}...
                              </span>
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-600">
                            Ticket ID: 
                            <span className="font-mono text-slate-500 ml-1">
                              {ticket.id.substring(0, 12)}...
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Ticket className="h-8 w-8 text-slate-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Tickets Yet</h3>
              <p className="text-slate-500">
                You haven&apos;t earned any tickets yet. Complete surveys, invite friends, or follow us on social media to start earning!
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Total tickets: <span className="font-semibold text-blue-600">{tickets.length}</span>
          </p>
          
          <Button
            onClick={() => setOpen(false)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 