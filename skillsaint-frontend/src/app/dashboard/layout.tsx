import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * Shared layout for all dashboard pages to ensure authentication.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "/dashboard";
  
  const userIdStr = cookieStore.get("moodle_user_id")?.value;
  const userEmail = cookieStore.get("user_email")?.value;

  // Si l'utilisateur n'est pas connecté et n'a pas d'email de paiement, on le renvoie au login
  if (!userIdStr && !userEmail) {
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
