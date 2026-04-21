import { fetchMoodle, getMoodleCategories } from "@/lib/moodle";
import CoursesClient from "./CoursesClient";
import { CategoryType } from "@/types/CategoryType";

const ManageCoursesPage = async () => {

  let courses: { 
    id: number; 
    fullname: string; 
    shortname: string; 
    summary: string; 
    visible: number; 
    numsections: number; 
    startdate: number; 
    categoryid?: number; 
    overviewfiles?: { fileurl: string; filename: string }[];
    summaryfiles?: { fileurl: string; filename: string }[];
    courseimage?: string;
  }[] = [];
  let categories: CategoryType[] = [];

  try {
    // Custom function that returns visible status AND overviewfiles reliably
    const res = await fetchMoodle("local_skillsaint_get_courses_full", {});
    if (res && Array.isArray(res)) {
      courses = res;
    }
  } catch (err) {
    console.error("Error fetching courses:", err);
  }

  try {
    categories = await getMoodleCategories();
  } catch {}


  const moodleToken = process.env.MOODLE_TOKEN || "";
  const moodleUrl = process.env.MOODLE_URL || "";

  return <CoursesClient initialCourses={courses} initialCategories={categories} moodleToken={moodleToken} moodleUrl={moodleUrl} />;
};

export default ManageCoursesPage;
