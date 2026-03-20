import PageHeader from "@/components/pageHeader";
import CoursesDsiplay from "./coursesDsiplay";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Courses | ${siteName}`,
  description: "Skillsaint  Online Learning Platform",
};

import { getAllCourses } from "@/lib/data";

const Courses = async () => {
  const courses = await getAllCourses();
  
  return (
    <main>
      <PageHeader
        description="Grow your skills with expert-led lessons designed to help you achieve your goals — anytime, anywhere."
        subTitle="Our Courses"
      >
        Our Popular Courses
      </PageHeader>
      <CoursesDsiplay courses={courses} />
    </main>
  );
};

export default Courses;
