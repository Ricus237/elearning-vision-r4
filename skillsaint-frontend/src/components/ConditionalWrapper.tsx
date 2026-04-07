"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ConditionalWrapper({ children, type }: { children: ReactNode, type?: "header" | "footer" }) {
  const pathname = usePathname();
  // Always show footer
  if (type === "footer") return <>{children}</>;

  // Hide header on dashboard/admin or home page
  if (type === "header") {
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin") || pathname === "/") {
      return null;
    }
  }

  return <>{children}</>;
}


