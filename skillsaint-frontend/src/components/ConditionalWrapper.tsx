"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ConditionalWrapper({ children, type }: { children: ReactNode, type?: "header" | "footer" }) {
  const pathname = usePathname();
  // Hide footer on dashboard/admin/auth
  if (type === "footer") {
    if (
      pathname?.startsWith("/dashboard") || 
      pathname?.startsWith("/admin") || 
      pathname === "/login" || 
      pathname === "/forgot-password" ||
      pathname === "/success"
    ) {
      return null;
    }
  }

  // Hide header on dashboard/admin/success
  if (type === "header") {
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin") || pathname === "/success") {
      return null;
    }
  }

  return <>{children}</>;
}


