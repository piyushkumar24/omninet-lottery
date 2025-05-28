import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsletterTable } from "@/components/admin/newsletter-table";
import { 
  Mail, 
  Users, 
  TrendingUp,
  Calendar
} from "lucide-react";

export const metadata: Metadata = {
  title: "Newsletter Management | 0mninet Admin",
  description: "Manage newsletter subscribers and communications",
};

export default async function NewsletterPage() {
  // Get all newsletter subscribers
  const newsletterSubscribers = await db.user.findMany({
    where: {
      newsletterSubscribed: true
    },
    orderBy: {
      updatedAt: "desc" // Order by when they last updated (likely when they subscribed)
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tickets: true
        }
      }
    }
  });

  // Get newsletter statistics
  const [
    totalUsers,
    totalSubscribers,
    recentSubscribers,
    subscribersWithTickets
  ] = await Promise.all([
    // Total users count
    db.user.count(),
    
    // Total newsletter subscribers
    db.user.count({
      where: {
        newsletterSubscribed: true
      }
    }),
    
    // Recent subscribers (last 7 days)
    db.user.count({
      where: {
        newsletterSubscribed: true,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    
    // Subscribers who also have tickets
    db.user.count({
      where: {
        newsletterSubscribed: true,
        tickets: {
          some: {}
        }
      }
    })
  ]);

  // Calculate subscription rate
  const subscriptionRate = totalUsers > 0 ? ((totalSubscribers / totalUsers) * 100).toFixed(1) : "0";

  // Format subscriber data for the table
  const formattedSubscribers = newsletterSubscribers.map(subscriber => ({
    id: subscriber.id,
    name: subscriber.name || "No Name",
    email: subscriber.email || "No Email",
    subscribedAt: subscriber.updatedAt, // Using updatedAt as proxy for subscription date
    joinedAt: subscriber.createdAt,
    ticketCount: subscriber._count.tickets,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Management</h1>
          <p className="text-slate-600 mt-1">
            Manage newsletter subscribers and track engagement metrics
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Subscribers</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">{totalSubscribers}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {subscriptionRate}% rate
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-2 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Recent Subscribers</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">{recentSubscribers}</h3>
                  <span className="text-xs text-green-600">last 7 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Participants</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">{subscribersWithTickets}</h3>
                  <span className="text-xs text-purple-600">with tickets</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-2 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Engagement Rate</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">
                    {totalSubscribers > 0 ? ((subscribersWithTickets / totalSubscribers) * 100).toFixed(1) : "0"}%
                  </h3>
                  <span className="text-xs text-orange-600">participation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              Newsletter Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
                <div>
                  <p className="font-medium text-indigo-800">Subscription Rate</p>
                  <p className="text-sm text-indigo-600">
                    {totalSubscribers} of {totalUsers} users subscribed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-700">{subscriptionRate}%</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Active Engagement</p>
                  <p className="text-sm text-green-600">
                    Subscribers who participate in lottery
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    {totalSubscribers > 0 ? ((subscribersWithTickets / totalSubscribers) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-800">Growth Rate</p>
                  <p className="text-sm text-purple-600">
                    New subscribers this week
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-700">{recentSubscribers}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Subscribers</CardTitle>
          <p className="text-sm text-slate-600">
            All users who have opted in to receive newsletter updates
          </p>
        </CardHeader>
        <CardContent>
          <NewsletterTable subscribers={formattedSubscribers} />
        </CardContent>
      </Card>
    </div>
  );
} 