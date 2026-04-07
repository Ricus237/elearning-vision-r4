import Link from "next/link";
import {
  Users,
  BookOpen,
  FileQuestion,
  TrendingUp,
  PlusCircle,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { fetchMoodle } from "@/lib/moodle";

interface Student {
  id: number;
  name: string;
  email: string;
  plan: string;
  enrolled_count: number;
  payment_status: string;
  is_activated: boolean;
}

interface DashboardStats {
  total_students: number;
  active_courses: number;
  new_this_month: number;
  total_paid_apps: number;
  total_quizzes: number;
  recent_students: Student[];
  exception?: string;
  errorcode?: string;
}

/**
 * Admin Dashboard – 100% dynamic, all data pulled live from Moodle.
 * No static mock data anywhere.
 */
const AdminDashboardPage = async () => {
  // Fetch live stats from our custom Moodle API
  let stats: DashboardStats | null = null;

  let statsError = false;

  try {
    stats = await fetchMoodle("local_skillsaint_get_admin_dashboard_stats");
    if (stats?.exception || stats?.errorcode) {
      statsError = true;
      stats = null;
    }
  } catch {
    statsError = true;
  }

  const totalStudents = stats?.total_students ?? 0;
  const activeCourses = stats?.active_courses ?? 0;
  const newThisMonth = stats?.new_this_month ?? 0;
  const totalPaid = stats?.total_paid_apps ?? 0;
  const totalQuizzes = stats?.total_quizzes ?? 0;
  const recentStudents: Student[] = stats?.recent_students ?? [];


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Christian Education Dashboard</h1>
              <p className="text-gray-500 mt-1">Live data from Moodle — no static content.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/courses"
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Add Course
              </Link>
              <Link
                href="/admin/exams"
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm"
              >
                <FileQuestion className="w-4 h-4" /> Add Exam
              </Link>
            </div>
          </header>

          {/* API Error Banner */}
          {statsError && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Could not load live stats from Moodle.</p>
                <p className="text-xs mt-0.5">Make sure the plugin is updated and the <code>local_skillsaint_get_admin_dashboard_stats</code> function is registered.</p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              label="Total Students"
              value={totalStudents}
              sub={`↑ +${newThisMonth} this month`}
              subColor="text-green-600"
              icon={<Users className="w-6 h-6" />}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Active Courses"
              value={activeCourses}
              sub="Live in Moodle"
              subColor="text-gray-500"
              icon={<BookOpen className="w-6 h-6" />}
              iconBg="bg-purple-50 text-purple-600"
            />
            <StatCard
              label="Paid Enrollments"
              value={totalPaid}
              sub={`+${newThisMonth} this month`}
              subColor="text-green-600"
              icon={<TrendingUp className="w-6 h-6" />}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Exams / Quizzes"
              value={totalQuizzes}
              sub="Configured in Moodle"
              subColor="text-orange-600"
              icon={<FileQuestion className="w-6 h-6" />}
              iconBg="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Recent Students Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Recent Students</h2>
              <Link href="/admin/students" className="text-purple-600 text-sm font-medium hover:text-purple-700">
                View All
              </Link>
            </div>

            {recentStudents.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No students registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Plan</th>
                      <th className="p-4 font-medium">Courses</th>
                      <th className="p-4 font-medium">Payment</th>
                      <th className="p-4 font-medium">Activated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentStudents.map((student: Student) => (

                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{student.name || "—"}</td>
                        <td className="p-4 text-gray-500 text-sm">{student.email}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            student.plan === "executive"
                              ? "bg-purple-100 text-purple-700"
                              : student.plan === "premium"
                              ? "bg-blue-100 text-blue-700"
                              : student.plan === "N/A"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {student.plan === "N/A" ? "Not applied" : student.plan}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                            {student.enrolled_count}
                          </span>
                        </td>
                        <td className="p-4">
                          {student.payment_status === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" /> Paid
                            </span>
                          ) : student.payment_status === "pending" ? (
                            <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-semibold">
                              <Clock className="w-4 h-4" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-semibold">
                              <XCircle className="w-4 h-4" /> N/A
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {student.is_activated ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <ShieldCheck className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
                              <ShieldAlert className="w-4 h-4" /> Locked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exam CTA Banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Exam System</h3>
              <p className="text-indigo-800 text-sm max-w-xl">
                Create and manage multiple-choice exams for your Christian courses. Build fair assessments that evaluate student comprehension of Scripture and theology.
              </p>
            </div>
            <Link
              href="/admin/exams"
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
            >
              Create Assessment
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};

// Reusable stat card component
function StatCard({
  label,
  value,
  sub,
  subColor,
  icon,
  iconBg,
}: {
  label: string;
  value: number;
  sub: string;
  subColor: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</h3>
        </div>
      </div>
      <div className={`text-sm font-medium ${subColor}`}>{sub}</div>
    </div>
  );
}

export default AdminDashboardPage;
