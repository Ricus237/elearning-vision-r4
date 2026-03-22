import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCourses } from "@/lib/moodle";
import MyCoursesClient from "./MyCoursesClient";

const MyCoursesPage = async () => {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("moodle_user_id")?.value;

  if (!userIdStr) {
    redirect("/login");
  }

  const userId = parseInt(userIdStr);
  const enrolledCourses = await getUserCourses(userId);

  return <MyCoursesClient initialCourses={enrolledCourses} />;
};

export default MyCoursesPage;
