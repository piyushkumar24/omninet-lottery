import { Poppins } from "next/font/google";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/landing/countdown-timer";
import { LotteryStats } from "@/components/landing/lottery-stats";
import { db } from "@/lib/db";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"]
});

export default async function Home() {
  // Check if the user is already signed in
  const session = await auth();
  
  // If signed in, redirect to dashboard
  if (session?.user) {
    return redirect("/dashboard");
  }

  // Get next Thursday at 18:30 IST
  const nextDrawDate = getNextThursday();
  
  // Get lottery stats
  const totalUsers = await db.user.count();
  const totalTickets = await db.ticket.count({ 
    where: { isUsed: false }
  });
  
  const latestWinner = await db.winner.findFirst({
    orderBy: { drawDate: 'desc' },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <h1 className={cn(
            "text-4xl md:text-6xl font-bold mb-6",
            font.className,
          )}>
            Reward-Based Social Lottery
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl">
            Support free internet access by completing surveys and earn tickets to win a $50 Amazon gift card
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-indigo-700 hover:bg-slate-100 text-lg px-8 py-6 h-auto font-semibold">
              Join the Lottery Now
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Countdown Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Next Draw: Thursday 18:30 IST</h2>
              <CountdownTimer targetDate={nextDrawDate} />
              <div className="mt-6 text-center">
                <Link href="/auth/login">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Sign In to Participate
                  </Button>
                </Link>
              </div>
            </div>
            <div className="border-t md:border-l md:border-t-0 md:pl-8 pt-6 md:pt-0">
              <h3 className="text-xl font-bold mb-4">Current Draw</h3>
              <LotteryStats
                totalUsers={totalUsers}
                totalTickets={totalTickets}
                prizeAmount={50}
                latestWinner={latestWinner?.user.name || "No winner yet"}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Complete Surveys</h3>
            <p className="text-slate-600">Answer surveys to earn lottery tickets and support digital inclusion</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Invite Friends</h3>
            <p className="text-slate-600">Earn more tickets by inviting friends to join the platform</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 text-xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Win Prizes</h3>
            <p className="text-slate-600">Join weekly draws to win a $50 Amazon gift card every Thursday</p>
          </div>
        </div>
      </div>
    </main>
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
