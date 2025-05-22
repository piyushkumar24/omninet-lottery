"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
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
        <Avatar>
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
      <DropdownMenuContent className="w-60" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{session.user.name || "User"}</p>
            <p className="text-xs text-slate-500">{session.user.email || ""}</p>
            {session.user.role === "ADMIN" && (
              <p className="text-xs text-indigo-600 font-medium">Administrator</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        {session.user.role === "ADMIN" && (
          <>
            <DropdownMenuItem 
              onClick={() => router.push("/admin")}
              className="cursor-pointer"
            >
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={onLogout}
          disabled={isLoading}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
