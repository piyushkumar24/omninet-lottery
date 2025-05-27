import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Trophy, Crown, Gift, Calendar, Ticket, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Winners | 0mninet Lottery",
  description: "View recent lottery winners and their prizes",
};

export default async function WinnersPage() {
  // Fetch all winners ordered by most recent
  const winners = await db.winner.findMany({
    orderBy: {
      drawDate: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl text-white shadow-lg">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Lottery Winners</h1>
              <p className="text-slate-600 mt-1">Celebrating our lucky winners and their amazing prizes</p>
            </div>
          </div>
        </div>
        
        {/* Winners Stats */}
        {winners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-100 p-3 rounded-xl mr-4 shadow-md">
                    <Crown className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-800">Total Winners</h3>
                </div>
                <p className="text-4xl font-bold mt-2 text-yellow-900">{winners.length}</p>
                <p className="text-sm text-yellow-700 mt-2">Lucky participants who won</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-xl mr-4 shadow-md">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">Total Prizes</h3>
                </div>
                <p className="text-4xl font-bold mt-2 text-green-900">
                  ${winners.reduce((sum, winner) => sum + winner.prizeAmount, 0).toFixed(0)}
                </p>
                <p className="text-sm text-green-700 mt-2">Total amount awarded</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl mr-4 shadow-md">
                    <Gift className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-800">Claimed Prizes</h3>
                </div>
                <p className="text-4xl font-bold mt-2 text-blue-900">
                  {winners.filter(w => w.claimed).length}
                </p>
                <p className="text-sm text-blue-700 mt-2">Successfully claimed</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Winners List */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Trophy className="h-6 w-6" />
              Past Winners Hall of Fame
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {winners.length > 0 ? (
              <div className="space-y-4">
                {winners.map((winner, index) => (
                  <div 
                    key={winner.id} 
                    className="group p-6 bg-gradient-to-r from-white to-yellow-50 border-2 border-yellow-200 rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {index < 3 ? (
                            index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                          ) : (
                            index + 1
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                            {winner.user.image ? (
                              <AvatarImage src={winner.user.image} alt={winner.user.name || "User"} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 text-lg font-bold">
                                {winner.user.name?.[0] || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-slate-800 text-xl">
                              {winner.user.name || "Anonymous User"}
                            </h3>
                            <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                              <Calendar className="h-4 w-4" />
                              Won on {formatDate(winner.drawDate, 'dateOnly')}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <Ticket className="h-4 w-4" />
                              Used {winner.ticketCount} tickets
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Prize Info */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-6 w-6 text-green-600" />
                          <span className="text-3xl font-bold text-green-800">
                            ${winner.prizeAmount.toFixed(0)}
                          </span>
                        </div>
                        
                        <Badge 
                          variant="outline"
                          className={`text-sm px-4 py-2 font-medium shadow-sm ${
                            winner.claimed 
                              ? "bg-green-100 text-green-800 border-green-300" 
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {winner.claimed ? "✅ Claimed" : "⏳ Pending"}
                        </Badge>

                        {index < 3 && (
                          <div className="mt-2">
                            <Badge className={`text-xs px-2 py-1 ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {index === 0 ? 'Latest Winner' : index === 1 ? '2nd Latest' : '3rd Latest'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No Winners Yet</h3>
                <p className="text-slate-600 text-lg mb-4">
                  The lottery is yet to be conducted. Be the first to win!
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
                  <p className="text-blue-800 font-medium mb-2">🎯 How to Win</p>
                  <p className="text-blue-700 text-sm">
                    Earn tickets by completing surveys, referring friends, and following on social media. 
                    Then participate in weekly lottery draws for a chance to win amazing prizes!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 