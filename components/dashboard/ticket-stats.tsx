import { Ticket, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TicketStatsProps {
  tickets: number;
  winningChance: string;
}

export const TicketStats = ({ tickets, winningChance }: TicketStatsProps) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <h3 className="text-lg font-semibold text-blue-800">Your Lottery Tickets</h3>
        <div className="p-2 bg-blue-100 rounded-lg">
          <Ticket className="w-5 h-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticket Count - Main Display */}
        <div className="text-center p-4 bg-white/70 rounded-xl border border-blue-200">
          <div className="text-4xl font-bold text-blue-900 mb-1">{tickets}</div>
          <p className="text-sm font-medium text-blue-700">
            {tickets === 1 ? "Ticket Available" : "Tickets Available"}
          </p>
        </div>
        
        {/* Winning Chance - Secondary Info */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <Trophy className="w-4 h-4 text-green-600" />
          <div className="text-center">
            <p className="text-sm font-medium text-green-800">Winning Chance</p>
            <p className="text-lg font-bold text-green-900">{winningChance}%</p>
          </div>
        </div>
        
        {/* Helpful Context */}
        <div className="text-xs text-blue-600 text-center">
          {tickets === 0 
            ? "Complete surveys to earn tickets!" 
            : tickets === 1
            ? "Get more tickets to increase your chances!"
            : "Great! More tickets = better winning odds!"}
        </div>
      </CardContent>
    </Card>
  );
}; 