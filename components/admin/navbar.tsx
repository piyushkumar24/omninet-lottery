"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton } from "@/components/auth/user-button";
import { MobileSidebar } from "./mobile-sidebar";
import { Bell, Shield, LayoutDashboard, Gift, Calendar, CheckCircle2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export const AdminNavbar = () => {
  const [notifications, setNotifications] = useState<number>(0);
  const [notificationItems, setNotificationItems] = useState<any[]>([]);
  const [nextDrawDate, setNextDrawDate] = useState<Date | null>(null);
  const [nextDrawFormatted, setNextDrawFormatted] = useState<{ date: string, time: string }>({
    date: '',
    time: ''
  });
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.count || 0);
        setNotificationItems(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(0);
        setNotificationItems([]);
        toast.success("All notifications marked as read", {
          position: "top-center",
          duration: 3000,
        });
      } else {
        toast.error("Failed to mark notifications as read", {
          position: "top-center",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("An error occurred. Please try again.", {
        position: "top-center",
        duration: 3000,
      });
    }
    
    setIsAlertOpen(false);
  };

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
    
    // Format the date for display
    // Using standard US format with fixed parts to avoid hydration issues
    setNextDrawFormatted({
      date: new Date(nextThursday).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC' 
      }),
      time: new Date(nextThursday).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      })
    });
    
    // Fetch notifications
    fetchNotifications();
    
    // Set up polling interval
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="h-16 fixed inset-x-0 top-0 border-b border-slate-200 bg-white z-[100] flex justify-between items-center px-4 shadow-sm">
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
                  {nextDrawFormatted.date} {nextDrawFormatted.time}
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
              <div className="flex items-center justify-between px-2">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                {notifications > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                    onClick={() => setIsAlertOpen(true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Mark all as read</span>
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications > 0 ? (
                <>
                  {notificationItems.map((item, index) => (
                    <DropdownMenuItem key={item.id || index} className="cursor-pointer">
                      <div className="flex flex-col w-full">
                        <p className="font-medium">{item.message || "New notification"}</p>
                        <p className="text-xs text-slate-500">
                          {item.type === "unclaimed_winners" 
                            ? `${item.count} winner(s) have not claimed their prize yet` 
                            : "System notification"}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
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
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark All as Read</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark all notifications as read? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 