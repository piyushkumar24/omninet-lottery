"use client";

import { Poppins } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Shield, FileText, Cookie, ExternalLink } from "lucide-react";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"]
});

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300"></div>
              <h1 className={cn("text-2xl font-bold text-slate-900", font.className)}>
                Legal & Privacy Information
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500">
                For complete policies, visit 
              </div>
              <Link 
                href="https://www.0mninet.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                0mninet.com
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Legal Documentation
          </div>
          <h2 className={cn("text-4xl md:text-5xl font-bold mb-6 text-slate-900", font.className)}>
            0mninet Policies
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Important information about our terms, privacy practices, and cookie usage. 
            This page provides an overview of our key policies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Terms of Use */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg mx-auto w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Terms of Use</h3>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left">
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Placeholder Content:</strong> Terms of Use content will be added here.
                  </p>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>• User responsibilities and obligations</p>
                    <p>• Acceptable use policies</p>
                    <p>• Platform guidelines and rules</p>
                    <p>• Account management terms</p>
                  </div>
                  <p className="text-slate-500 text-xs italic mt-4 pt-4 border-t border-slate-200">
                    Content to be completed by the legal team.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="https://www.0mninet.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                >
                  View Full Terms
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg mx-auto w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Privacy Policy</h3>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left">
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Placeholder Content:</strong> Privacy Policy content will be added here.
                  </p>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>• Data collection and usage</p>
                    <p>• User information protection</p>
                    <p>• Survey response handling</p>
                    <p>• Communication preferences</p>
                  </div>
                  <p className="text-slate-500 text-xs italic mt-4 pt-4 border-t border-slate-200">
                    Content to be completed by the legal team.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="https://www.0mninet.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  View Full Policy
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Cookie Policy */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg mx-auto w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Cookie className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-slate-900">Cookie Policy</h3>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left">
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Placeholder Content:</strong> Cookie Policy content will be added here.
                  </p>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>• Essential cookies usage</p>
                    <p>• Analytics and tracking</p>
                    <p>• User preference settings</p>
                    <p>• Third-party integrations</p>
                  </div>
                  <p className="text-slate-500 text-xs italic mt-4 pt-4 border-t border-slate-200">
                    Content to be completed by the legal team.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link 
                  href="https://www.0mninet.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors text-sm font-medium"
                >
                  View Full Policy
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-100 shadow-xl">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Complete Legal Documentation</h3>
            <p className="text-slate-600 mb-6 max-w-3xl mx-auto">
              For the most up-to-date and complete versions of our legal policies, 
              please visit our official website. The policies above provide an overview 
              and will be updated with full content soon.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="https://www.0mninet.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                  Visit Official Site
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="mailto:ask@0mninet.info">
                <Button variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-8 py-3 font-semibold transition-all duration-300 hover:scale-105">
                  Contact Legal Team
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-8 border border-slate-200 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Questions About Our Policies?</h3>
            <p className="text-slate-600 mb-6">
              If you have any questions about our terms, privacy practices, or cookie usage, 
              our support team is here to help.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
              <span>Email: ask@0mninet.info</span>
              <span>•</span>
              <span>Response: 24-48 hours</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 