"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function ConditionalWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard")) return null;
  return <>{children}</>;
}
