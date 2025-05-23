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
import { Globe, Gift, Users, Share, CheckCircle, ArrowRight, Play, User, Trophy } from "lucide-react";

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
    latestWinner: "No winner yet"
  });
  const [nextDrawDate, setNextDrawDate] = useState(new Date());
  
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
              latestWinner: data.latestWinner || "No winner yet"
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {[
              {
                step: "1",
                title: "Complete Surveys",
                description: "Answer thoughtful surveys about technology access and digital inclusion. Each response helps us understand global connectivity needs.",
                gradient: "from-emerald-500 to-emerald-600",
                bgGradient: "from-emerald-50 to-emerald-100"
              },
              {
                step: "2", 
                title: "Earn Tickets",
                description: "Receive lottery tickets for each completed survey and successful friend referral. More participation means more chances to win.",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-50 to-blue-100"
              },
              {
                step: "3",
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
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
                Live Draw Information
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
                  Join the Movement
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
    </main>
  );
}
