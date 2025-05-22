"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClipboardList, Users, Share2 } from "lucide-react";

interface EarnTicketsProps {
  userId: string;
  hasSurveyTicket: boolean;
}

export const EarnTickets = ({ userId, hasSurveyTicket }: EarnTicketsProps) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Earn Tickets</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 border rounded-md bg-slate-50">
          <div className="bg-indigo-100 p-2 rounded-full">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Complete Surveys</h3>
            <p className="text-sm text-slate-500">Answer questions to earn tickets</p>
          </div>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
          >
            Start
          </button>
        </div>
        
        <div className={`flex items-center gap-4 p-4 border rounded-md ${!hasSurveyTicket ? 'bg-slate-100 opacity-75' : 'bg-slate-50'}`}>
          <div className="bg-indigo-100 p-2 rounded-full">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Invite Friends</h3>
            <p className="text-sm text-slate-500">Earn tickets when friends join</p>
          </div>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            disabled={!hasSurveyTicket}
          >
            Invite
          </button>
        </div>
        
        <div className={`flex items-center gap-4 p-4 border rounded-md ${!hasSurveyTicket ? 'bg-slate-100 opacity-75' : 'bg-slate-50'}`}>
          <div className="bg-indigo-100 p-2 rounded-full">
            <Share2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Follow on Social Media</h3>
            <p className="text-sm text-slate-500">One-time tickets for following us</p>
          </div>
          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            disabled={!hasSurveyTicket}
          >
            Follow
          </button>
        </div>
      </CardContent>
    </Card>
  );
}; 