"use client";

import { Menu } from "lucide-react";
import { AdminSidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white">
        <AdminSidebar />
      </SheetContent>
    </Sheet>
  );
}; 