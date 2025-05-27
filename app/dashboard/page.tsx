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
import { UserLotteryTickets } from "@/components/dashboard/user-lottery-tickets";
import { NextLotteryDraw } from "@/components/dashboard/next-lottery-draw";
import { RecentWinners } from "@/components/dashboard/recent-winners";
import { WinnerBanner } from "@/components/dashboard/winner-banner";

export const metadata: Metadata = {
  title: "Dashboard | 0mninet Lottery",
  description: "Your lottery dashboard",
};

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    return redirect("/auth/login");
  }

  if (user.isBlocked) {
    return redirect("/auth/blocked");
  }

  // Await searchParams to fix NextJS 15 error
  const resolvedSearchParams = await searchParams;

  // Check if user just completed a survey
  const surveyCompleted = resolvedSearchParams?.survey === 'completed';

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

  // If user is a winner, show 0 applied tickets, otherwise show actual count
  const appliedTickets = isRecentWinner ? 0 : await getUserAppliedTickets(user.id);

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
      <div className="p-6 space-y-6">
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

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {user.name || "User"}!
          </h1>
        </div>

        {/* This Week's Lottery Section */}
        <div className="relative bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 8v6h12V8H4z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">This Week&apos;s Lottery</h2>
                  <p className="text-blue-100 mt-1">
                    Tickets are automatically applied as you earn them
                  </p>
                </div>
              </div>
              
              {/* 0mninet Logo */}
              <div className="flex items-center gap-3">
                <Image
                  src="/main-logo.png"
                  alt="0mninet Logo"
                  width={50}
                  height={50}
                  className="rounded-lg bg-white/10 p-2"
                />
                <div className="text-right">
                  <div className="text-lg font-bold">0mninet</div>
                  <div className="text-sm text-blue-100">Lottery System</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Your Lottery Tickets */}
              <div className="lg:col-span-1">
                <UserLotteryTickets 
                  userId={user.id}
                  appliedTickets={appliedTickets}
                  userParticipation={userParticipation}
                  drawId={draw.id}
                />
              </div>
              
              {/* Next Lottery Draw */}
              <div className="lg:col-span-1">
                <NextLotteryDraw 
                  draw={{
                    id: draw.id,
                    drawDate: draw.drawDate.toISOString(),
                    prizeAmount: draw.prizeAmount,
                    totalTickets: draw.totalTickets,
                    status: draw.status,
                  }}
                  userTickets={appliedTickets}
                  isWinner={isRecentWinner}
                />
              </div>
              
              {/* Recent Winners */}
              <div className="lg:col-span-1">
                <RecentWinners winners={recentWinners} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Earn Tickets Section */}
        <div className="mt-8">
          <EarnTickets userId={user.id} appliedTickets={appliedTickets} />
        </div>

        {/* Newsletter Section */}
        <div className="mt-8">
          <NewsletterSection userId={user.id} />
        </div>
      </div>
    </DashboardWrapper>
  );
} 