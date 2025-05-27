"use client";

import { Ticket, CheckCircle2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserLotteryTicketsProps {
  userId: string;
  appliedTickets: number;
  userParticipation?: {
    ticketsUsed: number;
  } | null;
  drawId: string;
}

export const UserLotteryTickets = ({
  userId,
  appliedTickets,
  userParticipation,
  drawId,
}: UserLotteryTicketsProps) => {
  const participationTickets = userParticipation?.ticketsUsed || 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-lg font-semibold text-blue-800">Your Lottery Tickets</CardTitle>
        <div className="p-2 bg-blue-100 rounded-lg">
          <Ticket className="w-5 h-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Applied Tickets Display */}
        <div className="text-center p-4 bg-white/70 rounded-xl border border-blue-200">
          <div className="text-4xl font-bold text-blue-900 mb-1">{appliedTickets}</div>
          <p className="text-sm font-medium text-blue-700">
            {appliedTickets === 1 ? "Ticket Applied" : "Tickets Applied"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            to this week&apos;s lottery
          </p>
        </div>

        {/* Auto-Apply Information */}
        <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Auto-Apply System</span>
            </Badge>
          </div>
          <p className="text-sm text-center text-blue-700">
            All tickets are automatically applied to the lottery as you earn them.
          </p>
        </div>

        {/* Status Message */}
        <div className="text-xs text-blue-600 text-center">
          {appliedTickets === 0 
            ? "Complete surveys to earn tickets!" 
            : appliedTickets === 1
            ? "You have 1 entry in this week's lottery. Good luck! 🍀"
            : `You have ${appliedTickets} entries in this week's lottery. Good luck! 🍀`}
        </div>
      </CardContent>
    </Card>
  );
}; 