import Link from "next/link";
import { Globe } from "lucide-react";
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
      
      {/* Header with Back to Home Button */}
      <div className="absolute top-0 left-0 right-0 z-20 py-6 px-4 md:px-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="flex items-center group">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-2 mr-3 group-hover:bg-white/30 transition-all duration-300 border border-white/30">
              <Globe className="h-6 w-6 text-blue-700" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
              0mninet
            </span>
          </Link>
          
          <Link href="/">
            <Button 
              variant="outline" 
              className="bg-white/80 backdrop-blur-md border-2 border-white/50 text-slate-700 hover:bg-white hover:border-white transition-all duration-300 hover:scale-105 font-semibold shadow-lg"
            >
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="h-full flex items-center justify-center pt-24 pb-12 px-4">
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
