"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Gift,
  Settings,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Tickets",
    icon: Ticket,
    href: "/admin/tickets",
  },
  {
    label: "Winners",
    icon: Gift,
    href: "/admin/winners",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    label: "Back to App",
    icon: Home,
    href: "/dashboard",
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6">
        <Link href="/admin">
          <h1 className="text-2xl font-bold text-center">
            <span className="text-indigo-600">Admin</span> Panel
          </h1>
        </Link>
      </div>
      <div className="flex flex-col w-full">
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
      </div>
    </div>
  );
}; 