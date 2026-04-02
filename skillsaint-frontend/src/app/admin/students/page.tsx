import { fetchMoodle } from "@/lib/moodle";
import StudentsClient from "./StudentsClient";

const ManageStudentsPage = async () => {
  let students: any[] = [];
  try {
    const data = await fetchMoodle("local_skillsaint_get_all_admin_users");
    if (Array.isArray(data)) students = data;
  } catch {}

  return <StudentsClient initialStudents={students} />;
};

export default ManageStudentsPage;
