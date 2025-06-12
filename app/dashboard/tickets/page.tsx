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
  Eye,
  CheckCircle2,
  Plus
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

export default async function TicketsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return redirect("/auth/login");
  }

  if (user.isBlocked) {
    return redirect("/auth/blocked");
  }

  // Get user's ticket information from the user model
  const userWithTickets = await db.user.findUnique({
    where: { id: user.id },
    select: {
      availableTickets: true,
      totalTicketsEarned: true,
    }
  });

  const availableTickets = userWithTickets?.availableTickets || 0;
  const totalTickets = userWithTickets?.totalTicketsEarned || 0;
  const usedTickets = totalTickets - availableTickets; // Tickets that have been used in past lotteries

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
    take: 20, // Show more recent tickets
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

  const getSourceIcon = (source: TicketSource) => {
    switch (source) {
      case "SURVEY":
        return <ClipboardCheck className="h-4 w-4" />;
      case "SOCIAL":
        return <Share2 className="h-4 w-4" />;
      case "REFERRAL":
        return <Users className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: TicketSource) => {
    switch (source) {
      case "SURVEY":
        return "text-blue-600";
      case "SOCIAL":
        return "text-green-600";
      case "REFERRAL":
        return "text-purple-600";
      default:
        return "text-slate-600";
    }
  };

  const getSourceBgColor = (source: TicketSource) => {
    switch (source) {
      case "SURVEY":
        return "bg-blue-100";
      case "SOCIAL":
        return "bg-green-100";
      case "REFERRAL":
        return "bg-purple-100";
      default:
        return "bg-slate-100";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Lottery Tickets</h1>
          <p className="text-slate-600 mt-1">Track your tickets and lottery participation</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard">
            <Button 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors duration-200"
            >
              <ArrowRight className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard#earn-tickets-section" scroll={true}>
            <Button 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Earn More Tickets
            </Button>
          </Link>
        </div>
      </div>

      {/* Ticket Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Available Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{availableTickets}</div>
            <p className="text-xs text-blue-600">Ready for next lottery</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-800">Used Tickets</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{usedTickets}</div>
            <p className="text-xs text-slate-600">From past lotteries</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Earned</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{totalTickets}</div>
            <p className="text-xs text-green-600">All-time total</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Participations</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{participations.length}</div>
            <p className="text-xs text-purple-600">Lottery draws entered</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Earning Sources */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Ticket Sources
          </CardTitle>
          <p className="text-sm text-slate-600">How you&apos;ve earned your tickets</p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(ticketCounts).map(([source, count]) => {
              const ticketSource = source as TicketSource;
              return (
                <div
                  key={source}
                  className={`p-4 rounded-lg border-2 ${getSourceBgColor(ticketSource)} border-opacity-30`}
                >
                  <div className={`flex items-center gap-2 ${getSourceColor(ticketSource)} mb-2`}>
                    {getSourceIcon(ticketSource)}
                    <span className="font-medium">
                      {source === "SURVEY" ? "Survey Completion" : 
                       source === "SOCIAL" ? "Social Media Follow" : 
                       source === "REFERRAL" ? "Friend Referrals" : source}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${getSourceColor(ticketSource)}`}>
                    {count}
                  </div>
                  <p className={`text-xs ${getSourceColor(ticketSource)} opacity-75`}>
                    tickets earned
                  </p>
                </div>
              );
            })}
            {Object.keys(ticketCounts).length === 0 && (
              <div className="col-span-3 text-center py-6">
                <p className="text-slate-600">No tickets earned yet</p>
                <Link href="/dashboard#earn-tickets-section" scroll={true}>
                  <Button className="mt-2 bg-green-600 hover:bg-green-700" size="sm">
                    Start Earning Tickets
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Ticket History */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-slate-800">Recent History</CardTitle>
          </div>
          <TicketHistoryModal tickets={tickets}>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-sm px-3 py-2 h-auto transition-colors duration-200"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View Complete History</span>
              <span className="sm:hidden">View All</span>
            </Button>
          </TicketHistoryModal>
        </CardHeader>
        <CardContent className="p-4">
          {tickets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-600">No tickets earned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getSourceBgColor(ticket.source)}`}>
                      <div className={getSourceColor(ticket.source)}>
                        {getSourceIcon(ticket.source)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {ticket.source === "SURVEY" ? "Survey Completion" : 
                         ticket.source === "SOCIAL" ? "Social Media Follow" : 
                         ticket.source === "REFERRAL" ? "Friend Referral" : ticket.source} Ticket
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={ticket.isUsed ? "secondary" : "outline"}
                    className={
                      ticket.isUsed 
                        ? "bg-slate-100 text-slate-600" 
                        : "bg-green-50 text-green-700 border-green-200"
                    }
                  >
                    {ticket.isUsed ? "Used" : "Available"}
                  </Badge>
                </div>
              ))}
              {tickets.length > 5 && (
                <div className="text-center pt-2">
                  <TicketHistoryModal tickets={tickets}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      View all {tickets.length} tickets
                    </Button>
                  </TicketHistoryModal>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lottery Participation History */}
      {participations.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Lottery Participation History
            </CardTitle>
            <p className="text-sm text-slate-600">Your entries in past and current lotteries</p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {participations.slice(0, 10).map((participation) => (
                <div
                  key={participation.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-indigo-100">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Lottery Draw - {formatDate(participation.draw.drawDate)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Prize: ${participation.draw.prizeAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {participation.ticketsUsed} ticket{participation.ticketsUsed !== 1 ? 's' : ''}
                    </Badge>
                    {participation.isWinner && (
                      <Badge className="bg-yellow-500 text-white">
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner!
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-800 mb-2">How the Ticket System Works</h3>
              <div className="text-sm text-indigo-700 space-y-2">
                <p><strong>Available Tickets:</strong> Tickets you can use for the current lottery. These reset to 0 after each lottery draw.</p>
                <p><strong>Used Tickets:</strong> Tickets from previous lotteries that have already been entered.</p>
                <p><strong>Total Earned:</strong> All tickets you've earned throughout your time on the platform.</p>
                <p className="mt-3 pt-2 border-t border-indigo-200">
                  <strong>Note:</strong> All available tickets are automatically entered into each lottery draw. After each lottery, all tickets are reset and you can start earning new ones for the next draw.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 