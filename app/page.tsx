"use client";

import { Poppins } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/landing/countdown-timer";
import { LotteryStats } from "@/components/landing/lottery-stats";
import { cn } from "@/lib/utils";
import { Globe, Gift, Users, Share, CheckCircle } from "lucide-react";

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
  
  // Card images for visual showcase
  const cardItems = [
    {
      title: "Global Connection",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
    },
    {
      title: "Amazon Gift Card",
      image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&auto=format&fit=crop",
    },
    {
      title: "Digital Access",
      image: "https://images.unsplash.com/photo-1573164713712-03790a178651?w=800&auto=format&fit=crop",
    },
    {
      title: "Connected World",
      image: "https://images.unsplash.com/photo-1451187863213-d1bcbaae3fa3?w=800&auto=format&fit=crop",
    },
  ];
  
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
          
          // Calculate next Thursday at 18:30
          const now = new Date();
          const nextThursday = new Date(now);
          nextThursday.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
          nextThursday.setHours(18, 30, 0, 0);
          
          if (nextThursday <= now) {
            nextThursday.setDate(nextThursday.getDate() + 7);
          }
          
          setNextDrawDate(nextThursday);
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-900">
        <div className="text-white text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <main className="overflow-hidden">
      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen flex flex-col justify-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <video 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&auto=format&fit=crop"
          >
            <source src="/videos/network.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 z-20 py-6 px-4 md:px-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-white mr-2" />
              <span className={cn("text-2xl font-bold text-white", font.className)}>0mninet</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:bg-white/20 border border-white/30">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-white text-indigo-700 hover:bg-white/90">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <h1 className={cn(
            "text-4xl md:text-6xl font-bold mb-6 text-white max-w-4xl leading-tight",
            font.className,
          )}>
            Support the Free Internet Revolution.
            Win a $50 Amazon Gift Card Every Week.
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl text-white/90">
            Join the weekly lottery, earn tickets by completing surveys, and help bring free
            internet to the world.
          </p>
          
          {/* Countdown Timer */}
          <div className="w-full max-w-xl mb-12">
            <p className="text-white text-xl mb-4">Next Draw In:</p>
            <CountdownTimer targetDate={nextDrawDate} theme="dark" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-slate-100 text-lg px-8 py-6 h-auto font-semibold">
                Join the Lottery Now
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20 text-lg px-8 py-6 h-auto font-semibold">
                My Account
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Bottom Stats Bar */}
        <div className="relative z-10 w-full bg-white/10 backdrop-blur-md border-t border-white/20 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center">
              <Users className="h-6 w-6 text-white mr-3" />
              <div className="text-white">
                <p className="font-medium">{stats.totalUsers}+ Participants</p>
                <p className="text-sm text-white/70">Growing community</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Gift className="h-6 w-6 text-white mr-3" />
              <div className="text-white">
                <p className="font-medium">$50 Gift Card</p>
                <p className="text-sm text-white/70">Every Thursday</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white mr-3" />
              <div className="text-white">
                <p className="font-medium">Last Winner: {stats.latestWinner}</p>
                <p className="text-sm text-white/70">Join to be next</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Cards Section - Static Version */}
      <div className="bg-gradient-to-b from-indigo-50 to-white py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={cn(
                "text-3xl md:text-4xl font-bold mb-6 text-gray-900",
                font.className,
              )}>
                Why Join the 0mninet Lottery?
              </h2>
              <p className="text-lg md:text-xl mb-8 text-gray-700">
                Every ticket you earn helps 0mninet grow. You're not just entering a draw — you're joining a
                global mission to make internet access free and accessible for all.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2 rounded-full mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Empower digital inclusion</h3>
                    <p className="text-gray-600">Support initiatives that break down barriers to internet access worldwide.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2 rounded-full mr-4 mt-1">
                    <Globe className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Support connectivity in underserved regions</h3>
                    <p className="text-gray-600">Help build infrastructure where traditional networks don't reach.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2 rounded-full mr-4 mt-1">
                    <Gift className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Win real rewards while helping a real cause</h3>
                    <p className="text-gray-600">Get a chance to win Amazon gift cards while contributing to meaningful change.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <Link href="/auth/register">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-3">
                    Be Part of the Change
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Static grid of images replacing the draggable cards */}
            <div className="grid grid-cols-2 gap-6">
              {cardItems.map((item, index) => (
                <div 
                  key={index}
                  className="relative overflow-hidden rounded-xl shadow-lg transition-transform hover:scale-105 duration-300"
                >
                  <div className="relative h-56 w-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <h3 className="text-white font-semibold text-xl">{item.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className={cn(
            "text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900",
            font.className,
          )}>
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 shadow-lg text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Complete Surveys</h3>
                <p className="text-gray-700">Answer surveys to earn lottery tickets and support digital inclusion efforts around the world.</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 shadow-lg text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Invite Friends</h3>
                <p className="text-gray-700">Earn more tickets by inviting friends to join the platform and expand our community.</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 shadow-lg text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Win Prizes</h3>
                <p className="text-gray-700">Join weekly draws to win a $50 Amazon gift card every Thursday at 18:30 IST.</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-10 py-6 h-auto">
                Join the Lottery Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats & Current Draw Section */}
      <div className="bg-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={cn(
                "text-3xl md:text-4xl font-bold mb-8",
                font.className,
              )}>
                This Week's Draw
              </h2>
              
              <div className="bg-indigo-800/50 backdrop-blur-md rounded-xl p-8 border border-indigo-700">
                <LotteryStats
                  totalUsers={stats.totalUsers}
                  totalTickets={stats.totalTickets}
                  prizeAmount={50}
                  latestWinner={stats.latestWinner}
                  theme="dark"
                />
                
                <div className="mt-8 pt-6 border-t border-indigo-700">
                  <p className="text-xl font-semibold mb-4">Drawing on Thursday, 18:30 IST</p>
                  <CountdownTimer targetDate={nextDrawDate} theme="dark" />
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-800/50 backdrop-blur-md rounded-xl p-8 border border-indigo-700">
              <h3 className="text-2xl font-semibold mb-6">Ready to Win While Making a Difference?</h3>
              <p className="text-lg mb-8">
                The 0mninet lottery combines philanthropy with rewards. Every survey you complete helps fund internet infrastructure in underserved areas.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Weekly drawings every Thursday</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>$50 Amazon gift card for winners</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Multiple ways to earn tickets</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Support global internet accessibility</span>
                </li>
              </ul>
              <Link href="/auth/register">
                <Button size="lg" className="w-full bg-white text-indigo-700 hover:bg-white/90">
                  Sign Up Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className={cn(
            "text-3xl md:text-4xl font-bold mb-6 text-gray-900",
            font.className,
          )}>
            Join the 0mninet Movement Today
          </h2>
          <p className="text-xl mb-10 text-gray-700 max-w-3xl mx-auto">
            Be part of a community that's revolutionizing internet access while winning rewards. Your participation matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-3">
                Join the Lottery
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg px-8 py-3">
                Access Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// Trophy component
function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
