"use client";

import { useEffect, useState } from "react";

export const UsersChart = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-500">Loading chart...</p>
      </div>
    );
  }
  
  return (
    <div className="h-64 flex flex-col items-center justify-center">
      <p className="text-slate-500 mb-2">User Registration Chart</p>
      <p className="text-xs text-slate-400">Chart visualization will be implemented here</p>
    </div>
  );
}; 