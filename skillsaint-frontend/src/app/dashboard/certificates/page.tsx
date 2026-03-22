"use client";
import { Award, Download, Eye, Lock } from "lucide-react";
import { mockStudents, mockEnrollments, mockExamScores } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

const currentStudent = mockStudents[0];
const studentExamScores = mockExamScores.filter(e => e.studentId === currentStudent.id);

// Certificates are earned by passing exams
const certificates = studentExamScores
  .filter(score => score.score >= score.maxScore * 0.7)
  .map(score => {
    const course = coursesData.find(c => c._id === `course-${score.courseId}`);
    return {
      id: `cert-${score.id}`,
      courseTitle: course?.title || "Course",
      issuedDate: score.passedDate,
      score: score.score,
      maxScore: score.maxScore,
      certificateId: `CERT-${String(score.courseId).padStart(3, "0")}-${currentStudent.id.split("_")[1]}`,
    };
  });

// Locked certificates (courses enrolled but not yet completed exam)
const studentEnrollments = mockEnrollments.filter(e => e.studentId === currentStudent.id);
const lockedCertificates = studentEnrollments
  .filter(enrollment => {
    const hasPassed = studentExamScores.find(
      s => s.courseId === enrollment.courseId && s.score >= s.maxScore * 0.7
    );
    return !hasPassed;
  })
  .map(enrollment => {
    const course = coursesData.find(c => c._id === `course-${enrollment.courseId}`);
    return {
      courseTitle: course?.title || "Course",
      progress: enrollment.progress,
      courseId: enrollment.courseId,
    };
  });

const CertificatesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10 pb-20 md:pb-20 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
            <p className="text-secondary mt-1">Your earned certificates and achievements.</p>
          </header>

          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 mb-10 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{certificates.length} Certificate{certificates.length !== 1 ? "s" : ""} Earned</h2>
                  <p className="text-purple-100 mt-1">{lockedCertificates.length} more to unlock from your enrolled courses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Earned Certificates */}
          {certificates.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Earned Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Certificate Preview */}
                    <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8 border-b border-gray-100 text-center relative">
                      <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                        Verified
                      </div>
                      <Award className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-gray-900">Certificate of Completion</h3>
                      <p className="text-sm text-gray-500 mt-1">{cert.courseTitle}</p>
                      <div className="mt-4 inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                        ID: {cert.certificateId}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-gray-500">Issued</span>
                        <span className="font-medium text-gray-900">
                          {new Date(cert.issuedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-6">
                        <span className="text-gray-500">Exam Score</span>
                        <span className="font-bold text-green-600">{cert.score}/{cert.maxScore}</span>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-50 text-purple-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-purple-100 transition-colors">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-gray-100 transition-colors">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Certificates */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Locked Certificates</h2>
          {lockedCertificates.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All certificates earned!</h3>
              <p className="text-gray-500">Amazing work! You&apos;ve earned all available certificates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedCertificates.map((cert) => (
                <div key={cert.courseId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-75">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 font-medium px-3 py-1 rounded-full">Locked</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{cert.courseTitle}</h3>
                  <p className="text-sm text-gray-500 mb-4">Complete the course and pass the exam to unlock.</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Course Progress</span>
                    <span className="font-medium text-gray-700">{cert.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${cert.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default CertificatesPage;
