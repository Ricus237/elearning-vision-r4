"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ConditionalWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Hide header/footer on dashboard AND on the landing page (root "/")
  if (pathname?.startsWith("/dashboard") || pathname === "/") return null;
  return <>{children}</>;
}
