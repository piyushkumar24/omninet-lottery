import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Account Blocked",
  description: "Your account has been blocked",
};

export default function BlockedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="max-w-md text-center space-y-6 p-8 bg-white border rounded-lg shadow-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
          <div className="w-8 h-8 bg-red-500 rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Account Blocked</h1>
        <p className="text-slate-600">
          Your account has been blocked by an administrator. If you believe this is a mistake, please contact our support team.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to homepage
        </Link>
      </div>
    </div>
  );
} 