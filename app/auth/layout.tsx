import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header with Back to Home Button - Black Background with White Text */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black text-white">
        <div className="flex justify-between items-center max-w-7xl mx-auto py-4 px-4 md:px-10">
          <Link href="/" className="flex items-center group">
            <div className="bg-black rounded-full p-2 mr-3 group-hover:bg-gray-900 transition-all duration-300">
              <Image
                src="/main-logo.png"
                alt="Omninet Logo"
                width={28}
                height={28}
                className="rounded-lg"
              />
            </div>
            <span className="text-2xl font-bold text-white">
              Omninet
            </span>
          </Link>
          
          <Link href="/">
            <Button 
              variant="outline" 
              className="border-gray-600 text-blue-500 hover:text-blue-400 hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-semibold"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="h-full flex items-center justify-center pt-28 pb-12 px-4">
        <div className="relative z-10 w-full max-w-[600px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
