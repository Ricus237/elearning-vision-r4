"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ConditionalWrapper({ children, type }: { children: ReactNode, type?: "header" | "footer" }) {
  const pathname = usePathname();
  // Hide both on dashboard/admin
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) return null;
  
  // Hide ONLY header on home page
  if (type === "header" && pathname === "/") return null;
  
  return <>{children}</>;
}

