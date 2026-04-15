import DashboardClient from "./DashboardClient";
import { getStudentDashboardAction } from "@/lib/actions";
import { cookies } from "next/headers";
import { checkActivation, getEnrollmentData, getAllCourses } from "@/lib/data";

/**
 * Main dashboard page: shows all courses with enrolled ones highlighted.
 */
const DashboardPage = async () => {
  const data = (await getStudentDashboardAction()) || { plan: 'none', courses: [], exams: [] };
  const cookieStore = await cookies();
  const moodleUser = cookieStore.get('moodle_user')?.value || "";
  const userEmail = moodleUser || cookieStore.get('user_email')?.value || "";
  const isAdmin = cookieStore.get('moodle_is_admin')?.value === 'true' || moodleUser === 'admin';

  // Admins are always activated
  const isActivated = isAdmin ? true : await checkActivation(userEmail);

  const moodleToken = process.env.MOODLE_TOKEN || "";
  const moodleUserToken = cookieStore.get('moodle_token')?.value || "";

  // Fetch ALL public courses for the catalog view
  let allCourses: { id: number; fullname: string; image_url?: string; summary?: string }[] = [];
  try {
    const publicCourses = await getAllCourses();
    allCourses = publicCourses.map(c => ({
      id: parseInt(c.slug.current),
      fullname: c.title,
      image_url: c.thumbnail,
      summary: c.shortDescription,
    }));
  } catch (e) {
    console.warn("Could not load all courses for catalog:", e);
  }

  // Fetch plan quotas for display
  let planQuotas: { standard: number; premium: number; executive: number } = { standard: 3, premium: 6, executive: Infinity };
  try {
    const enrollmentData = await getEnrollmentData();
    planQuotas = {
      standard: enrollmentData.plans.standard.quota,
      premium: enrollmentData.plans.premium.quota,
      executive: Infinity,
    };
  } catch (e) {
    console.warn("Could not load plan quotas:", e);
  }

  console.log(`Dashboard: user=${userEmail}, plan=${data.plan}, enrolled=${data.courses.length}, total=${allCourses.length}`);

  return (
    <DashboardClient
      initialData={data}
      userEmail={userEmail}
      isActivated={isActivated}
      moodleToken={moodleUserToken || moodleToken}
      allCourses={allCourses}
      planQuotas={planQuotas}
    />
  );
};

export default DashboardPage;
