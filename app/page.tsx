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
import { Globe, Gift, Users, Share, CheckCircle, ArrowRight, Play, User, Trophy, Star, Heart, Zap, TrendingUp, MapPin, Award, Target, Activity, ChevronDown, ChevronUp, HelpCircle, Mail, Clock, MessageCircle, Facebook, Instagram, Youtube, ExternalLink } from "lucide-react";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"]
});

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    latestWinner: "No winner yet",
    latestWinnerProfile: null as { name: string; username: string; profileImage?: string } | null
  });
  const [nextDrawDate, setNextDrawDate] = useState(new Date());
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Professional showcase images
  const showcaseImages = [
    {
      title: "Global Connectivity",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      description: "Connecting people worldwide through technology"
    },
    {
      title: "World Map Network",
      image: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      description: "Building global internet infrastructure"
    },
    {
      title: "Digital Infrastructure",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      description: "Advancing global internet infrastructure"
    },
    {
      title: "Amazon Gift Cards",
      image: "https://images.unsplash.com/photo-1607734834519-d8576ae60ea4?w=800&auto=format&fit=crop&ixlib=rb-4.0.3",
      description: "Win $50 Amazon gift cards weekly"
    },
  ];
  
  useEffect(() => {
    // Check for referral code in URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
    }
    
    // Check if the user is already signed in
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          console.error("Session API returned an error:", response.status);
          setIsAuthenticated(false);
          return;
        }
        
        const data = await response.json();
        
        if (data && data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch lottery stats
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
          console.error("Stats API returned an error:", response.status);
          setError("Failed to load lottery stats");
          return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setError("Expected JSON response but got " + contentType);
          return;
        }
        
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          
          if (data.success) {
            setStats({
              totalUsers: data.totalUsers || 0,
              totalTickets: data.totalTickets || 0,
              latestWinner: data.latestWinner || "No winner yet",
              latestWinnerProfile: data.latestWinnerProfile || null
            });
            
            if (data.nextDrawDate) {
              setNextDrawDate(new Date(data.nextDrawDate));
            } else {
              const now = new Date();
              const nextThursday = new Date(now);
              const dayOfWeek = now.getDay(); 
              const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
              nextThursday.setDate(now.getDate() + daysUntilThursday);
              nextThursday.setUTCHours(13, 0, 0, 0);
              
              if (nextThursday <= now) {
                nextThursday.setDate(nextThursday.getDate() + 7);
              }
              
              setNextDrawDate(nextThursday);
            }
          } else {
            setError(data.message || "Failed to load lottery stats");
          }
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          setError(`Failed to parse response as JSON: ${text.substring(0, 100)}...`);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError("Network error while fetching lottery stats");
      }
    };
    
    const initializeApp = async () => {
      await checkSession();
        await fetchStats();
    };
    
    initializeApp();
  }, [router, searchParams]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600 text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen flex flex-col justify-center">
        {/* Enhanced Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/50 to-indigo-900/60 z-10"></div>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&auto=format&fit=crop"
          >
            <source src="/videos/network.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Modern Top Navigation */}
        <div className="absolute top-0 left-0 right-0 z-20 py-6 px-4 md:px-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center group">
              <div className="bg-white/10 backdrop-blur-md rounded-full p-2 mr-3 group-hover:bg-white/20 transition-all duration-300">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <span className={cn("text-2xl font-bold text-white", font.className)}>0mninet</span>
            </div>
            <div className="flex items-center gap-4">
              {!isAuthenticated ? (
                <>
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 border-2 border-white/30 hover:border-white/50 backdrop-blur-md transition-all duration-300 hover:scale-105 font-semibold"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth/register">
                    <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold">
                  <span>Sign Up</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
                </>
              ) : (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold">
                    <User className="mr-2 h-4 w-4" />
                    <span>My Account</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Free Internet Revolution
            </div>
          </div>
          
          <h1 className={cn(
            "text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white max-w-5xl leading-tight",
            font.className,
          )}>
            Support the Free Internet Revolution.
            <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Win a $50 Amazon Gift Card Every Week.
            </span>
          </h1>
          
          <p className="text-md md:text-xl mb-12 max-w-2xl text-white/90 leading-relaxed">
            Join the weekly lottery, earn tickets by completing surveys, and help bring free internet to the world.
          </p>
          
          {/* Enhanced Countdown Timer */}
          <div className="w-full max-w-xl mb-12">
            <CountdownTimer targetDate={nextDrawDate} theme="dark" />
          </div>
          
          {/* Improved Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            {!isAuthenticated ? (
              <>
            <Link href="/auth/register">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-none shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 text-lg px-10 py-6 h-auto font-semibold hover:scale-105 group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Join the Lottery Now
              </Button>
            </Link>
                <Link href="/auth/login">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 backdrop-blur-md text-lg px-10 py-6 h-auto font-semibold transition-all duration-300 hover:scale-105"
              >
                    Log In
              </Button>
            </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 text-lg px-10 py-6 h-auto font-semibold hover:scale-105 group"
                >
                  <User className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
          
          {/* Trust indicators */}
          <div className="flex items-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">Verified Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">Weekly Draws</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">Real Impact</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Bottom Stats Bar */}
        <div className="relative z-10 w-full bg-white/5 backdrop-blur-xl border-t border-white/10 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center group">
              <div className="bg-white/10 rounded-full p-3 mr-4 group-hover:bg-white/20 transition-all duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold text-lg">{stats.totalUsers}+ Participants</p>
                <p className="text-sm text-white/70">Growing daily</p>
              </div>
            </div>
            <div className="flex items-center justify-center group">
              <div className="bg-white/10 rounded-full p-3 mr-4 group-hover:bg-white/20 transition-all duration-300">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold text-lg">$50 Gift Card</p>
                <p className="text-sm text-white/70">Every Thursday</p>
              </div>
            </div>
            <div className="flex items-center justify-center group">
              <div className="bg-white/10 rounded-full p-3 mr-4 group-hover:bg-white/20 transition-all duration-300">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold text-lg">Last Winner: {stats.latestWinner}</p>
                <p className="text-sm text-white/70">You could be next</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Professional Showcase Section */}
      <div className="bg-gradient-to-br from-white to-slate-50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                Why Join the 0mninet Lottery?
              </div>
              
              <h2 className={cn(
                "text-4xl md:text-5xl font-bold mb-8 text-slate-900 leading-tight",
                font.className,
              )}>
                Making Internet Access a
                <span className="block text-emerald-600">Global Reality</span>
              </h2>
              
              <p className="text-xl mb-10 text-slate-600 leading-relaxed">
              Every ticket you earn helps 0mninet grow. You&apos;re not just entering a draw — you&apos;re joining a
              global mission to make internet access free and accessible for all.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start group">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl mr-6 mt-1 transform transition-all duration-500 group-hover:scale-110 shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">Digital Inclusion Initiative</h3>
                    <p className="text-slate-600 leading-relaxed">Supporting technology infrastructure that bridges the digital divide in remote and underserved regions.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl mr-6 mt-1 transform transition-all duration-500 group-hover:scale-110 shadow-lg">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">Global Connectivity Network</h3>
                    <p className="text-slate-600 leading-relaxed">Building sustainable internet infrastructure where traditional networks cannot reach.</p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl mr-6 mt-1 transform transition-all duration-500 group-hover:scale-110 shadow-lg">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">Rewarding Participation</h3>
                    <p className="text-slate-600 leading-relaxed">Earn real Amazon gift cards while contributing to meaningful social impact initiatives.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12">
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-10 py-4 shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 font-semibold">
                      Be Part of the Change
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Professional Image Grid */}
            <div className="grid grid-cols-2 gap-6">
              {showcaseImages.map((item, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  <div className="aspect-square relative">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-white/90 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      
      {/* Enhanced Current Draw Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm font-medium mb-8">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                Global Lottery Dashboard
              </div>
              
              <h2 className={cn(
                "text-4xl md:text-5xl font-bold mb-8 leading-tight",
                font.className,
              )}>
                This Week&apos;s
                <span className="block text-emerald-400">Prize Draw</span>
              </h2>
              
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-300">
                <LotteryStats
                  totalUsers={stats.totalUsers}
                  totalTickets={stats.totalTickets}
                  prizeAmount={50}
                  latestWinner={stats.latestWinner}
                  latestWinnerProfile={stats.latestWinnerProfile}
                  theme="dark"
                />
                
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-xl font-semibold">Drawing on Thursday, 18:30 IST</p>
                  </div>
                  <CountdownTimer targetDate={nextDrawDate} theme="dark" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl">
              <h3 className="text-3xl font-bold mb-8">Ready to Win While Making an Impact?</h3>
              <p className="text-xl mb-10 text-white/90 leading-relaxed">
                The 0mninet lottery uniquely combines social impact with personal rewards. 
                Every survey helps fund internet infrastructure in underserved areas.
              </p>
              
              <div className="space-y-6 mb-10">
                {[
                  "Weekly drawings every Thursday at 18:30 IST",
                  "$50 Amazon gift cards for winners",
                  "Multiple ways to earn additional tickets", 
                  "Direct contribution to global internet accessibility"
                ].map((item, index) => (
                  <div key={index} className="flex items-center group">
                    <div className="bg-emerald-500/20 rounded-full p-1 mr-4 group-hover:bg-emerald-500/30 transition-colors">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-white/90 group-hover:text-white transition-colors">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link href="/auth/register">
                <Button size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-none shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 text-lg py-6 font-semibold">
                  <Play className="mr-2 h-5 w-5" />
                  Enter Now and Win
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced How It Works Section */}
      <div className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Simple Process
            </div>
            <h2 className={cn(
              "text-4xl md:text-5xl font-bold mb-6 text-slate-900",
              font.className,
            )}>
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Getting started is simple. Follow these three steps to begin earning rewards while supporting global connectivity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {[
              {
                step: "1",
                title: "Create a Account",
                description: "Sign up with just your email to join the movement. Your account unlocks access to surveys, rewards, and future digital inclusion opportunities.",
                gradient: "from-rose-500 to-rose-600", 
                bgGradient: "from-rose-50 to-rose-100"
              },
              {
                step: "2",
                title: "Complete Surveys",
                description: "Answer thoughtful surveys about technology access and digital inclusion. Each response helps us understand global connectivity needs.",
                gradient: "from-emerald-500 to-emerald-600",
                bgGradient: "from-emerald-50 to-emerald-100"
              },
              {
                step: "3", 
                title: "Earn Tickets",
                description: "Receive lottery tickets for each completed survey and successful friend referral. More participation means more chances to win.",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                step: "4",
                title: "Win Rewards",
                description: "Join our weekly draws every Thursday at 18:30 IST. Winners receive $50 Amazon gift cards delivered directly to their email.",
                gradient: "from-purple-500 to-purple-600", 
                bgGradient: "from-purple-50 to-purple-100"
              }
            ].map((item, index) => (
              <div key={index} className={`bg-gradient-to-br ${item.bgGradient} rounded-3xl p-8 text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
                <div className="relative z-10">
                  <div className={`bg-gradient-to-br ${item.gradient} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    <span className="text-white text-3xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
              </div>
            ))}
          </div>
          
          <div className="mt-20 text-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-12 py-6 h-auto shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 font-semibold">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* FAQ SECTION */}
      <div className="bg-gradient-to-br from-slate-50 to-white py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4 mr-2" />
              Common Questions
            </div>
            <h2 className={cn(
              "text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight",
              font.className,
            )}>
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Find answers to the most common questions about our platform, rewards, and how to get started.
            </p>
              </div>
              
          {/* FAQ Accordion */}
          <div className="space-y-4 mb-16">
            {[
              {
                question: "How do I earn tickets?",
                answer: "Complete surveys and take simple actions like inviting friends or following us on social media. Each completed survey earns you lottery tickets, and successful referrals provide bonus tickets for both you and your friends."
              },
              {
                question: "Is it free to join the lottery?",
                answer: "Yes, totally free. No purchases or payments needed. Simply create an account and start participating in surveys to earn your lottery tickets. There are no hidden fees or subscription costs."
              },
              {
                question: "How do I know if I won?",
                answer: "Winners are notified by email and listed publicly here every week. We announce winners every Thursday after the 18:30 IST draw. Check your email and visit our winners page to see if you've won a $50 Amazon gift card."
              },
              {
                question: "When are the lottery draws held?",
                answer: "Lottery draws are held every Thursday at 18:30 IST (India Standard Time). The countdown timer on our homepage shows exactly when the next draw will take place. Winners are announced immediately after each draw."
              },
              {
                question: "How many tickets can I earn per survey?",
                answer: "You typically earn 1-3 tickets per completed survey, depending on the survey length and complexity. Bonus tickets are available for referring friends, social media engagement, and participating in special campaigns."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-slate-900 pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    {openFaqIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-blue-600 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200" />
                    )}
                  </div>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-8 pb-6 pt-2">
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
              <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Still Have Questions?</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help you get started.
              </p>
              <Link href="mailto:ask@0mninet.info">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER SUPPORT / CONTACT SECTION */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 py-24 md:py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm font-medium mb-6">
              <MessageCircle className="w-4 h-4 mr-2" />
              Support Center
            </div>
              <h2 className={cn(
              "text-4xl md:text-5xl font-bold mb-6 text-white leading-tight",
                font.className,
              )}>
              Need Help? Contact Our Team
              </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Our dedicated support team is ready to assist you with any questions about the platform, 
              lottery system, or technical issues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Contact Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 group">
              <div className="text-center">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Email Support</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Send us your questions and we&apos;ll get back to you as soon as possible.
                </p>
                <Link 
                  href="mailto:ask@0mninet.info"
                  className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 border border-white/30 hover:border-white/50"
                >
                  📩 ask@0mninet.info
                </Link>
              </div>
            </div>

            {/* Response Time Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 group">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-400 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Response Time</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  We prioritize quick responses to ensure you get the help you need.
                </p>
                <div className="inline-flex items-center px-6 py-3 bg-white/20 rounded-xl text-white font-semibold border border-white/30">
                  ⏱ Replies within 24–48 hours
                </div>
              </div>
            </div>
          </div>

          {/* Additional Support Options */}
          <div className="mt-16 text-center">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold mb-6 text-white">Multiple Ways to Get Help</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
                  <HelpCircle className="h-8 w-8 text-emerald-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">FAQ Section</h4>
                  <p className="text-white/70 text-sm text-center">Check our comprehensive FAQ above for instant answers</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
                  <Users className="h-8 w-8 text-blue-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Community</h4>
                  <p className="text-white/70 text-sm text-center">Connect with other users and share experiences</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
                  <Award className="h-8 w-8 text-purple-400 mb-3" />
                  <h4 className="font-semibold text-white mb-2">Priority Support</h4>
                  <p className="text-white/70 text-sm text-center">Active participants receive expedited assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Impact Stories Section */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 py-24 md:py-32 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 mr-2 text-red-500" />
              Real Impact Stories
            </div>
            <h2 className={cn(
              "text-4xl md:text-6xl font-bold mb-8 text-slate-900 leading-tight",
              font.className,
            )}>
              Transforming Lives Through
              <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Connectivity & Rewards
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Discover how our platform creates meaningful change while rewarding participants. 
              Every interaction drives us closer to a connected world.
            </p>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
            {[
              {
                icon: Activity,
                value: "15,000+",
                label: "Surveys Completed",
                description: "Data points collected for global connectivity research",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                icon: Award,
                value: "$2,500+",
                label: "Rewards Distributed",
                description: "Amazon gift cards delivered to winners worldwide",
                gradient: "from-emerald-500 to-emerald-600",
                bgGradient: "from-emerald-50 to-emerald-100"
              },
              {
                icon: MapPin,
                value: "45+",
                label: "Countries Reached",
                description: "Global participants contributing to our mission",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-50 to-purple-100"
              },
              {
                icon: TrendingUp,
                value: "98%",
                label: "Satisfaction Rate",
                description: "Users who would recommend our platform",
                gradient: "from-orange-500 to-orange-600",
                bgGradient: "from-orange-50 to-orange-100"
              }
            ].map((stat, index) => (
              <div key={index} className={`bg-gradient-to-br ${stat.bgGradient} rounded-3xl p-8 text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/50`}>
                <div className="relative z-10">
                  <div className={`bg-gradient-to-br ${stat.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-slate-900">{stat.value}</h3>
                  <p className="text-lg font-semibold mb-3 text-slate-800">{stat.label}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{stat.description}</p>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700"></div>
              </div>
            ))}
          </div>

          {/* Success Stories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Story 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group border border-gray-100">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                    alt="Success Story"
                    width={80}
                    height={80}
                    className="rounded-full object-cover ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full p-2 shadow-lg">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-bold text-xl text-slate-900">Sarah Martinez</h4>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    &quot;I&apos;ve won three $50 gift cards in the past two months! The surveys are actually interesting 
                    and knowing I&apos;m helping expand internet access makes it even more rewarding.&quot;
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      California, USA
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      3 Wins
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group border border-gray-100">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                    alt="Success Story"
                    width={80}
                    height={80}
                    className="rounded-full object-cover ring-4 ring-emerald-100 group-hover:ring-emerald-200 transition-all duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-2 shadow-lg">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-bold text-xl text-slate-900">James Chen</h4>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    &quot;The platform is incredibly user-friendly. I love how my survey responses contribute to 
                    real connectivity projects. The reward system is just a bonus!&quot;
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Singapore
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      85 Surveys
                    </span>
                  </div>
                </div>
                </div>
              </div>
            </div>
            
          {/* Impact Showcase */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-emerald-600/90"></div>
            <div className="absolute top-0 right-0 opacity-20">
              <Image
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop"
                alt="Global Network"
                width={600}
                height={400}
                className="object-cover"
              />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl font-bold mb-6">Global Connectivity Impact</h3>
                <p className="text-xl mb-8 text-white/90 leading-relaxed">
                  Your participation directly funds satellite internet infrastructure in remote areas, 
                  connecting schools, hospitals, and communities that previously had no access.
                </p>
                
                <div className="space-y-6">
                  {[
                    {
                      icon: Users,
                      text: "12,000+ people connected to the internet for the first time"
                    },
                    {
                      icon: Target,
                      text: "25 remote schools now have high-speed internet access"
                    },
                    {
                      icon: Heart,
                      text: "8 rural hospitals connected for telemedicine services"
                    }
                  ].map((impact, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors">
                        <impact.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-lg">{impact.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&auto=format&fit=crop",
                    title: "Rural Schools Connected",
                    description: "Educational opportunities expanded"
                  },
                  {
                    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&auto=format&fit=crop",
                    title: "Healthcare Access",
                    description: "Telemedicine services enabled"
                  },
                  {
                    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400&auto=format&fit=crop",
                    title: "Community Growth",
                    description: "Economic opportunities created"
                  },
                  {
                    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop",
                    title: "Digital Literacy",
                    description: "Skills training programs launched"
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden group hover:scale-105 transition-all duration-300">
                    <div className="aspect-square relative">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-white/80">{item.description}</p>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </div>
              
          {/* Call to Action */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full text-blue-700 text-sm font-medium mb-8">
              <Zap className="w-4 h-4 mr-2" />
              Join Our Growing Community
            </div>
            <h3 className={cn(
              "text-3xl md:text-4xl font-bold mb-6 text-slate-900",
              font.className,
            )}>
              Ready to Make a Difference?
            </h3>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Start earning rewards while contributing to global connectivity. Every survey matters, every participant counts.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-lg px-12 py-6 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 font-semibold">
                  <Play className="mr-2 h-5 w-5" />
                  Start Your Impact Journey
                </Button>
              </Link>
              <Link href="/dashboard/winners">
                <Button size="lg" variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-lg px-12 py-6 transition-all duration-300 hover:scale-105 font-semibold">
                  <Trophy className="mr-2 h-5 w-5" />
                  View All Winners
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Footer CTA */}
      <div className="bg-gradient-to-br from-white to-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
            Join the Revolution
          </div>
          
          <h2 className={cn(
            "text-4xl md:text-5xl font-bold mb-8 text-slate-900 leading-tight",
            font.className,
          )}>
            Ready to Make a 
            <span className="block text-emerald-600">Global Impact?</span>
          </h2>
          
          <p className="text-xl mb-12 text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of participants who are helping revolutionize internet access 
            while earning rewards. Your contribution matters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-12 py-6 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 font-semibold">
                <Play className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-lg px-12 py-6 transition-all duration-300 hover:scale-105 font-semibold">
                Access Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Main Footer Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              
              {/* Company Information */}
              <div className="lg:col-span-2">
                <div className="flex items-center group mb-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className={cn("text-3xl font-bold text-white", font.className)}>0mninet</h3>
                    <p className="text-emerald-400 font-medium">Global Connectivity Lottery</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed mb-8 text-lg max-w-md">
                  Democratizing internet access worldwide through community-driven surveys and rewards. 
                  Join our mission to connect the unconnected while earning amazing prizes.
                </p>
                
                {/* Social Media Links */}
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-medium">Follow Us:</span>
                  <div className="flex gap-4">
                    <Link 
                      href="https://facebook.com/0mninet" 
                      target="_blank"
                      className="bg-white/10 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                    >
                      <Facebook className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                    </Link>
                    <Link 
                      href="https://instagram.com/0mninet" 
                      target="_blank"
                      className="bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                    >
                      <Instagram className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                    </Link>
                    <Link 
                      href="https://youtube.com/@0mninet" 
                      target="_blank"
                      className="bg-white/10 hover:bg-red-600 p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                    >
                      <Youtube className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-xl font-bold mb-6 text-white">Quick Links</h4>
                <ul className="space-y-4">
                  {[
                    { label: "How It Works", href: "#" },
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Winners Gallery", href: "/dashboard/winners" },
                    { label: "My Tickets", href: "/dashboard/tickets" },
                    { label: "Refer Friends", href: "/dashboard/refer" },
                  ].map((link, index) => (
                    <li key={index}>
                      <Link 
                        href={link.href}
                        className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 flex items-center group"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">{link.label}</span>
                        <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support & Legal */}
              <div>
                <h4 className="text-xl font-bold mb-6 text-white">Support & Legal</h4>
                <ul className="space-y-4 mb-8">
                  {[
                    { label: "Contact Support", href: "mailto:ask@0mninet.info" },
                    { label: "FAQ", href: "#" },
                    { label: "Terms of Service", href: "#" },
                    { label: "Privacy Policy", href: "#" },
                    { label: "Cookie Policy", href: "#" },
                  ].map((link, index) => (
                    <li key={index}>
                      <Link 
                        href={link.href}
                        className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 flex items-center group"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">{link.label}</span>
                        {link.href.startsWith('mailto:') && (
                          <Mail className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                        )}
                        {link.href.startsWith('http') && (
                          <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Contact Info */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <h5 className="font-semibold mb-3 text-white flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-emerald-400" />
                    Contact Info
                  </h5>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300 flex items-center">
                      <Mail className="h-3 w-3 mr-2 text-emerald-400" />
                      ask@0mninet.info
                    </p>
                    <p className="text-slate-300 flex items-center">
                      <Clock className="h-3 w-3 mr-2 text-blue-400" />
                      24-48h Response
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <p className="text-slate-400 text-sm">
                    © {new Date().getFullYear()} 0mninet Global Connectivity Lottery. All rights reserved.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      Platform Active
                    </span>
                    <span>•</span>
                    <span>Secure & Verified</span>
                    <span>•</span>
                    <span>Global Community</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Heart className="h-4 w-4 text-red-400" />
                    Made with passion for global connectivity
                  </div>
                  <Link 
                    href="/auth/register"
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Join Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
