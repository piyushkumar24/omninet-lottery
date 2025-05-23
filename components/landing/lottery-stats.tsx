import { Trophy, Users, Ticket } from "lucide-react";

interface LotteryStatsProps {
  totalUsers: number;
  totalTickets: number;
  prizeAmount: number;
  latestWinner: string;
  theme?: "light" | "dark";
}

export const LotteryStats = ({ 
  totalUsers, 
  totalTickets, 
  prizeAmount,
  latestWinner,
  theme = "light"
}: LotteryStatsProps) => {
  // Determine styling based on theme
  const iconBgClass = theme === "dark" ? "bg-indigo-800" : "bg-indigo-100";
  const iconClass = theme === "dark" ? "text-indigo-300" : "text-indigo-600";
  const labelClass = theme === "dark" ? "text-indigo-200" : "text-slate-500";
  const valueClass = theme === "dark" ? "text-white font-semibold" : "font-bold";
  const borderClass = theme === "dark" ? "border-indigo-700" : "border-slate-200";

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className={`${iconBgClass} p-2 rounded-full mr-3`}>
          <Trophy className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div>
          <p className={`text-sm ${labelClass}`}>Prize Amount</p>
          <p className={valueClass}>${prizeAmount} Amazon Gift Card</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className={`${iconBgClass} p-2 rounded-full mr-3`}>
          <Ticket className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div>
          <p className={`text-sm ${labelClass}`}>Total Tickets</p>
          <p className={valueClass}>{totalTickets}</p>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className={`${iconBgClass} p-2 rounded-full mr-3`}>
          <Users className={`h-5 w-5 ${iconClass}`} />
        </div>
        <div>
          <p className={`text-sm ${labelClass}`}>Total Users</p>
          <p className={valueClass}>{totalUsers}</p>
        </div>
      </div>
      
      <div className={`pt-4 border-t ${borderClass}`}>
        <p className={`text-sm ${labelClass}`}>Last Winner</p>
        <p className={valueClass}>{latestWinner}</p>
      </div>
    </div>
  );
}; 