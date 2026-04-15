import CoursePageClient from "./CoursePageClient";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getStudentDashboardAction } from "@/lib/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Full-page course viewer with security checks.
 */
export default async function CoursePage({ params }: PageProps) {
  const { id: courseIdStr } = await params;
  const courseId = parseInt(courseIdStr);
  
  if (isNaN(courseId)) {
    return notFound();
  }

  const cookieStore = await cookies();
  const moodleToken = process.env.MOODLE_TOKEN || "";
  const moodleUserToken = cookieStore.get('moodle_token')?.value || "";

  // ─── SECURITY CHECKS ──────────────────────────────────────────────────────
  
  // 1. Fetch user dashboard data (plan + enrolled courses)
  const dashboardData = await getStudentDashboardAction();
  
  if (!dashboardData) {
    // Should not happen due to DashboardLayout, but safe check
    return redirect("/login");
  }

  const isEnrolled = dashboardData.courses.some(c => c.id === courseId);
  const hasActivePlan = dashboardData.plan !== "none";

  // 2. Authorization Logic
  // We allow access only if the user is enrolled AND has an active plan.
  // Note: getStudentDashboardAction already handles Admins by giving them 'executive' plan 
  // and course access, so they are naturally covered.
  if (!isEnrolled || !hasActivePlan) {
    console.warn(`Unauthorized course access attempt: course=${courseId}, plan=${dashboardData.plan}, enrolled=${isEnrolled}`);
    return redirect("/dashboard?error=unauthorized_course");
  }

  // 3. Find course details for the UI title
  let courseTitle = "Course Viewer";
  const course = dashboardData.courses.find(c => c.id === courseId);
  if (course) {
    courseTitle = course.fullname;
  }

  return (
    <CoursePageClient 
      courseId={courseId} 
      courseTitle={courseTitle} 
      moodleToken={moodleUserToken || moodleToken} 
    />
  );
}
