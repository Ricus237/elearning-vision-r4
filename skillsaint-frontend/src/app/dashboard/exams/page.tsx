
import ExamsClient from "./ExamsClient";
import { getStudentDashboardAction } from "@/lib/actions";

/**
 * Exams page for students displaying their available assessments.
 */
const StudentExamsPage = async () => {
    const data = await getStudentDashboardAction();
    const exams = data?.exams || [];
    const results = data?.results || [];

    return <ExamsClient initialExams={exams} results={results} courses={data?.courses || []} />;
};

export default StudentExamsPage;
