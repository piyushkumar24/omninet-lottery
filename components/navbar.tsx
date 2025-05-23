"use client";

import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";

const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  
  const isAdmin = session?.user?.role === "ADMIN";
  
  return (
    <div className="h-14 px-4 border-b bg-white flex items-center">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full justify-between">
        <Link href="/">
          <h1 className="font-bold text-xl">
            <span className="text-indigo-600">Social</span> Lottery
          </h1>
        </Link>
        <div className="space-x-4 flex items-center">
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
          <ModeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  );
};

export default Navbar; 