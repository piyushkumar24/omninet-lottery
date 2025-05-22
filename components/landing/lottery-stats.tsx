import { Trophy, Users, Ticket } from "lucide-react";

interface LotteryStatsProps {
  totalUsers: number;
  totalTickets: number;
  prizeAmount: number;
  latestWinner: string;
}

export const LotteryStats = ({ 
  totalUsers, 
  totalTickets, 
  prizeAmount,
  latestWinner 
}: LotteryStatsProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="bg-indigo-100 p-2 rounded-full mr-3">
          <Trophy className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Prize Amount</p>
          <p className="font-bold">${prizeAmount} Amazon Gift Card</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="bg-indigo-100 p-2 rounded-full mr-3">
          <Ticket className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Total Tickets</p>
          <p className="font-bold">{totalTickets}</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="bg-indigo-100 p-2 rounded-full mr-3">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="font-bold">{totalUsers}</p>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <p className="text-sm text-slate-500">Last Winner</p>
        <p className="font-bold">{latestWinner}</p>
      </div>
    </div>
  );
}; 