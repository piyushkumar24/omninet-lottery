"use client";

import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

interface AdminDirectLinkProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

/**
 * A component that directly navigates to the admin dashboard
 */
export const AdminDirectLink = ({ 
  className = "", 
  variant = "outline",
  size = "sm",
  children
}: AdminDirectLinkProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  
  // Check if the user is an admin
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  const handleNavigation = () => {
    // Don't navigate if not an admin
    if (!isAdmin) {
      return;
    }
    
    setIsNavigating(true);
    router.push("/admin");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleNavigation}
      disabled={isNavigating || !isAdmin}
      title={!isAdmin ? "Admin access required" : ""}
    >
      {children || (
        <>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          <span>
            {isNavigating ? "Opening..." : "Admin Dashboard"}
          </span>
        </>
      )}
    </Button>
  );
}; 