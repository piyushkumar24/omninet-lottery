import { Toaster } from "react-hot-toast";
import { AdminNavbar } from "@/components/admin/navbar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Check if the current user is an admin
  const session = await auth();
  const isAdmin = session?.user.role === UserRole.ADMIN;

  if(!isAdmin){
    redirect(`/?error="NotAllowed"`)
  }
  
  return (
    <div className="h-full bg-slate-100">
      <AdminNavbar />
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50">
        <AdminSidebar />
      </div>
      <main className="md:pl-64 pt-16 h-full">
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              marginTop: '80px', // Add margin to appear below navbar
              zIndex: 9999, // Very high z-index
            },
            success: {
              duration: 4000,
              style: {
                marginTop: '80px',
                zIndex: 9999,
              },
            },
            error: {
              duration: 4000,
              style: {
                marginTop: '80px',
                zIndex: 9999,
              },
            },
          }}
        />
        {children}
      </main>
    </div>
  );
} 