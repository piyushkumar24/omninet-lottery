"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trophy, Crown, DollarSign, Ticket } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

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
    <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <h3 className="text-lg font-semibold text-amber-800">Recent Winners</h3>
        <div className="p-2 bg-amber-100 rounded-lg">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {winners.length === 0 ? (
          <div className="text-center py-6 bg-white/70 rounded-xl border border-amber-200">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-amber-800 mb-1">No Winners Yet</p>
            <p className="text-xs text-amber-600">Be the first to win the lottery!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {winners.map((winner, index) => (
              <div 
                key={winner.id} 
                className="bg-white/70 rounded-xl p-4 border border-amber-200 hover:bg-white/90 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  {/* Winner Avatar */}
                  <div className="relative">
                    <div className="relative h-12 w-12">
                      {winner.user.image ? (
                        <Image
                          src={winner.user.image}
                          alt={winner.user.name || "Winner"}
                          fill
                          className="rounded-full object-cover border-2 border-amber-300"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center border-2 border-amber-300">
                          <span className="text-amber-700 font-bold text-lg">
                            {winner.user.name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Crown for first winner */}
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Crown className="h-3 w-3 text-yellow-800" />
                      </div>
                    )}
                  </div>

                  {/* Winner Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 truncate">
                      {winner.user.name || "Anonymous Winner"}
                    </p>
                    <p className="text-xs text-amber-700">
                      {formatDate(new Date(winner.drawDate), 'short')}
                    </p>
                  </div>

                  {/* Prize Amount */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg px-2 py-1 border border-green-200">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <p className="text-sm font-bold text-green-800">{winner.prizeAmount}</p>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">🏆 Winner</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Increase Your Chances Message */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Ticket className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-blue-700">
              Increase your chances to win by earning more tickets!
            </p>
          </div>
        </div>
        
        {/* Motivational Message */}
        <div className="text-xs text-amber-600 text-center bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-3 border border-amber-200">
          {winners.length === 0 
            ? "🎯 Start earning tickets for your chance to be featured here!" 
            : "🌟 Could you be our next winner? Keep earning tickets!"}
        </div>
      </CardContent>
    </Card>
  );
}; 