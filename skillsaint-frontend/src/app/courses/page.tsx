import PageHeader from "@/components/pageHeader";
import CoursesDsiplay from "./coursesDsiplay";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Courses | ${siteName}`,
  description: "Skillsaint  Online Learning Platform",
};

import { getPublicCourses, getMoodleCategories } from "@/lib/moodle";
import { cookies } from "next/headers";

const Courses = async () => {
  const courses = await getPublicCourses();
  const categories = await getMoodleCategories();
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("moodle_user")?.value;
  
  return (
    <main>
      <PageHeader
        description="Grow your skills with expert-led lessons designed to help you achieve your goals — anytime, anywhere."
        subTitle="Our Courses"
      >
        Our Popular Courses
      </PageHeader>
      <CoursesDsiplay courses={courses} categories={categories} isLoggedIn={isLoggedIn} />
    </main>
  );
};

export default Courses;
