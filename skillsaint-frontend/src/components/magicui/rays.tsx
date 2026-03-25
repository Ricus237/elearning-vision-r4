"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface RaysProps extends HTMLMotionProps<"div"> {
  className?: string;
}

export const Rays = ({ className, ...props }: RaysProps) => {
  // Optimized color palette - fewer colors for smoother transitions
  const colors = [
    "rgba(139, 92, 246, 0.35)", // Soft Purple
    "rgba(99, 102, 241, 0.35)",   // Indigo
    "rgba(14, 165, 233, 0.25)",   // Sky Blue
    "rgba(139, 92, 246, 0.35)", // Back to start
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* 
          OPTIMIZATION: Using hardware-accelerated transforms and 
          background-color instead of complex radial-gradient 
          animations where possible. 
      */}
      <motion.div 
        animate={{
          backgroundColor: colors
        }}
        transition={{
          duration: 30, // Extremely slow to save GPU
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 size-[120%] lg:size-[100%] rounded-full opacity-30 blur-[150px] will-change-transform"
        style={{
          transform: "translate3d(-50%, 0, 0)", // Force GPU layer
        }}
      />
      
      {/* 
          OPTIMIZATION: Reduced number of beams to 3. 
          Static beam shape with only transform/opacity animations.
      */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            rotate: [i * 45 - 60, i * 45 - 30, i * 45 - 60],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-30%] left-[50%] w-[4px] h-[180%] blur-[60px] will-change-transform"
          style={{
            background: `linear-gradient(to bottom, rgba(139, 92, 246, 0.5), transparent)`,
            transformOrigin: "top center",
            boxShadow: `0 0 100px 20px rgba(139, 92, 246, 0.2)`,
            transform: "translate3d(0, 0, 0)", // Hardware acceleration
          }}
        />
      ))}
      
      {/* Static overlay for calm texture without animation cost */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 10%, white, transparent 70%)",
        }}
      />
    </motion.div>
  );
};
