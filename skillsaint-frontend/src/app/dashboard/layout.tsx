import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * Shared layout for all dashboard pages to ensure authentication.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("moodle_user_id")?.value;

  // Si l'utilisateur n'est pas connecté (pas d'ID Moodle), on le renvoie au login
  if (!userIdStr) {
    redirect("/login");
  }

  return <>{children}</>;
}
