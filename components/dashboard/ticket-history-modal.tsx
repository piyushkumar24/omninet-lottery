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
  Eye,
  Check,
  Calendar
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
    confirmationCode?: string | null;
  }>;
  children?: React.ReactNode;
}

const getSourceIcon = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return <ClipboardCheck className="h-4 w-4 text-indigo-600" />;
    case "SOCIAL":
      return <Share2 className="h-4 w-4 text-indigo-600" />;
    case "REFERRAL":
      return <Users className="h-4 w-4 text-green-600" />;
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
      return "Referral Reward";
    default:
      return "Unknown Source";
  }
};

const getSourceDescription = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return "Earned by completing a survey";
    case "SOCIAL":
      return "Earned by following on social media";
    case "REFERRAL":
      return "Earned when a friend completed their first survey";
    default:
      return "Ticket from unknown source";
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

export const TicketHistoryModal = ({ tickets, children }: TicketHistoryModalProps) => {
  const [open, setOpen] = useState(false);
  
  // Count tickets by source
  const surveyTickets = tickets.filter(t => t.source === "SURVEY").length;
  const socialTickets = tickets.filter(t => t.source === "SOCIAL").length;
  const referralTickets = tickets.filter(t => t.source === "REFERRAL").length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 text-slate-700 font-medium transition-all duration-300 hover:shadow-md"
            onClick={() => setOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Complete History
          </Button>
        )}
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

        {/* Ticket Summary */}
        <div className="grid grid-cols-3 gap-4 my-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-blue-800">{surveyTickets}</p>
            <p className="text-sm text-blue-600">Survey Tickets</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Share2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-purple-800">{socialTickets}</p>
            <p className="text-sm text-purple-600">Social Tickets</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-green-800">{referralTickets}</p>
            <p className="text-sm text-green-600">Referral Tickets</p>
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-slate-100">
          {tickets.length > 0 ? (
            <div className="space-y-4">
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
                            {getSourceDescription(ticket.source)}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(new Date(ticket.createdAt), 'full')}
                            </span>
                            {ticket.confirmationCode && (
                              <span className="flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                Code: {ticket.confirmationCode}
                              </span>
                            )}
                          </div>
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
                            className="bg-blue-100 text-blue-700 border-blue-300 font-medium flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Applied to Lottery
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <Ticket className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700">No Tickets Found</p>
              <p className="text-sm text-slate-500 mt-2">
                You haven&apos;t earned any tickets yet. Complete surveys and invite friends to earn tickets!
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