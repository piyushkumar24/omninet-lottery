import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Test | Social Lottery",
  description: "Test page for admin access",
};

export default async function AdminTestPage() {
  // Check if the current user is an admin
  const user = await getCurrentUser();
  const isAdminUser = await isAdmin();
  
  if (!user || !isAdminUser) {
    return redirect("/auth/login");
  }
  
  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Test Page</h1>
        <p className="text-slate-500">Testing admin access</p>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Admin Access Confirmed</h2>
        <p className="mb-4">You have successfully accessed the admin test page. This confirms your admin privileges are working correctly.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/admin">
            <Button>Return to Admin Dashboard</Button>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="outline">Go to User Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
} 