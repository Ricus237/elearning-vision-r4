"use client";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Award, FileText, BarChart3 } from "lucide-react";
import { mockStudents, mockEnrollments, mockExamScores } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import { examQuestions } from "@/data/curriculum";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

const currentStudent = mockStudents[0];
const studentExamScores = mockExamScores.filter(e => e.studentId === currentStudent.id);
const studentEnrollments = mockEnrollments.filter(e => e.studentId === currentStudent.id);

// Build exam history with course info
const examHistory = studentExamScores.map(score => {
  const course = coursesData.find(c => c._id === `course-${score.courseId}`);
  return {
    ...score,
    courseTitle: course?.title || "Course",
    courseSlug: course?.slug.current || "course",
    passed: score.score >= score.maxScore * 0.7,
  };
});

// Courses with available exams (enrolled but not yet taken)
const availableExams = studentEnrollments
  .filter(enrollment => {
    const hasExam = examQuestions.find(eq => eq.courseId === enrollment.courseId);
    const alreadyTaken = studentExamScores.find(s => s.courseId === enrollment.courseId);
    return hasExam && !alreadyTaken && enrollment.progress >= 70;
  })
  .map(enrollment => {
    const course = coursesData.find(c => c._id === `course-${enrollment.courseId}`);
    const exam = examQuestions.find(eq => eq.courseId === enrollment.courseId);
    return {
      courseId: enrollment.courseId,
      courseTitle: course?.title || "Course",
      courseSlug: course?.slug.current || "course",
      questionsCount: exam?.questions.length || 0,
      progress: enrollment.progress,
    };
  });

const CompletedExamsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10 pb-20 md:pb-20 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Exams</h1>
            <p className="text-secondary mt-1">View your exam results and take available exams.</p>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Exams Passed</p>
                <h3 className="text-2xl font-bold text-gray-900">{examHistory.filter(e => e.passed).length}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {examHistory.length > 0
                    ? Math.round(examHistory.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / examHistory.length)
                    : 0}%
                </h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Available Exams</p>
                <h3 className="text-2xl font-bold text-gray-900">{availableExams.length}</h3>
              </div>
            </div>
          </div>

          {/* Available Exams */}
          {availableExams.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableExams.map((exam) => (
                  <div key={exam.courseId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.courseTitle}</h3>
                        <p className="text-sm text-gray-500">{exam.questionsCount} questions • Multiple Choice</p>
                      </div>
                      <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full">Ready</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Estimated: {exam.questionsCount * 2} minutes</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Course Progress</span>
                        <span className="font-medium text-gray-900">{exam.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${exam.progress}%` }}></div>
                      </div>
                    </div>
                    <Link
                      href="/exam"
                      className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      Start Exam
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Exams */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Exams</h2>
          {examHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No exams completed yet</h3>
              <p className="text-gray-500 mb-2">Complete at least 70% of a course to unlock its exam.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-4 font-medium">Course</th>
                    <th className="p-4 font-medium">Exam Type</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examHistory.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{exam.courseTitle}</td>
                      <td className="p-4 text-gray-500">{exam.examType}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900">{exam.score}</span>
                        <span className="text-gray-400">/{exam.maxScore}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          exam.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {exam.passed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {exam.passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{new Date(exam.passedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default CompletedExamsPage;
