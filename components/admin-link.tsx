"use client";

import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AdminLinkProps {
  className?: string;
  variant?: "default" | "outline" | "link" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  icon?: boolean;
}

/**
 * Admin panel link component
 */
export function AdminLink({ 
  className = "",
  variant = "outline",
  size = "default",
  label = "Admin Panel",
  icon = true
}: AdminLinkProps) {
  const router = useRouter();
  
  const goToAdminPanel = () => {
    router.push("/admin");
  };
  
  return (
    <Button
      onClick={goToAdminPanel}
      variant={variant}
      size={size}
      className={className}
    >
      {icon && <LayoutDashboard className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
} 