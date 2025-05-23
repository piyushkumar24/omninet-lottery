"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { UserButton } from "@/components/auth/user-button";
import { LayoutDashboard } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="bg-secondary flex justify-between items-center p-4 rounded-xl w-[600px] shadow-sm">
      <div className="flex gap-x-2">
        <Button 
          asChild
          variant={pathname === "/server" ? "default" : "outline"}
        >
          <Link href="/server">
            Server
          </Link>
        </Button>
        <Button 
          asChild
          variant={pathname === "/client" ? "default" : "outline"}
        >
          <Link href="/client">
            Client
          </Link>
        </Button>
        {isAdmin && (
          <Button 
            variant="default"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => router.push("/admin")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Admin
          </Button>
        )}
        <Button 
          asChild
          variant={pathname === "/dashboard/settings" ? "default" : "outline"}
        >
          <Link href="/dashboard/settings">
            Settings
          </Link>
        </Button>
      </div>
      <UserButton />
    </nav>
  );
};
