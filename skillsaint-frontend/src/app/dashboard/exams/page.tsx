
import ExamsClient from "./ExamsClient";
import { getStudentDashboardAction } from "@/lib/actions";

/**
 * Exams page for students displaying their available assessments.
 */
const StudentExamsPage = async () => {
    const data = await getStudentDashboardAction();
    const exams = data?.exams || [];

    return <ExamsClient initialExams={exams} />;
};

export default StudentExamsPage;
