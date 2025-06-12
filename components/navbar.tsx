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
  const isAuthPage = pathname?.startsWith('/auth/');
  
  // Determine navbar background and text colors based on the current page
  const navbarBgColor = isAuthPage ? "bg-black" : "bg-white";
  const textColor = isAuthPage ? "text-white" : "text-blue-600";
  const titleTextColor = isAuthPage ? "text-white" : "text-gray-900";
  const borderColor = isAuthPage ? "border-gray-800" : "border-gray-200";
  
  return (
    <div className={`h-14 px-4 border-b ${navbarBgColor} ${borderColor} flex items-center`}>
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full justify-between">
        <Link href="/">
          <h1 className="font-bold text-xl">
            <span className={textColor}>0mninet</span> <span className={titleTextColor}>Lottery</span>
          </h1>
        </Link>
        <div className="space-x-4 flex items-center">
          {isAdmin && (
            <Button 
              onClick={() => router.push("/admin")}
              variant="outline" 
              size="sm"
              className={`hidden md:flex items-center gap-2 ${
                isAuthPage 
                  ? "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800" 
                  : "border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
              }`}
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