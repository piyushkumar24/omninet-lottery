"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BarChart2, 
  Gift,
  Ticket,
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
  isBadgeAlert?: boolean;
}

const SidebarItem = ({ icon, label, href, badge, isBadgeAlert = false }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center justify-between text-slate-500 text-sm font-medium pl-6 pr-4 py-3 transition-all hover:text-slate-600 hover:bg-slate-100/50 border-l-2 border-transparent",
        isActive && "text-indigo-700 bg-indigo-50 border-l-2 border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
      )}
    >
      <div className="flex items-center gap-x-3">
        <div className={cn(
          "h-5 w-5",
          isActive ? "text-indigo-700" : "text-slate-500"
        )}>
          {icon}
        </div>
        <span>{label}</span>
      </div>
      
      {typeof badge === 'number' && (
        <Badge 
          variant={isBadgeAlert ? "destructive" : "secondary"} 
          className={cn(
            "ml-auto text-xs",
            isBadgeAlert && "bg-red-100 text-red-800 hover:bg-red-100",
            !isBadgeAlert && isActive && "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
          )}
        >
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export const AdminPanelSidebar = () => {
  const [counts, setCounts] = useState({
    users: 0,
    activeTickets: 0,
    unclaimedWinners: 0
  });
  
  useEffect(() => {
    // Fetch counts from API
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/admin/counts');
        const data = await response.json();
        
        if (data.success) {
          setCounts({
            users: data.counts.users || 0,
            activeTickets: data.counts.activeTickets || 0,
            unclaimedWinners: data.counts.unclaimedWinners || 0
          });
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };
    
    fetchCounts();
  }, []);

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6">
        <Link href="/admin">
          <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
            <div className="bg-indigo-700 text-white p-1 rounded-md">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            Admin Panel
          </h2>
        </Link>
      </div>
      
      <div className="mt-2 px-6 mb-6">
        <Link href="/dashboard">
          <div className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700 transition-colors">
            <Home className="h-4 w-4" />
            Return to App
          </div>
        </Link>
      </div>
      
      <div className="px-3 mb-2">
        <p className="text-xs font-medium text-slate-400 px-3 mb-1 uppercase tracking-wider">Main</p>
      </div>
      
      <div className="flex flex-col w-full space-y-1 px-3">
        <SidebarItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          href="/admin"
        />
        <SidebarItem
          icon={<Users className="h-5 w-5" />}
          label="Users Management"
          href="/admin/users"
          badge={counts.users}
        />
        <SidebarItem
          icon={<BarChart2 className="h-5 w-5" />}
          label="Statistics"
          href="/admin/stats"
        />
      </div>
      
      <div className="px-3 mt-6 mb-2">
        <p className="text-xs font-medium text-slate-400 px-3 mb-1 uppercase tracking-wider">Lottery</p>
      </div>
      
      <div className="flex flex-col w-full space-y-1 px-3">
        <SidebarItem
          icon={<Ticket className="h-5 w-5" />}
          label="Active Tickets"
          href="/admin/tickets"
          badge={counts.activeTickets}
        />
        <SidebarItem
          icon={<Gift className="h-5 w-5" />}
          label="Draw Management"
          href="/admin/draws"
          badge={counts.unclaimedWinners}
          isBadgeAlert={counts.unclaimedWinners > 0}
        />
      </div>
      
      <div className="mt-auto p-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="font-medium text-sm text-indigo-700">Next Draw</h3>
          <p className="text-xs text-slate-500 mt-1">Scheduled for Thursday at 18:30 IST</p>
          <div className="mt-2 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">{counts.activeTickets} active tickets</p>
        </div>
      </div>
    </div>
  );
}; 