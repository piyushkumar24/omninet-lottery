import { Card } from "@/components/ui/card";
import { Gift, Ticket, Users } from "lucide-react";
import { TrophyIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface WinnerProfile {
  name: string;
  username: string;
  profileImage?: string;
}

interface LotteryStatsProps {
  totalUsers: number;
  totalTickets: number;
  prizeAmount: number;
  latestWinner: string;
  latestWinnerProfile?: WinnerProfile | null;
  theme?: "light" | "dark";
}

export const LotteryStats = ({
  totalUsers,
  totalTickets,
  prizeAmount,
  latestWinner,
  latestWinnerProfile,
  theme = "light"
}: LotteryStatsProps) => {
  // Determine styling based on theme
  const bgColorClass = theme === "dark" ? "bg-indigo-800/30" : "bg-white";
  const textColorClass = theme === "dark" ? "text-white" : "text-gray-900";
  const secondaryTextColorClass = theme === "dark" ? "text-indigo-200" : "text-gray-600";
  const borderColorClass = theme === "dark" ? "border-indigo-700" : "border-gray-100";
  const iconBgClass = theme === "dark" ? "bg-indigo-700" : "bg-indigo-100";
  const iconColorClass = theme === "dark" ? "text-white" : "text-indigo-600";

  // Default profile images for random selection
  const defaultImages = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  ];

  const getRandomProfileImage = () => {
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className={`${bgColorClass} ${borderColorClass} border shadow-sm p-4`}>
        <div className="flex items-center space-x-4">
          <div className={`${iconBgClass} p-3 rounded-full`}>
            <Gift className={`h-6 w-6 ${iconColorClass}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${secondaryTextColorClass}`}>Prize Amount</p>
            <p className={`text-xl font-semibold ${textColorClass}`}>${prizeAmount} Amazon Gift Card</p>
          </div>
        </div>
      </Card>
      
      <Card className={`${bgColorClass} ${borderColorClass} border shadow-sm p-4`}>
        <div className="flex items-center space-x-4">
          <div className={`${iconBgClass} p-3 rounded-full`}>
            <Ticket className={`h-6 w-6 ${iconColorClass}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${secondaryTextColorClass}`}>Total Tickets</p>
            <p className={`text-xl font-semibold ${textColorClass}`}>{totalTickets}</p>
          </div>
        </div>
      </Card>
      
      <Card className={`${bgColorClass} ${borderColorClass} border shadow-sm p-4`}>
        <div className="flex items-center space-x-4">
          <div className={`${iconBgClass} p-3 rounded-full`}>
            <Users className={`h-6 w-6 ${iconColorClass}`} />
          </div>
          <div>
            <p className={`text-sm font-medium ${secondaryTextColorClass}`}>Total Users</p>
            <p className={`text-xl font-semibold ${textColorClass}`}>{totalUsers}</p>
          </div>
        </div>
      </Card>
      
      <Card className={`${bgColorClass} ${borderColorClass} border shadow-sm p-4`}>
        <div className="flex items-center space-x-4">
          {latestWinnerProfile ? (
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={latestWinnerProfile.profileImage || getRandomProfileImage()} 
                alt={latestWinnerProfile.name} 
              />
              <AvatarFallback>{latestWinnerProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className={`${iconBgClass} p-3 rounded-full`}>
              <TrophyIcon className={`h-6 w-6 ${iconColorClass}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${secondaryTextColorClass}`}>Last Winner</p>
            {latestWinnerProfile ? (
              <div>
                <p className={`text-lg font-semibold ${textColorClass} truncate`}>
                  {latestWinnerProfile.name}
                </p>
                <p className={`text-sm ${secondaryTextColorClass} truncate`}>
                  @{latestWinnerProfile.username}
                </p>
              </div>
            ) : (
              <p className={`text-xl font-semibold ${textColorClass}`}>{latestWinner}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
} 