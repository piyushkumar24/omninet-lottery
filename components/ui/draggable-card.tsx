"use client";
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DraggableCardContainerProps {
  children: React.ReactNode;
  className?: string;
}

interface DraggableCardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const DraggableCardContainer = ({ 
  children,
  className,
}: DraggableCardContainerProps) => {
  return (
    <div className={cn(
      "w-full h-full", 
      className
    )}>
      {children}
    </div>
  );
};

export const DraggableCardBody = ({ 
  children,
  className,
}: DraggableCardBodyProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);
  
  return (
    <motion.div
      drag
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 10 }}
      whileTap={{ scale: 1.05, cursor: 'grabbing' }}
      whileHover={{ scale: 1.03 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "cursor-grab transform-gpu select-none bg-white rounded-md p-4 shadow-xl w-80",
        isDragging ? "shadow-2xl z-50" : "",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
