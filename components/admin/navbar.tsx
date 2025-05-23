"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton } from "@/components/auth/user-button";
import { MobileSidebar } from "./mobile-sidebar";
import { Bell, Shield, LayoutDashboard, Gift, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AdminNavbar = () => {
  const [notifications, setNotifications] = useState<number>(0);
  const [nextDrawDate, setNextDrawDate] = useState<Date | null>(null);

  useEffect(() => {
    // Calculate next draw date (Thursday at 18:30 IST)
    const now = new Date();
    const nextThursday = new Date(now);
    nextThursday.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7));
    nextThursday.setHours(18, 30, 0, 0);
    
    if (nextThursday <= now) {
      nextThursday.setDate(nextThursday.getDate() + 7);
    }
    
    setNextDrawDate(nextThursday);
    
    // In a real app, this would fetch notifications from an API
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications');
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
  }, []);

  return (
    <div className="h-16 fixed inset-x-0 top-0 border-b border-slate-200 bg-white z-[10] flex justify-between items-center px-4 shadow-sm">
      <div className="flex items-center gap-x-4">
        <MobileSidebar />
        <Link href="/admin">
          <div className="flex items-center gap-x-2">
            <div className="bg-indigo-600 w-8 h-8 rounded-md flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold hidden md:block">
              <span className="text-indigo-600">Admin</span> Dashboard
            </h1>
          </div>
        </Link>
      </div>
      
      <div className="hidden md:flex items-center gap-x-6">
        {nextDrawDate && (
          <div className="flex items-center gap-x-2 text-sm">
            <div className="bg-indigo-50 text-indigo-600 p-1 rounded">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-slate-500">Next Draw:</span>{" "}
              <span className="font-medium">
                {nextDrawDate.toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric' 
                })}
                {" "}
                {nextDrawDate.toLocaleTimeString(undefined, { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        )}
        
        <Link href="/admin/draws">
          <Button variant="outline" size="sm" className="gap-2">
            <Gift className="h-4 w-4" />
            <span>Manage Draws</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center gap-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] bg-red-500 text-white hover:bg-red-500"
                >
                  {notifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications > 0 ? (
              <>
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col w-full">
                    <p className="font-medium">New unclaimed prize</p>
                    <p className="text-xs text-slate-500">A winner has not claimed their prize yet</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col w-full">
                    <p className="font-medium">Draw scheduled</p>
                    <p className="text-xs text-slate-500">Weekly draw is scheduled for Thursday at 18:30 IST</p>
                  </div>
                </DropdownMenuItem>
              </>
            ) : (
              <div className="py-4 text-center text-sm text-slate-500">
                No new notifications
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer justify-center">
              <Button variant="ghost" size="sm" className="w-full">
                View All
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Link href="/dashboard" className="text-sm text-slate-700 hover:text-indigo-600 transition-colors hidden sm:block">
          Return to App
        </Link>
        <UserButton />
      </div>
    </div>
  );
}; 