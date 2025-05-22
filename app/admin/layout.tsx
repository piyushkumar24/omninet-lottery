import { Toaster } from "react-hot-toast";
import { AdminNavbar } from "@/components/admin/navbar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Check if the current user is an admin
  const user = await getCurrentUser();
  const isAdminUser = await isAdmin();
  
  if (!user || !isAdminUser) {
    return redirect("/auth/login");
  }
  
  return (
    <div className="h-full bg-slate-100">
      <AdminNavbar />
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50">
        <AdminSidebar />
      </div>
      <main className="md:pl-64 pt-16 h-full">
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </main>
    </div>
  );
} 