"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Settings } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export const UserButton = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const onLogout = async () => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false });
      router.push("/auth/login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-8 w-8 border border-slate-200">
          {session.user.image ? (
            <div className="relative aspect-square h-full w-full">
              <Image
                fill
                src={session.user.image}
                alt="profile picture"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-800">
              <User className="h-4 w-4" />
            </div>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name || "User"}</p>
            <p className="text-xs leading-none text-slate-500">{session.user.email || ""}</p>
            {session.user.role === "ADMIN" && (
              <p className="text-xs text-indigo-600 font-medium mt-1">Administrator</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => router.push("/settings")}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          {session.user.role === "ADMIN" && (
            <DropdownMenuItem 
              onClick={() => router.push("/admin")}
              className="cursor-pointer text-indigo-600 focus:text-indigo-600 focus:bg-indigo-50"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onLogout}
          disabled={isLoading}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
