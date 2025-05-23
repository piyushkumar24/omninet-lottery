import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Winners | Social Lottery",
  description: "View past lottery winners",
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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Lottery Winners</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Past Winners</CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length > 0 ? (
            <div className="rounded-md border">
              <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Winner</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Draw Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tickets</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Prize</th>
                      <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {winners.map((winner) => (
                      <tr key={winner.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {winner.user.image ? (
                                <AvatarImage src={winner.user.image} alt={winner.user.name || "User"} />
                              ) : (
                                <AvatarFallback>{winner.user.name?.[0] || "U"}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{winner.user.name || "Anonymous User"}</p>
                              <p className="text-xs text-muted-foreground">{winner.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">{formatDate(winner.drawDate, 'dateOnly')}</td>
                        <td className="p-4 align-middle">{winner.ticketCount}</td>
                        <td className="p-4 align-middle text-right">${winner.prizeAmount.toFixed(2)}</td>
                        <td className="p-4 align-middle text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            winner.claimed 
                              ? "bg-green-100 text-green-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {winner.claimed ? "Claimed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-lg font-medium mb-1">No Winners Yet</h3>
              <p className="text-muted-foreground">The lottery is yet to be conducted. Check back after the next draw!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 