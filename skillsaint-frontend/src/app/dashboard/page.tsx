

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
  const userEmail = cookieStore.get('moodle_user')?.value || "";
  const isAdmin = cookieStore.get('moodle_is_admin')?.value === 'true';
  
  // Admins are always activated
  const isActivated = isAdmin ? true : await checkActivation(userEmail);

  return (
    <DashboardClient 
      initialData={data} 
      userEmail={userEmail} 
      isActivated={isActivated} 
    />
  );
};

export default DashboardPage;
