import { redirect } from "next/navigation";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * Admin page that redirects to the new admin panel
 */
export default async function AdminPage() {
  // Check if user is admin
  const role = await currentRole();
  
  if (role !== UserRole.ADMIN) {
    return redirect("/dashboard");
  }
} 