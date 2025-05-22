"use client";

import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { MobileSidebar } from "./mobile-sidebar";
import { Shield } from "lucide-react";

export const AdminNavbar = () => {
  return (
    <div className="h-16 fixed inset-x-0 top-0 border-b border-slate-200 bg-white z-[10] flex justify-between items-center px-4 shadow-sm">
      <div className="flex items-center gap-x-4">
        <MobileSidebar />
        <Link href="/admin">
          <div className="flex items-center gap-x-2">
            <div className="bg-indigo-600 w-8 h-8 rounded-md flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold hidden md:block">
              <span className="text-indigo-600">Admin</span> Dashboard
            </h1>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-x-4">
        <Link href="/dashboard" className="text-sm text-slate-700 hover:text-indigo-600 transition-colors">
          Return to App
        </Link>
        <UserButton />
      </div>
    </div>
  );
}; 