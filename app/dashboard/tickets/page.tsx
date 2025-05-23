import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketSource } from "@prisma/client";
import { Ticket, ClipboardCheck, Share, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Tickets | Social Lottery",
  description: "View your lottery tickets",
};

const getSourceIcon = (source: TicketSource) => {
  switch (source) {
    case "SURVEY":
      return <ClipboardCheck className="h-5 w-5 text-indigo-600" />;
    case "SOCIAL":
      return <Share className="h-5 w-5 text-indigo-600" />;
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
      return "Social Share";
    case "REFERRAL":
      return "Friend Referral";
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

  // Fetch user's tickets with details
  const tickets = await db.ticket.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Group tickets by source
  const ticketsBySource = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.source]) {
      acc[ticket.source] = [];
    }
    acc[ticket.source].push(ticket);
    return acc;
  }, {} as Record<TicketSource, typeof tickets>);

  // Calculate stats
  const activeTickets = tickets.filter(ticket => !ticket.isUsed).length;
  const usedTickets = tickets.filter(ticket => ticket.isUsed).length;
  const totalTickets = tickets.length;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <div className="bg-indigo-100 p-2 rounded-full mr-3">
                <Ticket className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold">Active Tickets</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{activeTickets}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <div className="bg-slate-100 p-2 rounded-full mr-3">
                <Ticket className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold">Used Tickets</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{usedTickets}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Total Tickets</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{totalTickets}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ticket History</CardTitle>
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
                            ? "bg-slate-100 text-slate-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {ticket.isUsed ? "Used" : "Active"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Earned on {formatDate(new Date(ticket.createdAt), 'full')}
                      </p>
                      <p className="text-sm mt-2">
                        Ticket ID: <span className="font-mono text-xs">{ticket.id.substring(0, 8)}...</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500">You don't have any tickets yet.</p>
              <p className="mt-2">Complete surveys, refer friends, or share on social media to earn tickets!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
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
                <Share className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Social Tickets</h3>
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