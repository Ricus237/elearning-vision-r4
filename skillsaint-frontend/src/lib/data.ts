import { CourseType } from "@/types/CourseType";
import { getPublicCourses, getMoodleSiteData } from "./moodle";

/**
 * Fetches Hero data from Moodle site info or returns default values.
 */
export async function getHeroData(): Promise<{ title: string; description: string }> {
  const info = await getMoodleSiteData();
  if (info) {
    return {
      title: info.sitename || "Explore Christian Faith",
      description: info.summary?.replace(/<[^>]*>?/gm, "") || "Deepen your understanding of Scripture."
    };
  }
  return {
    title: "Explore Christian Faith",
    description: "Discover comprehensive Christian education covering Biblical foundations, theology, and spiritual growth."
  };
}

/**
 * Fetches all courses from Moodle API.
 */
export async function getAllCourses(): Promise<CourseType[]> {
  try {
    const realCourses = await getPublicCourses();
    if (realCourses && realCourses.length > 0) {
      return realCourses;
    }
  } catch (error) {
    console.warn("Could not fetch real courses from Moodle, using fallbacks.");
  }

  // Fallback / Mock data if Moodle is not connected or empty
  return [
    {
      _id: "1",
      title: "Introduction to Biblical Studies",
      shortDescription: "Learn the basics of interpreting sacred texts and understanding their context.",
      instructor: {
        name: "Skillsaint Team"
      },
      thumbnail: "/images/course/course-1.png",
      price: 49.99,
      totalLearners: 1250,
      lessonsCount: 24,
      slug: {
        current: "introduction-to-biblical-studies"
      },
      status: "Ongoing",
      level: "Beginner",
      discountPrice: 29.99,
      isCertificationProvide: true,
      overview: []
    },
    {
      _id: "2",
      title: "Mastering Systematic Theology",
      shortDescription: "Dive deep into the foundations of faith and major theological doctrines.",
      instructor: {
        name: "Skillsaint Expert"
      },
      thumbnail: "/images/course/course-2.png",
      price: 89.99,
      totalLearners: 850,
      lessonsCount: 42,
      slug: {
        current: "mastering-systematic-theology"
      },
      status: "Completed",
      level: "Intermediate",
      discountPrice: 59.99,
      isCertificationProvide: true,
      overview: []
    },
    {
      _id: "3",
      title: "Christian Leadership Fundamentals",
      shortDescription: "Develop your leadership skills according to biblical principles.",
      instructor: {
        name: "Ministry Master"
      },
      thumbnail: "/images/course/course-3.png",
      price: 69.99,
      totalLearners: 2100,
      lessonsCount: 30,
      slug: {
        current: "christian-leadership-fundamentals"
      },
      status: "Ongoing",
      level: "Beginner",
      discountPrice: 45.99,
      isCertificationProvide: true,
      overview: []
    }
  ];
}
