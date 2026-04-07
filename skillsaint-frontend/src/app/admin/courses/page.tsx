import { fetchMoodle } from "@/lib/moodle";
import CoursesClient from "./CoursesClient";

const ManageCoursesPage = async () => {

  let courses: { id: number; fullname: string; shortname: string; summary: string; visible: number; numsections: number; startdate: number; categoryid?: number; }[] = [];

  try {
    const data = await fetchMoodle("core_course_get_courses");
    if (Array.isArray(data)) {
      // Exclude the site course (id=1)
      courses = data.filter((c: { id: number }) => c.id !== 1);
    }
  } catch {}


  const moodleToken = process.env.MOODLE_TOKEN || "";

  return <CoursesClient initialCourses={courses} moodleToken={moodleToken} />;
};

export default ManageCoursesPage;
