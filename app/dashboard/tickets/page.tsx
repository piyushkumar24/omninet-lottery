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
  DollarSign
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getUserDrawParticipations } from "@/data/draw";
import { 
  getUserAvailableTickets, 
  getUserUsedTickets, 
  getUserTotalTickets 
} from "@/lib/ticket-utils";

export const metadata: Metadata = {
  title: "My Tickets | Social Lottery",
  description: "View your lottery tickets",
};

const getSourceIcon = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return <ClipboardCheck className="h-5 w-5 text-indigo-600" />;
    case "SOCIAL":
      return <Share2 className="h-5 w-5 text-indigo-600" />;
    case "REFERRAL":
      return <Users className="h-5 w-5 text-indigo-600" />;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
      </div>
      
      {/* Ticket Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">Available Tickets</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-green-900">{activeTickets}</p>
            <p className="text-sm text-green-700 mt-1">Ready for lottery participation</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <div className="bg-orange-100 p-2 rounded-full mr-3">
                <Ticket className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-orange-800">Used Tickets</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-orange-900">{usedTickets}</p>
            <p className="text-sm text-orange-700 mt-1">Used in lottery draws</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-800">Total Tickets</h3>
            </div>
            <p className="text-3xl font-bold mt-2 text-blue-900">{totalTickets}</p>
            <p className="text-sm text-blue-700 mt-1">All time earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Lottery Participation History */}
      {participations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Lottery Participation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participations.map((participation) => (
                <div 
                  key={participation.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Ticket className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-900">
                        Lottery Draw - {formatDate(new Date(participation.draw.drawDate), 'dateOnly')}
                      </h3>
                      <p className="text-sm text-yellow-700">
                        Participated with <span className="font-semibold">{participation.ticketsUsed} tickets</span>
                      </p>
                      <p className="text-sm text-yellow-600">
                        Participated on {formatDate(new Date(participation.participatedAt), 'full')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-800">${participation.draw.prizeAmount}</span>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      participation.draw.status === 'COMPLETED' 
                        ? participation.isWinner 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Ticket History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            Ticket History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <div className="space-y-6 divide-y">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="pt-6 first:pt-0">
                  <div className="flex items-start">
                    <div className="bg-indigo-100 p-2 rounded-full mr-4">
                      {getSourceIcon(ticket.source)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{getSourceLabel(ticket.source)}</h3>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          ticket.isUsed 
                            ? "bg-orange-100 text-orange-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {ticket.isUsed ? "Used in Lottery" : "Available"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Earned on {formatDate(new Date(ticket.createdAt), 'full')}
                      </p>
                      {ticket.drawId && (
                        <p className="text-sm text-blue-600 mt-1">
                          Used in draw: {ticket.drawId.substring(0, 8)}...
                        </p>
                      )}
                      <p className="text-sm mt-2">
                        Ticket ID: <span className="font-mono text-xs">{ticket.id.substring(0, 8)}...</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Ticket className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <p className="text-slate-500 text-lg">You don&apos;t have any tickets yet.</p>
              <p className="mt-2 text-slate-400">Complete surveys, invite friends, or follow us on social media to earn tickets!</p>
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Users className="h-4 w-4 mr-2" />
                    Start Earning Tickets
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tickets by Source */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center p-4 border rounded-md">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <ClipboardCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Survey Tickets</h3>
                <p className="text-2xl font-bold">{ticketsBySource["SURVEY"]?.length || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 border rounded-md">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <Share2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Social Media Tickets</h3>
                <p className="text-2xl font-bold">{ticketsBySource["SOCIAL"]?.length || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 border rounded-md">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Referral Tickets</h3>
                <p className="text-2xl font-bold">{ticketsBySource["REFERRAL"]?.length || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 