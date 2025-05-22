"use client";

import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { MobileSidebar } from "./mobile-sidebar";

export const Navbar = () => {
  return (
    <div className="h-16 fixed inset-x-0 top-0 border-b border-slate-200 bg-white z-[10] flex justify-between items-center px-4">
      <div className="flex items-center gap-x-4">
        <MobileSidebar />
        <Link href="/dashboard">
          <h1 className="text-xl font-bold">
            <span className="text-indigo-600">Social</span> Lottery
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-x-4">
        <UserButton />
      </div>
    </div>
  );
}; 