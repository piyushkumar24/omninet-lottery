import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import { EarnTickets } from "@/components/dashboard/earn-tickets";
import { NewsletterSection } from "@/components/dashboard/newsletter-cta";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { createOrGetNextDraw, getUserParticipationInDraw } from "@/data/draw";
import { getUserAppliedTickets } from "@/lib/ticket-utils";
import { SurveyCompletionAlert } from "@/components/dashboard/survey-completion-alert";
import { NonWinnerBonusAlert } from "@/components/dashboard/NonWinnerBonusAlert";
import { UserLotteryTickets } from "@/components/dashboard/user-lottery-tickets";
import { RecentWinners } from "@/components/dashboard/recent-winners";
import { WinnerBanner } from "@/components/dashboard/winner-banner";
import { LotteryCountdown } from "@/components/dashboard/lottery-countdown";
import { unstable_noStore } from "next/cache";

export const metadata: Metadata = {
  title: "Dashboard | 0mninet Lottery",
  description: "Your lottery dashboard",
};

// Disable caching for this page to ensure fresh ticket data
export const dynamic = "force-dynamic";
export const revalidate = 0; 

interface DashboardPageProps {
  searchParams: Promise<{
    survey_completed?: string;
    source?: string;
    token?: string;
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Disable caching to ensure fresh data
  unstable_noStore();
  
  const user = await getCurrentUser();
  
  if (!user) {
    return redirect("/auth/login");
  }

  if (user.isBlocked) {
    return redirect("/auth/blocked");
  }

  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  // Check if user arrived from survey completion
  const surveyCompleted = params.survey_completed === "true";
  
  // Check if user arrived from non-winner email
  const fromNonWinnerEmail = params.source === "non_winner_email";
  const nonWinnerToken = params.token;

  // Get or create next lottery draw
  const draw = await createOrGetNextDraw();
  
  // Get user's participation in the current draw
  const userParticipation = await getUserParticipationInDraw(user.id, draw.id);

  // Check if user was a winner in any completed draw
  const userWinner = await db.winner.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      drawDate: 'desc',
    }
  });

  // Determine if the user is a recent winner (within the last 7 days)
  const isRecentWinner = !!userWinner && 
    (new Date().getTime() - new Date(userWinner.drawDate).getTime()) < 7 * 24 * 60 * 60 * 1000;

  // Get fresh user data with tickets directly from the database
  const timestamp = Date.now();
  const userWithTickets = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      hasWon: true,
      availableTickets: true,
      totalTicketsEarned: true,
    }
  });

  const availableTickets = userWithTickets?.availableTickets || 0;
  const totalTicketsEarned = userWithTickets?.totalTicketsEarned || 0;

  console.log(`[${timestamp}] Dashboard - User ${user.id} has ${availableTickets} available tickets, ${totalTicketsEarned} total earned`);

  // Get recent winners
  const recentWinners = await db.winner.findMany({
    take: 5,
    orderBy: {
      drawDate: 'desc',
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return (
    <DashboardWrapper>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Winner Banner */}
        {user.hasWon && userWinner && (
          <WinnerBanner 
            prizeAmount={userWinner.prizeAmount}
            drawDate={userWinner.drawDate}
            couponCode={userWinner.couponCode}
            winnerId={userWinner.id}
          />
        )}

        {/* Survey Completion Alert */}
        {surveyCompleted && <SurveyCompletionAlert />}

        {/* Non-Winner Bonus Alert */}
        {fromNonWinnerEmail && nonWinnerToken && (
          <NonWinnerBonusAlert />
        )}

        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome, {user.name || "User"}!
          </h1>
        </div>

        {/* This Week's Lottery Section */}
        <div className="relative bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Main Content Grid */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Lottery Countdown - New Component */}
              <div className="w-full lg:col-span-1">
                <LotteryCountdown 
                  userId={user.id}
                  prizeAmount={draw.prizeAmount}
                />
              </div>
              
              {/* Your Lottery Tickets */}
              <div className="w-full lg:col-span-1">
                <UserLotteryTickets 
                  userId={user.id}
                  appliedTickets={availableTickets}
                  userParticipation={userParticipation}
                  drawId={draw.id}
                  surveyCompleted={surveyCompleted}
                  totalTicketsInDraw={draw.totalTickets || 1}
                />
              </div>
              
              {/* Recent Winners */}
              <div className="w-full lg:col-span-1">
                <RecentWinners winners={recentWinners} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Earn Tickets Section */}
        <div id="earn-tickets-section" className="mt-4 md:mt-8">
          <EarnTickets userId={user.id} appliedTickets={availableTickets} />
        </div>

        {/* Newsletter Section */}
        <div className="mt-4 md:mt-8">
          <NewsletterSection userId={user.id} />
        </div>
      </div>
    </DashboardWrapper>
  );
} 