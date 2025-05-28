"use client";

import { useEffect, useRef } from "react";
import { generateCPXNotificationScript } from "@/lib/cpx-utils";
import Script from "next/script";

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
    
    // Clear previous scripts in document with our IDs to avoid duplicates
    const existingScript = document.getElementById('cpx-notification-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    const existingCpxScript = document.getElementById('cpx-external-script');
    if (existingCpxScript) {
      existingCpxScript.remove();
    }
    
    // Generate script content
    const notificationScript = generateCPXNotificationScript(user);
    
    // Clear previous content in our container
    containerRef.current.innerHTML = "";
    
    // Create notification container
    const notificationDiv = document.createElement('div');
    notificationDiv.id = 'notification';
    notificationDiv.className = 'cpx-notification';
    containerRef.current.appendChild(notificationDiv);
    
    // Add script element with a unique ID
    const scriptEl = document.createElement('script');
    scriptEl.id = 'cpx-notification-script';
    scriptEl.innerHTML = notificationScript;
    document.head.appendChild(scriptEl); // Append to head instead of container
    
    // Add CPX library script
    const cpxScriptEl = document.createElement('script');
    cpxScriptEl.id = 'cpx-external-script';
    cpxScriptEl.type = 'text/javascript';
    cpxScriptEl.src = 'https://cdn.cpx-research.com/assets/js/script_tag_v1.1.js';
    document.head.appendChild(cpxScriptEl); // Append to head instead of container
    
    return () => {
      // Clean up scripts when component unmounts
      const notificationScript = document.getElementById('cpx-notification-script');
      if (notificationScript) {
        notificationScript.remove();
      }
      
      const externalScript = document.getElementById('cpx-external-script');
      if (externalScript) {
        externalScript.remove();
      }
      
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [user]);

  return <div ref={containerRef} className="cpx-notification-container" id={uniqueId}></div>;
}; 