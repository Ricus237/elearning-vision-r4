"use client";
import Link from "next/link";
import {
  Users,
  BookOpen,
  FileQuestion,
  DollarSign,
  UserX,
  PlusCircle,
  MoreVertical,
} from "lucide-react";
import { mockStudents, mockEnrollments } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

// Calculate teacher statistics from mock data
const totalStudents = mockStudents.length;
const activeCourses = coursesData.length;
const recentRegistrations = mockStudents.filter(s => {
  const date = new Date(s.registeredAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return date > thirtyDaysAgo;
}).length;
const totalRevenue = "$" + (mockEnrollments.length * 79).toLocaleString();

const teacherStats = {
  totalStudents,
  activeCourses,
  totalRevenue,
  recentRegistrations,
};

// Map students data with their enrollment courses
const studentsData = mockStudents.slice(0, 4).map((student, index) => {
  const enrollment = mockEnrollments.find(e => e.studentId === student.id);
  const enrolledCourse = enrollment ? coursesData.find(c => c._id === `course-${enrollment.courseId}`) : null;
  return {
    id: index + 1,
    name: student.name,
    email: student.email,
    enrolled: enrolledCourse?.title || "No Course",
    status: student.status,
  };
});

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Christian Education Dashboard</h1>
              <p className="text-secondary mt-1">Manage courses, students, and educational content.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/courses" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
                <PlusCircle className="w-4 h-4" /> Add Course
              </Link>
              <Link href="/admin/exams" className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm">
                <FileQuestion className="w-4 h-4" /> Add QCM
              </Link>
            </div>
          </header>

          {/* Teacher Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <h3 className="text-2xl font-bold text-gray-900">{teacherStats.totalStudents}</h3>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">↑ +{teacherStats.recentRegistrations} this month</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Courses</p>
                  <h3 className="text-2xl font-bold text-gray-900">{teacherStats.activeCourses}</h3>
                </div>
              </div>
              <div className="text-sm text-gray-500 font-medium">All systems normal</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">{teacherStats.totalRevenue}</h3>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Stripe Active • Payout in 2d</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Exams Created</p>
                  <h3 className="text-2xl font-bold text-gray-900">4</h3>
                </div>
              </div>
              <div className="text-sm text-orange-600 font-medium">1 needs review</div>
            </div>
          </div>

          {/* Student Management Preview */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Recent Students</h2>
              <Link href="/admin/students" className="text-purple-600 text-sm font-medium hover:text-purple-700">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Enrolled Course</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentsData.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{student.name}</td>
                      <td className="p-4 text-gray-500">{student.email}</td>
                      <td className="p-4 text-gray-700">{student.enrolled}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Suspend/Remove User">
                            <UserX className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Exam System</h3>
              <p className="text-indigo-800 text-sm max-w-xl">
                Create and manage multiple-choice exams for each of your 7 Christian courses. Build fair assessments that evaluate student comprehension of Scripture and theology.
              </p>
            </div>
            <Link href="/admin/exams" className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm">
              Create Assessment
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
