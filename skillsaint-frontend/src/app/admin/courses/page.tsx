import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { fetchMoodle } from "@/lib/moodle";
import CoursesClient from "./CoursesClient";

/**
 * Admin Courses page – 100% live data from Moodle core_course_get_courses.
 * No static mock data.
 */
const ManageCoursesPage = async () => {
  let courses: any[] = [];
  let totalEnrolled = 0;

  try {
    const data = await fetchMoodle("core_course_get_courses");
    if (Array.isArray(data)) {
      // Exclude the site course (id=1)
      courses = data.filter((c: any) => c.id !== 1);
      totalEnrolled = courses.reduce((sum: number, c: any) => sum + (c.numsections || 0), 0);
    }
  } catch {}

  const moodleToken = process.env.MOODLE_TOKEN || "";

  return <CoursesClient initialCourses={courses} moodleToken={moodleToken} />;
};

export default ManageCoursesPage;
