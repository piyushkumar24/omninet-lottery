"use client";

import { Poppins } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/landing/countdown-timer";
import { LotteryStats } from "@/components/landing/lottery-stats";
import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"]
});

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    latestWinner: "No winner yet"
  });
  const [nextDrawDate, setNextDrawDate] = useState(new Date());
  
  useEffect(() => {
    // Check for referral code in URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store the referral code in localStorage for use during registration
      localStorage.setItem('referralCode', refCode);
    }
    
    // Check if the user is already signed in
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          console.error("Session API returned an error:", response.status);
          return;
        }
        
        const data = await response.json();
        
        // Check if data and data.user exist before accessing
        if (data && data.user) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch lottery stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
          console.error("Stats API returned an error:", response.status);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStats({
            totalUsers: data.totalUsers,
            totalTickets: data.totalTickets,
            latestWinner: data.latestWinner || "No winner yet"
          });
          setNextDrawDate(new Date(data.nextDrawDate));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    // Run these functions in sequence to avoid race conditions
    const initializeApp = async () => {
      await checkSession();
      if (!isLoading) {
        await fetchStats();
      }
    };
    
    initializeApp();
  }, [router, searchParams, isLoading]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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
                totalUsers={stats.totalUsers}
                totalTickets={stats.totalTickets}
                prizeAmount={50}
                latestWinner={stats.latestWinner}
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
