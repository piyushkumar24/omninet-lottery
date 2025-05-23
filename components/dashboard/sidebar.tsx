"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Gift,
  Users,
  Settings,
  Shield,
  User,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "My Profile",
    icon: User,
    href: "/dashboard/profile",
  },
  {
    label: "My Tickets",
    icon: Ticket,
    href: "/dashboard/tickets",
  },
  {
    label: "Winners",
    icon: Gift,
    href: "/dashboard/winners",
  },
  {
    label: "Refer Friends",
    icon: Users,
    href: "/dashboard/refer",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const role = useCurrentRole();
  const isAdmin = role === UserRole.ADMIN;

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-center">
            <span className="text-indigo-600">Social</span> Lottery
          </h1>
        </Link>
      </div>
      <div className="flex flex-col w-full flex-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-2 text-slate-500 text-sm font-medium px-3 py-4 hover:text-indigo-600 hover:bg-slate-100/50 transition-all",
              pathname === route.href && "text-indigo-600 bg-slate-100"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
        
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-x-2 text-slate-500 text-sm font-medium px-3 py-4 hover:text-indigo-600 hover:bg-slate-100/50 transition-all mt-2 border-t pt-2",
              pathname === "/admin" && "text-indigo-600 bg-slate-100"
            )}
          >
            <Shield className="h-5 w-5" />
            Admin Panel
          </Link>
        )}
      </div>
      
      {/* Back to Landing Button */}
      <div className="p-4 mt-auto border-t">
        <Link href="/">
          <div className="flex items-center gap-x-2 text-slate-600 text-sm font-medium px-3 py-3 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <Home className="h-5 w-5" />
            <span>Back to Landing</span>
          </div>
        </Link>
      </div>
    </div>
  );
}; 