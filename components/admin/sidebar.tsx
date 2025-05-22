"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BarChart, 
  Award,
  Settings
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const SidebarItem = ({ icon, label, href }: SidebarItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-x-2 text-slate-500 text-sm font-medium pl-6 transition-all hover:text-slate-600 hover:bg-slate-100/50",
        isActive && "text-indigo-700 bg-indigo-100/40 hover:bg-indigo-100/40 hover:text-indigo-700"
      )}
    >
      <div className="flex items-center gap-x-2 py-4">
        <div className={cn(
          "w-6 h-6",
          isActive ? "text-indigo-700" : "text-slate-500"
        )}>
          {icon}
        </div>
        {label}
      </div>
      {isActive && (
        <div className="ml-auto h-full w-1 bg-indigo-700" />
      )}
    </Link>
  );
};

export const AdminSidebar = () => {
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-indigo-700">Admin Panel</h2>
      </div>
      <div className="flex flex-col w-full">
        <SidebarItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          href="/admin"
        />
        <SidebarItem
          icon={<Users className="h-5 w-5" />}
          label="Users"
          href="/admin/users"
        />
        <SidebarItem
          icon={<BarChart className="h-5 w-5" />}
          label="Statistics"
          href="/admin/stats"
        />
        <SidebarItem
          icon={<Award className="h-5 w-5" />}
          label="Draw Logs"
          href="/admin/draws"
        />
        <SidebarItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          href="/admin/settings"
        />
      </div>
    </div>
  );
}; 