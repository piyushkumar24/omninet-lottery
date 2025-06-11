"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@/components/auth/user-button";
import { MobileSidebar } from "./mobile-sidebar";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

export const Navbar = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const router = useRouter();

  return (
    <div className="h-16 fixed inset-x-0 top-0 border-b border-slate-700 bg-black z-[100] flex justify-between items-center px-4 shadow-sm">
      <div className="flex items-center gap-x-4">
        <MobileSidebar />
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/main-logo.png"
            alt="0mninet Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold">
            <span className="text-white">0mninet</span> <span className="text-white">Lottery</span>
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-x-4">
        {isAdmin && (
          <Button 
            onClick={() => router.push("/admin")}
            variant="outline" 
            size="sm"
            className="hidden md:flex items-center gap-2 border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin Panel
          </Button>
        )}
        <UserButton />
      </div>
    </div>
  );
}; 