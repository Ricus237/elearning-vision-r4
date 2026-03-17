"use client";
import Link from "next/link";
import { 
  Users, 
  Settings, 
  LayoutDashboard, 
  BookOpen, 
  FileQuestion,
  DollarSign,
  UserX,
  PlusCircle,
  MoreVertical,
  LogOut,
  CreditCard
} from "lucide-react";
import Image from "next/image";

// Dummy data for the teacher dashboard
const teacherStats = {
  totalStudents: 1540,
  activeCourses: 7,
  totalRevenue: "$14,500",
  recentRegistrations: 24,
};

const studentsData = [
  { id: 1, name: "John Doe", email: "john@example.com", enrolled: "UI/UX Design", status: "Active" },
  { id: 2, name: "Alice Smith", email: "alice@example.com", enrolled: "Complete React", status: "Active" },
  { id: 3, name: "Robert Johnson", email: "robert@example.com", enrolled: "Node.js API", status: "Suspended" },
  { id: 4, name: "Emma Watson", email: "emma@example.com", enrolled: "UI/UX Design", status: "Active" },
];

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 px-4 py-6 md:h-[calc(100vh-100px)] md:sticky md:top-[100px] flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 mb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600">
            <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
              JT
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Jake Thompson</h3>
            <p className="text-xs font-medium text-purple-600">Teacher / Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </Link>
          <Link href="/admin/students" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5" />
            Manage Students
          </Link>
          <Link href="/admin/courses" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
            <BookOpen className="w-5 h-5" />
            Manage Courses
          </Link>
          <Link href="/admin/exams" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
            <FileQuestion className="w-5 h-5" />
            Manage Exams (QCM)
          </Link>
          <Link href="/admin/finance" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
            <CreditCard className="w-5 h-5" />
            Finances & Stripe
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Control Panel</h1>
              <p className="text-secondary mt-1">Manage your platform, students, and revenue.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm">
                <PlusCircle className="w-4 h-4" /> Add Course
              </button>
              <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm">
                <FileQuestion className="w-4 h-4" /> Add QCM
              </button>
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
              <button className="text-purple-600 text-sm font-medium hover:text-purple-700">View All</button>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">QCM Evaluation Module</h3>
              <p className="text-indigo-800 text-sm max-w-xl">
                Ready to create a new Multiple Choice Exam? Use the new Exam Builder to quickly generate evaluated tests for your students.
              </p>
            </div>
            <button className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm">
              Create New QCM
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
