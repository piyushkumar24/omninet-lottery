"use client";

import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminNavLinkProps {
  className?: string;
}

/**
 * Admin navigation component
 */
export const AdminNavLink = ({ className }: AdminNavLinkProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const navigateToAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      router.push("/admin");
    } catch (error) {
      console.error("Failed to navigate to admin dashboard:", error);
      setIsLoading(false);
    }
  };
  
  return (
    <div 
      onClick={navigateToAdmin}
      className={`flex items-center gap-2 cursor-pointer ${className || ""}`}
    >
      <LayoutDashboard className="h-4 w-4" />
      <span>{isLoading ? "Loading..." : "Admin Dashboard"}</span>
    </div>
  );
}; 