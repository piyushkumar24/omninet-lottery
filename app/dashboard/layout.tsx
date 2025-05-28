import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { CPXNotification } from "@/components/dashboard/cpx-notification";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Get current user for CPX notification
  const user = await getCurrentUser();
  
  return (
    <div className="h-full bg-slate-100">
      <Navbar />
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-[90]">
        <Sidebar />
      </div>
      <main className="md:pl-56 pt-16 h-full relative z-[1]">
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
        {user && (
          <CPXNotification 
            key={`cpx-notification-${user.id}`}
            user={{
              id: user.id,
              name: user.name,
              email: user.email
            }} 
          />
        )}
        {children}
      </main>
    </div>
  );
} 