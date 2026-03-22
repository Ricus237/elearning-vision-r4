import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCourses } from "@/lib/moodle";
import DashboardClient from "./DashboardClient";

/**
 * Main dashboard page displaying overview stats and enrolled courses.
 */
const DashboardPage = async () => {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("moodle_user_id")?.value;

  if (!userIdStr) {
    redirect("/login");
  }

  const userId = parseInt(userIdStr);
  const enrolledCourses = await getUserCourses(userId);

  return <DashboardClient enrolledCourses={enrolledCourses} />;
};

export default DashboardPage;
