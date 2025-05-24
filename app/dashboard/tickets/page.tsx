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
  TrendingUp,
  Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getUserDrawParticipations } from "@/data/draw";
import { 
  getUserAvailableTickets, 
  getUserUsedTickets, 
  getUserTotalTickets 
} from "@/lib/ticket-utils";
import { TicketHistoryModal } from "@/components/dashboard/ticket-history-modal";

export const metadata: Metadata = {
  title: "My Tickets | Social Lottery",
  description: "View your lottery tickets",
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

  // Get accurate ticket counts using utility functions
  const activeTickets = await getUserAvailableTickets(user.id);
  const usedTickets = await getUserUsedTickets(user.id);
  const totalTickets = await getUserTotalTickets(user.id);

  // Fetch user's tickets with details for history
  const tickets = await db.ticket.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch user's lottery participations
  const participations = await getUserDrawParticipations(user.id);

  // Group tickets by source
  const ticketsBySource = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.source]) {
      acc[ticket.source] = [];
    }
    acc[ticket.source].push(ticket);
    return acc;
  }, {} as Record<TicketSource, typeof tickets>);

  // Get recent tickets (latest 3)
  const recentTickets = tickets.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
              <Ticket className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">My Tickets</h1>
              <p className="text-slate-600 mt-1">Manage and track your lottery tickets</p>
            </div>
          </div>
        </div>
        
        {/* Ticket Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-xl mr-4 shadow-md">
                  <Ticket className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Available Tickets</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-green-900">{activeTickets}</p>
              <p className="text-sm text-green-700 mt-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Ready for lottery participation
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-3 rounded-xl mr-4 shadow-md">
                  <Ticket className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-orange-800">Used Tickets</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-orange-900">{usedTickets}</p>
              <p className="text-sm text-orange-700 mt-2 flex items-center">
                <Trophy className="h-4 w-4 mr-1" />
                Used in lottery draws
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-xl mr-4 shadow-md">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-800">Total Tickets</h3>
              </div>
              <p className="text-4xl font-bold mt-2 text-blue-900">{totalTickets}</p>
              <p className="text-sm text-blue-700 mt-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                All time earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lottery Participation History */}
        {participations.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Trophy className="h-6 w-6" />
                Lottery Participation History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {participations.map((participation) => (
                  <div 
                    key={participation.id} 
                    className="group p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-yellow-100 p-3 rounded-xl group-hover:bg-yellow-200 transition-colors">
                          <Ticket className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-yellow-900 text-lg">
                            Lottery Draw - {formatDate(new Date(participation.draw.drawDate), 'dateOnly')}
                          </h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            Participated with <span className="font-semibold">{participation.ticketsUsed} tickets</span>
                          </p>
                          <p className="text-sm text-yellow-600 mt-1">
                            Participated on {formatDate(new Date(participation.participatedAt), 'full')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="font-bold text-green-800 text-lg">${participation.draw.prizeAmount}</span>
                        </div>
                        <span className={`text-sm px-4 py-2 rounded-full font-medium shadow-sm ${
                          participation.draw.status === 'COMPLETED' 
                            ? participation.isWinner 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-gray-100 text-gray-700 border border-gray-300'
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}>
                          {participation.draw.status === 'COMPLETED' 
                            ? participation.isWinner 
                              ? '🎉 Winner!' 
                              : 'Not selected'
                            : 'Pending draw'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Ticket History */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-slate-600" />
                <div>
                  <CardTitle className="text-slate-800">Recent Ticket History</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Latest tickets you&apos;ve earned</p>
                </div>
              </div>
              <TicketHistoryModal tickets={tickets} />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="group p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-indigo-200 transition-colors">
                        {getSourceIcon(ticket.source)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-800 text-lg group-hover:text-blue-800 transition-colors">
                            {getSourceLabel(ticket.source)}
                          </h3>
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                            ticket.isUsed 
                              ? "bg-orange-100 text-orange-700 border border-orange-300" 
                              : "bg-green-100 text-green-700 border border-green-300"
                          }`}>
                            {ticket.isUsed ? "Used in Lottery" : "Available"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Earned on {formatDate(new Date(ticket.createdAt), 'full')}
                        </p>
                        {ticket.drawId && (
                          <p className="text-sm text-blue-600 mt-1">
                            Used in draw: <span className="font-mono">{ticket.drawId.substring(0, 8)}...</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {tickets.length > 3 && (
                  <div className="text-center pt-4 border-t border-slate-200">
                    <p className="text-slate-600 text-sm mb-3">
                      Showing {recentTickets.length} of {tickets.length} tickets
                    </p>
                    <TicketHistoryModal tickets={tickets} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Ticket className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
                <p className="text-slate-500 text-lg">You don&apos;t have any tickets yet.</p>
                <p className="mt-2 text-slate-400">Complete surveys, invite friends, or follow us on social media to earn tickets!</p>
                <div className="mt-6">
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Start Earning Tickets
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tickets by Source */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <TrendingUp className="h-6 w-6" />
              Tickets by Source
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`group p-6 bg-gradient-to-r ${getSourceColor("SURVEY")} border-2 rounded-xl hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl mr-4 group-hover:bg-blue-200 transition-colors">
                    <ClipboardCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Survey Tickets</h3>
                    <p className="text-2xl font-bold text-blue-900">{ticketsBySource["SURVEY"]?.length || 0}</p>
                  </div>
                </div>
                <p className="text-blue-700 text-sm">Earned by completing surveys</p>
              </div>
              
              <div className={`group p-6 bg-gradient-to-r ${getSourceColor("SOCIAL")} border-2 rounded-xl hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl mr-4 group-hover:bg-purple-200 transition-colors">
                    <Share2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-800">Social Media Tickets</h3>
                    <p className="text-2xl font-bold text-purple-900">{ticketsBySource["SOCIAL"]?.length || 0}</p>
                  </div>
                </div>
                <p className="text-purple-700 text-sm">Earned by following on social media</p>
              </div>
              
              <div className={`group p-6 bg-gradient-to-r ${getSourceColor("REFERRAL")} border-2 rounded-xl hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-xl mr-4 group-hover:bg-green-200 transition-colors">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Referral Tickets</h3>
                    <p className="text-2xl font-bold text-green-900">{ticketsBySource["REFERRAL"]?.length || 0}</p>
                  </div>
                </div>
                <p className="text-green-700 text-sm">Earned by inviting friends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 