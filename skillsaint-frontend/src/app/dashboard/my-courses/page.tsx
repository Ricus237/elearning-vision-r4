import { cookies } from "next/headers";

import { getUserCourses } from "@/lib/moodle";
import MyCoursesClient from "./MyCoursesClient";

const MyCoursesPage = async () => {

  const userIdStr = (await cookies()).get("moodle_user_id")!.value;
  const userId = parseInt(userIdStr);
  const enrolledCourses = await getUserCourses(userId);

  return <MyCoursesClient initialCourses={enrolledCourses} />;
};

export default MyCoursesPage;
