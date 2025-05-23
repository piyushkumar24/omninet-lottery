"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth/user-button";
import { MobileSidebar } from "./mobile-sidebar";
import { 
  Bell, 
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AdminPanelNavbar = () => {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState(0);
  
  useEffect(() => {
    // Fetch notifications from API
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
    
    // Poll for notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get current page title
  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname === "/admin/users") return "Users Management";
    if (pathname === "/admin/stats") return "Statistics";
    if (pathname === "/admin/draws") return "Draw Management";
    if (pathname === "/admin/tickets") return "Active Tickets";
    
    return "Admin Panel";
  };
  
  return (
    <div className="fixed top-0 w-full h-16 z-50 flex items-center justify-between bg-white border-b px-4 md:px-6">
      <div className="flex items-center">
        <MobileSidebar />
        <div className="hidden md:flex">
          <h1 className="text-xl font-semibold text-slate-700">{getPageTitle()}</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-x-4 md:gap-x-6">
        <div className="hidden md:block">
          <div className="relative">
            <Search className="h-4 w-4 absolute top-1/2 transform -translate-y-1/2 left-3 text-slate-500" />
            <Input 
              placeholder="Search..." 
              className="pl-10 bg-slate-50 border-slate-200 w-[220px] focus-visible:ring-indigo-500"
            />
          </div>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          className="relative"
        >
          <Bell className="h-5 w-5 text-slate-700" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </Button>
        
        <UserButton />
      </div>
    </div>
  );
}; 