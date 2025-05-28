import { redirect } from "next/navigation";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats } from "@/components/admin/admin-stats";
import { RecentWinnersList } from "@/components/admin/recent-winners-list";
import { ToastTest } from "@/components/admin/toast-test";
import { 
  Users, 
  Ticket, 
  Gift, 
  Calendar,
  TrendingUp,
  DollarSign,
  Mail
} from "lucide-react";
import Image from "next/image";
import { initializeDefaultSettings } from "@/lib/settings";
import { getCurrentDrawWithAccurateTickets } from "@/lib/draw-utils";

// Mark this page as dynamically rendered to avoid the headers() warning
export const dynamic = 'force-dynamic';

/**
 * Admin Dashboard page with comprehensive overview
 */
export default async function AdminPage() {
  try {
    // Check if user is admin
    const role = await currentRole();
    
    if (role !== UserRole.ADMIN) {
      return redirect("/dashboard");
    }

    // Initialize default settings
    await initializeDefaultSettings();

    // Fetch dashboard data with error handling
    const [
      totalUsers,
      activeUsers,
      totalTickets,
      appliedTickets,
      totalWinners,
      unclaimedPrizes,
      recentWinners,
      newsletterSubscribers
    ] = await Promise.allSettled([
      // Total users
      db.user.count(),
      
      // Active users (last 7 days)
      db.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total tickets
      db.ticket.count(),
      
      // Applied tickets (all tickets since they're all applied)
      db.ticket.count(),
      
      // Total winners
      db.winner.count(),
      
      // Unclaimed prizes
      db.winner.count({
        where: {
          claimed: false
        }
      }),
      
      // Recent winners (last 5)
      db.winner.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            }
          }
        }
      }),
      
      // Newsletter subscribers count
      db.user.count({
        where: {
          newsletterSubscribed: true
        }
      })
    ]);

    // Extract values with fallbacks
    const totalUsersCount = totalUsers.status === 'fulfilled' ? totalUsers.value : 0;
    const activeUsersCount = activeUsers.status === 'fulfilled' ? activeUsers.value : 0;
    const totalTicketsCount = totalTickets.status === 'fulfilled' ? totalTickets.value : 0;
    const appliedTicketsCount = appliedTickets.status === 'fulfilled' ? appliedTickets.value : 0;
    const totalWinnersCount = totalWinners.status === 'fulfilled' ? totalWinners.value : 0;
    const unclaimedPrizesCount = unclaimedPrizes.status === 'fulfilled' ? unclaimedPrizes.value : 0;
    const recentWinnersList = recentWinners.status === 'fulfilled' ? recentWinners.value : [];
    const newsletterSubscribersCount = newsletterSubscribers.status === 'fulfilled' ? newsletterSubscribers.value : 0;

    // Get active draw with accurate ticket count using the utility function
    const activeDraw = await getCurrentDrawWithAccurateTickets();

    // Get participants information
    const participants = activeDraw ? await db.drawParticipation.findMany({
      where: { drawId: activeDraw.id },
    }) : [];

    // Calculate total prize amount with error handling
    let totalPrizeAmount = 0;
    try {
      const totalPrizeData = await db.winner.aggregate({
        _sum: {
          prizeAmount: true
        }
      });
      totalPrizeAmount = totalPrizeData._sum.prizeAmount || 0;
    } catch (error) {
      console.error("Error calculating total prize amount:", error);
    }

    // Prepare active draw data with participants information
    const activeDrawData = activeDraw ? {
      ...activeDraw,
      participants: participants
    } : null;

    return (
      <div className="p-6 space-y-6">
        {/* Toast Test Component - Remove this after testing */}
        <ToastTest />
        
        {/* Header Section with 0mninet Branding */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-lg">
                <Image
                  src="/main-logo.png"
                  alt="0mninet Logo"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">0mninet Admin Dashboard</h1>
                <p className="text-indigo-100 mt-2">
                  Global Connectivity Platform • Lottery Management System
                </p>
                <p className="text-sm text-indigo-200 mt-1">
                  Building the Future of Internet Access
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-2xl font-bold">${activeDrawData?.prizeAmount || 50}</p>
                <p className="text-sm text-indigo-200">Current Prize Pool</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStats
            totalUsers={totalUsersCount}
            activeUsers={activeUsersCount}
            totalTickets={totalTicketsCount}
            unusedTickets={appliedTicketsCount}
            totalWinners={totalWinnersCount}
            unclaimedPrizes={unclaimedPrizesCount}
          />
          
          {/* Newsletter Subscribers Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Newsletter</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold">{newsletterSubscribersCount}</h3>
                    <span className="text-xs text-green-600">subscribers</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm font-medium text-indigo-700">Mission</span>
                  <span className="text-xs text-indigo-600">Global Internet</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-purple-700">Vision</span>
                  <span className="text-xs text-purple-600">Free Connectivity</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Platform</span>
                  <span className="text-xs text-green-600">Lottery System</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-slate-700 mb-2">Key Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Revenue</span>
                    <span className="text-sm font-medium">${totalPrizeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Active Draws</span>
                    <span className="text-sm font-medium">{activeDrawData ? 1 : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Participants</span>
                    <span className="text-sm font-medium">{activeDrawData?.participants.length || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Draw Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Next Draw
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeDrawData ? (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <span className="text-3xl font-bold text-green-700">
                        ${activeDrawData.prizeAmount}
                      </span>
                    </div>
                    <p className="text-sm text-purple-600 font-medium">Prize Amount</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{activeDrawData.participants.length}</p>
                      <p className="text-xs text-slate-500">Participants</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{activeDrawData.totalTickets}</p>
                      <p className="text-xs text-slate-500">Total Tickets</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-slate-600">
                      Scheduled: {activeDrawData.drawDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No active draws scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Winners */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-yellow-600" />
                Recent Winners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentWinnersList winners={recentWinnersList} />
            </CardContent>
          </Card>
        </div>

        {/* Platform Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Health & Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">
                  {totalUsersCount > 0 ? ((activeUsersCount / totalUsersCount) * 100).toFixed(1) : "0"}%
                </p>
                <p className="text-sm text-blue-600">User Activity Rate</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Ticket className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{appliedTicketsCount}</p>
                <p className="text-sm text-green-600">Applied Tickets</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Gift className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700">{unclaimedPrizesCount}</p>
                <p className="text-sm text-yellow-600">Unclaimed Prizes</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">
                  {totalUsersCount > 0 ? ((newsletterSubscribersCount / totalUsersCount) * 100).toFixed(1) : "0"}%
                </p>
                <p className="text-sm text-purple-600">Newsletter Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error in admin dashboard:", error);
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Dashboard Error</h1>
            <p className="text-slate-600">There was an error loading the admin dashboard. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
} 