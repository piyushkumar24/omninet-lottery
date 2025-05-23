"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdminLink = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToAdmin = () => {
    try {
      setIsLoading(true);
      router.push("/admin");
    } catch (error) {
      console.error("Failed to navigate to admin:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={navigateToAdmin}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
    >
      <LayoutDashboard className="h-4 w-4" />
      <span>{isLoading ? "Loading..." : "Admin Dashboard"}</span>
    </Button>
  );
}; 