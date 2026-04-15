import ProgramsClient from "@/components/programs/ProgramsClient";
import { getProgramsData, getCoursesWithCategories } from "@/lib/data";
import { getUserCourses } from "@/lib/moodle";
import { cookies } from "next/headers";

export default async function ProgramsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("moodle_user_id")?.value;

  const [data, { courses, categories }, userCourses] = await Promise.all([
    getProgramsData(),
    getCoursesWithCategories(),
    userId ? getUserCourses(parseInt(userId)) : Promise.resolve([])
  ]);

  const enrolledCourseIds = userCourses.map(c => c._id.replace("course-", ""));

  return (
    <ProgramsClient 
       data={data} 
       courses={courses} 
       categories={categories} 
       enrolledCourseIds={enrolledCourseIds}
    />
  );
}
