"use client";

import { useEffect, useRef } from "react";
import { generateCPXNotificationScript } from "@/lib/cpx-utils";
import Script from "next/script";

// Add global type declaration for CPX
declare global {
  interface Window {
    config?: any;
  }
}

interface CPXNotificationProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export const CPXNotification = ({ user }: CPXNotificationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate a stable ID based on user ID instead of random
  const uniqueId = `cpx-notification-${user.id.substring(0, 8)}`;

  // Add CPX script dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a cleanup function to remove all CPX-related scripts and elements
    const cleanup = () => {
      // Remove any existing scripts
      const existingScripts = document.querySelectorAll('[id^="cpx-"]');
      existingScripts.forEach(script => script.remove());
      
      // Clear notification container
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      
      // Remove any global CPX variables
      if (window.config) {
        delete window.config;
      }
    };
    
    // Clean up first
    cleanup();
    
    // Create notification container
    const notificationDiv = document.createElement('div');
    notificationDiv.id = 'notification';
    notificationDiv.className = 'cpx-notification';
    containerRef.current.appendChild(notificationDiv);
    
    // Generate script content
    const notificationScript = generateCPXNotificationScript(user);
    
    // Create a safer script execution method using Function constructor
    // This avoids variable redeclaration issues
    try {
      const scriptWrapper = `
        (function() {
          // Remove any existing CPX config to prevent conflicts
          if (window.config) {
            delete window.config;
          }
          
          ${notificationScript}
        })();
      `;
      
      // Create and append script element
      const scriptEl = document.createElement('script');
      scriptEl.id = `cpx-notification-script-${user.id.substring(0, 8)}`;
      scriptEl.text = scriptWrapper;
      document.head.appendChild(scriptEl);
      
      // Add CPX library script only if it doesn't exist
      if (!document.getElementById('cpx-external-script')) {
        const cpxScriptEl = document.createElement('script');
        cpxScriptEl.id = 'cpx-external-script';
        cpxScriptEl.type = 'text/javascript';
        cpxScriptEl.src = 'https://cdn.cpx-research.com/assets/js/script_tag_v1.1.js';
        document.head.appendChild(cpxScriptEl);
      }
    } catch (error) {
      console.error('Error initializing CPX notification:', error);
    }
    
    // Clean up on unmount
    return cleanup;
  }, [user]);

  return <div ref={containerRef} className="cpx-notification-container" id={uniqueId}></div>;
}; 