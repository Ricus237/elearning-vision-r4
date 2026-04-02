import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * Admin layout — protects all /admin routes and removes the site header offset.
 * The header/footer are already hidden via ConditionalWrapper.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  // Admin must have a moodle session — for now same check as student
  // TODO: add a proper admin role check via Moodle
  const userIdStr = cookieStore.get("moodle_user_id")?.value;
  const isAdmin = cookieStore.get("moodle_is_admin")?.value === "true";

  if (!userIdStr || !isAdmin) {
    redirect("/login");
  }
  return <>{children}</>;
}
