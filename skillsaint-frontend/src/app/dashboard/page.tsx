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

  let enrolledCourses: any[] = [];
  if (userIdStr) {
    const userId = parseInt(userIdStr);
    enrolledCourses = await getUserCourses(userId);
  }

  return <DashboardClient enrolledCourses={enrolledCourses as any} />;
};

export default DashboardPage;
