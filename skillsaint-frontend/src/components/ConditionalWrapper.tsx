"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ConditionalWrapper({ children, type }: { children: ReactNode, type?: "header" | "footer" }) {
  const pathname = usePathname();
  // Hide footer on dashboard/admin
  if (type === "footer") {
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
      return null;
    }
  }

  // Hide header on dashboard/admin or home page
  if (type === "header") {
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin") || pathname === "/") {
      return null;
    }
  }

  return <>{children}</>;
}


