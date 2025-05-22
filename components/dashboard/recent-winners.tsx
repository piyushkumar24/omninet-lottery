"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Gift } from "lucide-react";
import Image from "next/image";

interface Winner {
  id: string;
  drawDate: Date;
  prizeAmount: number;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface RecentWinnersProps {
  winners: Winner[];
}

export const RecentWinners = ({ winners }: RecentWinnersProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h3 className="text-sm font-medium">Recent Winners</h3>
        <Gift className="w-4 h-4 text-indigo-600" />
      </CardHeader>
      <CardContent>
        {winners.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No winners yet</p>
        ) : (
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
                <div className="flex-1">
                  <p className="text-sm font-medium">{winner.user.name || "Anonymous"}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(winner.drawDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${winner.prizeAmount}</p>
                  <p className="text-xs text-indigo-600">Winner</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 