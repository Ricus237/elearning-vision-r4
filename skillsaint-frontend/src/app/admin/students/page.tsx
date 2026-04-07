import { fetchMoodle } from "@/lib/moodle";
import StudentsClient, { Student } from "./StudentsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ManageStudentsPage = async () => {
  let students: Student[] = [];
  try {
    const data = await fetchMoodle("local_skillsaint_get_all_admin_users");
    if (Array.isArray(data)) students = data as Student[];
  } catch {}

  return <StudentsClient initialStudents={students} />;
};


export default ManageStudentsPage;
