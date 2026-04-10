

import DashboardClient from "./DashboardClient";
import { getStudentDashboardAction } from "@/lib/actions";
import { cookies } from "next/headers";
import { checkActivation } from "@/lib/data";

/**
 * Main dashboard page displaying overview stats and enrolled courses with real data.
 */
const DashboardPage = async () => {
  const data = (await getStudentDashboardAction()) || { plan: 'none', courses: [], exams: [] };
  const cookieStore = await cookies();
  const moodleUser = cookieStore.get('moodle_user')?.value || "";
  const userEmail = moodleUser || cookieStore.get('user_email')?.value || "";
  const isAdmin = cookieStore.get('moodle_is_admin')?.value === 'true' || moodleUser === 'admin';
  
  // Admins are always activated
  const isActivated = isAdmin ? true : await checkActivation(userEmail);

  // DEBUG LOG (will show in terminal)
  console.log(`Dashboard Debug: UserID=${cookieStore.get('moodle_user_id')?.value}, Admin=${isAdmin}, CoursesCount=${data.courses.length}`);

  const moodleToken = process.env.MOODLE_TOKEN || "";
  const moodleUserToken = cookieStore.get('moodle_token')?.value || "";

  return (
    <DashboardClient 
      initialData={data} 
      userEmail={userEmail} 
      isActivated={isActivated} 
      moodleToken={moodleUserToken || moodleToken} 
    />
  );
};

export default DashboardPage;
