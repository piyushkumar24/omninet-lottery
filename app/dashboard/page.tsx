import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TicketStats } from "@/components/dashboard/ticket-stats";
import { NextDraw } from "@/components/dashboard/next-draw";
import { EarnTickets } from "@/components/dashboard/earn-tickets";
import { RecentWinners } from "@/components/dashboard/recent-winners";
import { LotteryParticipationWrapper } from "@/components/lottery/lottery-participation-wrapper";
import { createOrGetNextDraw, getUserParticipationInDraw } from "@/data/draw";
import { getUserAvailableTickets } from "@/lib/ticket-utils";
import { SurveyCompletionAlert } from "@/components/dashboard/survey-completion-alert";

export const metadata: Metadata = {
  title: "Dashboard | Social Lottery",
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

  // Get user's available tickets using utility function
  const tickets = await getUserAvailableTickets(user.id);

  // Fetch total available tickets for winning chance calculation
  const totalAvailableTickets = await db.ticket.count({
    where: {
      isUsed: false,
    },
  });

  // Calculate winning chance
  const winningChance = tickets > 0 && totalAvailableTickets > 0
    ? ((tickets / totalAvailableTickets) * 100).toFixed(2)
    : "0";
  
  // Get next Thursday draw date
  const nextDraw = getNextThursday();

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

  // Get or create next lottery draw
  const draw = await createOrGetNextDraw();
  
  // Get user's participation in the current draw
  const userParticipation = await getUserParticipationInDraw(user.id, draw.id);

  return (
    <div className="p-6 space-y-6">
      {/* Survey Completion Alert */}
      {surveyCompleted && <SurveyCompletionAlert />}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user.name || "User"}!
        </h1>
      </div>

      {/* Lottery Participation Section */}
      <div className="mb-8">
        <LotteryParticipationWrapper
          availableTickets={tickets}
          draw={{
            id: draw.id,
            drawDate: draw.drawDate.toISOString(),
            prizeAmount: draw.prizeAmount,
            totalTickets: draw.totalTickets,
            participants: draw.participants,
          }}
          userParticipation={userParticipation}
        />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TicketStats tickets={tickets} winningChance={winningChance} />
        <NextDraw nextDraw={nextDraw} tickets={tickets} />
        
        <div className="lg:col-span-1 md:col-span-2 lg:row-span-2">
          <RecentWinners winners={recentWinners} />
        </div>
      </div>
      
      {/* Earn Tickets Section */}
      <div className="mt-6">
        <EarnTickets userId={user.id} availableTickets={tickets} />
      </div>
    </div>
  );
}

function getNextThursday() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  
  // If it's Thursday but after 18:30 IST, get next Thursday
  if (daysUntilThursday === 0) {
    const istHour = now.getUTCHours() + 5.5; // IST is UTC+5:30
    if (istHour >= 18.5) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 30);
    }
  }
  
  const nextThursday = new Date(now);
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  nextThursday.setHours(18, 30, 0, 0);
  
  return nextThursday;
} 