"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, User } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Winner {
  id: string;
  userId: string;
  drawDate: Date;
  prizeAmount: number;
  couponCode: string | null;
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
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-3 space-y-0 p-4 md:p-6">
        <CardTitle className="text-base md:text-lg font-semibold text-amber-800">Recent Winners</CardTitle>
        <div className="p-1.5 md:p-2 bg-amber-100 rounded-lg">
          <Trophy className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:px-6 md:pb-6 flex flex-col h-[calc(100%-70px)]">
        {winners.length > 0 ? (
          <div className="space-y-3">
            {winners.map((winner) => (
              <div 
                key={winner.id} 
                className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-amber-200 hover:bg-amber-50/50 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  {winner.user.image ? (
                    <Image
                      src={winner.user.image}
                      alt={winner.user.name || "Winner"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <Link href="/dashboard/winners" className="font-medium text-amber-900 truncate hover:underline">
                    {winner.user.name || "Anonymous User"}
                  </Link>
                  <p className="text-xs text-amber-700">
                    Won ${winner.prizeAmount} • {formatDistanceToNow(new Date(winner.drawDate), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-amber-100 p-3 rounded-full mb-3">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mb-1">No Winners Yet</h3>
            <p className="text-sm text-amber-700">
              The first lottery drawing will happen soon!
            </p>
          </div>
        )}
        
        {/* Spacer to ensure consistent height */}
        {winners.length > 0 && winners.length < 3 && <div className="flex-grow"></div>}
        
        <div className="mt-3 text-center text-xs text-amber-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
          New winners announced every Thursday
        </div>
      </CardContent>
    </Card>
  );
}; 