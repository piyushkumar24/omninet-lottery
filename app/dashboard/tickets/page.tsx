import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketSource } from "@prisma/client";
import { 
  Ticket, 
  ClipboardCheck, 
  Share2, 
  Users, 
  Calendar,
  Trophy,
  Clock,
  DollarSign,
  ArrowRight,
  Info,
  Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getUserDrawParticipations } from "@/data/draw";
import { 
  getUserAppliedTickets,
  getUserUsedTickets,
  getUserTotalTickets
} from "@/lib/ticket-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TicketHistoryModal } from "@/components/dashboard/ticket-history-modal";

export const metadata: Metadata = {
  title: "My Tickets | 0mninet Lottery",
  description: "Manage and track your lottery tickets",
};

const getSourceIcon = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return <ClipboardCheck className="h-5 w-5 text-blue-600" />;
    case "SOCIAL":
      return <Share2 className="h-5 w-5 text-purple-600" />;
    case "REFERRAL":
      return <Users className="h-5 w-5 text-green-600" />;
    default:
      return <Ticket className="h-5 w-5 text-indigo-600" />;
  }
};

const getSourceLabel = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return "Survey Completion";
    case "SOCIAL":
      return "Social Media Follow";
    case "REFERRAL":
      return "Friend Invitation";
    default:
      return "Unknown Source";
  }
};

const getSourceColor = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return "from-blue-50 to-indigo-50 border-blue-200";
    case "SOCIAL":
      return "from-purple-50 to-pink-50 border-purple-200";
    case "REFERRAL":
      return "from-green-50 to-emerald-50 border-green-200";
    default:
      return "from-slate-50 to-gray-50 border-slate-200";
  }
};

export default async function TicketsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return redirect("/auth/login");
  }

  if (user.isBlocked) {
    return redirect("/auth/blocked");
  }

  // Get ticket counts - now all tickets are applied tickets
  const appliedTickets = await getUserAppliedTickets(user.id);
  const usedTickets = await getUserUsedTickets(user.id);
  const totalTickets = await getUserTotalTickets(user.id);

  // Fetch user's lottery participations with detailed information
  const participations = await getUserDrawParticipations(user.id);

  // Calculate total tickets user has applied across all draws
  const totalAppliedTickets = participations.reduce((sum, p) => sum + p.ticketsUsed, 0);

  // Fetch user's tickets for earning history
  const tickets = await db.ticket.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10, // Show only recent 10 tickets for performance
  });

  // Group tickets by source for display
  const ticketsBySource = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.source]) {
      acc[ticket.source] = [];
    }
    acc[ticket.source].push(ticket);
    return acc;
  }, {} as Record<TicketSource, typeof tickets>);

  // Count tickets by source
  const ticketCounts = Object.entries(ticketsBySource).reduce((acc, [source, tickets]) => {
    acc[source as TicketSource] = tickets.length;
    return acc;
  }, {} as Record<TicketSource, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-slate-600 mt-1">Manage and track your lottery tickets</p>
        </div>
        
        {/* Ticket Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Applied Tickets */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Ticket className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-800">Applied Tickets</h3>
              </div>
              <p className="text-4xl font-bold mt-4 text-blue-900">{appliedTickets}</p>
              <p className="text-sm text-blue-700 mt-2 flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                Automatically entered in lottery
              </p>
            </CardContent>
          </Card>
          
          {/* Total Tickets */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Ticket className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Total Tickets</h3>
              </div>
              <p className="text-4xl font-bold mt-4 text-green-900">{totalTickets}</p>
              <p className="text-sm text-green-700 mt-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                All time earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Ticket History */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              <div>
                <CardTitle className="text-slate-800">Recent Ticket History</CardTitle>
                <p className="text-sm text-slate-600">Latest tickets you&apos;ve earned</p>
              </div>
            </div>
            <TicketHistoryModal tickets={tickets} />
          </CardHeader>
          <CardContent className="p-4">
            {tickets.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-600">No tickets earned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        {getSourceIcon(ticket.source)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{getSourceLabel(ticket.source)}</p>
                        <p className="text-xs text-slate-500">Earned on {formatDate(ticket.createdAt, 'short')}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                      Applied
                    </Badge>
                  </div>
                ))}
                
                {tickets.length > 3 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-500">Showing 3 of {tickets.length} tickets</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lottery Participation History */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Lottery Participation History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {participations.length === 0 ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Ticket className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No Lottery Participation Yet</h3>
                <p className="text-slate-600">
                  You haven&apos;t participated in any lottery draws yet. Start earning tickets to join the next draw!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {participations.map((participation) => (
                  <Dialog key={participation.id}>
                    <DialogTrigger asChild>
                      <div className="bg-yellow-50/70 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <Ticket className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-amber-900">
                                Lottery Draw - {formatDate(new Date(participation.draw.drawDate), 'dateOnly')}
                              </h4>
                              <p className="text-sm text-amber-700">
                                Participated with {participation.ticketsUsed} tickets
                              </p>
                              <p className="text-xs text-amber-600 mt-1">
                                Participated on {formatDate(new Date(participation.participatedAt), 'short')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-bold text-green-700">${participation.draw.prizeAmount}</span>
                            </div>
                            <div className={`text-xs px-3 py-1 rounded-full ${
                              participation.draw.status === 'COMPLETED' 
                                ? participation.isWinner 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {participation.draw.status === 'COMPLETED' 
                                ? participation.isWinner 
                                  ? '🎉 Winner!' 
                                  : 'Not selected'
                                : 'Pending draw'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Lottery Draw Details</DialogTitle>
                        <DialogDescription>
                          Details about your participation in this lottery draw
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">Draw Information</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-blue-700">Date:</div>
                            <div className="font-medium">{formatDate(new Date(participation.draw.drawDate), 'dateOnly')}</div>
                            <div className="text-blue-700">Prize:</div>
                            <div className="font-medium">${participation.draw.prizeAmount}</div>
                            <div className="text-blue-700">Status:</div>
                            <div className="font-medium">{participation.draw.status}</div>
                          </div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                          <h4 className="font-semibold text-indigo-800 mb-2">Your Participation</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-indigo-700">Tickets Used:</div>
                            <div className="font-medium">{participation.ticketsUsed}</div>
                            <div className="text-indigo-700">Participated On:</div>
                            <div className="font-medium">{formatDate(new Date(participation.participatedAt), 'full')}</div>
                            <div className="text-indigo-700">Result:</div>
                            <div className="font-medium">
                              {participation.draw.status === 'COMPLETED' 
                                ? participation.isWinner 
                                  ? '🎉 Winner!' 
                                  : 'Not selected'
                                : 'Pending draw'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tickets by Source */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="flex items-center gap-2 pb-2">
            <ArrowRight className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-slate-800">Tickets by Source</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Survey Tickets */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-800">
                    {ticketCounts["SURVEY"] || 0}
                  </h3>
                </div>
                <h4 className="font-semibold text-blue-700">Survey Tickets</h4>
                <p className="text-xs text-blue-600 mt-1">Earned by completing surveys</p>
              </div>
              
              {/* Social Media Tickets */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Share2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-800">
                    {ticketCounts["SOCIAL"] || 0}
                  </h3>
                </div>
                <h4 className="font-semibold text-purple-700">Social Media Tickets</h4>
                <p className="text-xs text-purple-600 mt-1">Earned by following on social media</p>
              </div>
              
              {/* Referral Tickets */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-green-800">
                    {ticketCounts["REFERRAL"] || 0}
                  </h3>
                </div>
                <h4 className="font-semibold text-green-700">Referral Tickets</h4>
                <p className="text-xs text-green-600 mt-1">Earned by inviting friends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/refer">
            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
              <Users className="h-4 w-4 mr-2" />
              Earn More Tickets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 