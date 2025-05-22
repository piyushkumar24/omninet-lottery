"use client";

import Image from "next/image";

interface Winner {
  id: string;
  drawDate: Date;
  prizeAmount: number;
  claimed: boolean;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface RecentWinnersListProps {
  winners: Winner[];
}

export const RecentWinnersList = ({ winners }: RecentWinnersListProps) => {
  if (winners.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-500">No winners yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {winners.map((winner) => (
        <div key={winner.id} className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            {winner.user.image ? (
              <Image
                src={winner.user.image}
                alt={winner.user.name || "Winner"}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-medium">
                  {winner.user.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{winner.user.name || "Anonymous"}</p>
            <p className="text-xs text-slate-500 truncate">{winner.user.email || "No email"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">${winner.prizeAmount}</p>
            <p className={`text-xs ${winner.claimed ? "text-green-600" : "text-yellow-600"}`}>
              {winner.claimed ? "Claimed" : "Unclaimed"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}; 