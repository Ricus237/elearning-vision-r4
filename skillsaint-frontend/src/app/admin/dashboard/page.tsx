/* eslint-disable */

import Link from "next/link";
import {
  Users,
  BookOpen,
  FileQuestion,
  TrendingUp,
  PlusCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { fetchMoodle, getUserBilling } from "@/lib/moodle";

interface Student {
  id: number;
  name: string;
  email: string;
  plan: string;
  enrolled_count: number;
  payment_status: string;
  is_activated: boolean;
  billing?: {
    total_price: number;
    amount_paid: number;
    remaining_balance: number;
  };
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
  const rawRecentStudents: Student[] = stats?.recent_students ?? [];

  // Fetch billing for each student to show progress, similar to user dashboard billing
  const recentStudents = await Promise.all(
    rawRecentStudents.map(async (student) => {
      try {
        const billing = await getUserBilling(student.id);
        return { 
          ...student, 
          billing: billing && !billing.error ? billing : undefined 
        };
      } catch (e) {
        return student;
      }
    })
  );


  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120] flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="h-full pt-24 md:pt-0 p-6 md:p-10 lg:p-12 bg-[#f0f2f5] dark:bg-[#0b1120]">
          <div className="max-w-7xl mx-auto">

            {/* Header Section */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Operations Control</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">
                  GBI <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Terminal</span>
                </h1>
                <p className="text-gray-400 font-medium max-w-md text-sm">
                  Strategic management for the Global Bible Institute.
                </p>
              </div>

              <div className="flex gap-4 animate-in fade-in duration-1000 delay-300">
                <Link
                  href="/admin/courses"
                  className="group flex items-center gap-3 bg-white dark:bg-slate-800 border-2 border-gray-900 dark:border-slate-700 text-gray-900 dark:text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-900 dark:hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-xl shadow-gray-100 dark:shadow-none"
                >
                  <PlusCircle className="w-4 h-4" /> Add Course
                </Link>
                <Link
                  href="/admin/exams"
                  className="group flex items-center gap-3 bg-purple-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition-all duration-300 shadow-xl shadow-purple-200 dark:shadow-none hover:-translate-y-1 active:translate-y-0"
                >
                  <FileQuestion className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Add Exam
                </Link>
              </div>
            </header>

            {/* API Error Banner - Premium Style */}
            {statsError && (
              <div className="mb-12 bg-orange-50/50 border border-orange-100 rounded-[2.5rem] p-8 flex items-center gap-6 text-orange-800 animate-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-sm text-orange-500">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-black text-lg tracking-tight">Database Synchronization Issue</p>
                  <p className="text-sm opacity-70">The system cannot reach the specialized database functions. Please verify your token and plugin installation.</p>
                </div>
              </div>
            )}

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-in fade-in duration-1000 slide-in-from-bottom-5">
              <StatCard
                label="Registered Students"
                value={totalStudents}
                sub={`↑ +${newThisMonth} new arrivals`}
                subColor="text-emerald-600"
                icon={<Users className="w-8 h-8" />}
                iconBg="bg-blue-50 text-blue-600"
                hoverColor="hover:shadow-blue-500/5 hover:border-blue-100"
              />
              <StatCard
                label="Courses"
                value={activeCourses}
                sub="Live in Catalog"
                subColor="text-gray-400"
                icon={<BookOpen className="w-8 h-8" />}
                iconBg="bg-purple-50 text-purple-600"
                hoverColor="hover:shadow-purple-500/5 hover:border-purple-100"
              />
              <StatCard
                label="Enrollments"
                value={totalPaid}
                sub={`Growth +${newThisMonth}%`}
                subColor="text-emerald-600"
                icon={<TrendingUp className="w-8 h-8" />}
                iconBg="bg-emerald-50 text-emerald-600"
                hoverColor="hover:shadow-emerald-500/5 hover:border-emerald-100"
              />
              <StatCard
                label="Assessments"
                value={totalQuizzes}
                sub="Active Exams"
                subColor="text-orange-600"
                icon={<FileQuestion className="w-8 h-8" />}
                iconBg="bg-orange-50 text-orange-600"
                hoverColor="hover:shadow-orange-500/5 hover:border-orange-100"
              />
            </div>

            {/* Main Data Section */}
            <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-20 animate-in fade-in duration-1000 delay-500">
              <div className="p-10 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-gray-50/30 dark:bg-slate-800/10">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Recent <span className="text-purple-600 dark:text-purple-400">Student</span> Activities</h2>
                  <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">Live Feed</p>
                </div>
                <Link href="/admin/students" className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-100 dark:hover:border-purple-500 transition-all shadow-sm">
                  Full Archives
                </Link>
              </div>

              {recentStudents.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-200 mx-auto mb-6">
                    <Users className="w-10 h-10" />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Waiting for initial registrations...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-gray-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border-b border-gray-50 dark:border-slate-800">
                        <th className="px-10 py-6">Identity</th>
                        <th className="px-10 py-6">Experience Plan</th>
                        <th className="px-10 py-6 text-center">Courses</th>
                        <th className="px-10 py-6">Payment Status</th>
                        <th className="px-10 py-6">Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                      {recentStudents.map((student: Student) => (
                        <tr key={student.id} className="group hover:bg-purple-50/20 dark:hover:bg-purple-900/10 transition-all duration-300">
                          <td className="px-10 py-8">
                            <div>
                              <p className="font-black text-gray-900 dark:text-white text-lg group-hover:text-purple-600 transition-colors">{student.name || "Anonymous Master"}</p>
                              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-0.5">{student.email}</p>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className={`inline-flex px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${student.plan === "executive"
                                ? "bg-purple-50 text-purple-600 border border-purple-100"
                                : student.plan === "premium"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                                  : "bg-gray-50 text-gray-400 border border-gray-100"
                              }`}>
                              {student.plan === "N/A" ? "Standard" : student.plan}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-black group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                              {student.enrolled_count}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                            {student.billing ? (
                              <div className="flex flex-col gap-2 min-w-[140px]">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                  <span className="text-emerald-600 font-bold">${student.billing.amount_paid.toFixed(2)}</span>
                                  <span className="text-gray-400">/ ${student.billing.total_price.toFixed(2)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-purple-600 transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (student.billing.amount_paid / student.billing.total_price) * 100)}%` }}
                                  />
                                </div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                  {student.billing.remaining_balance > 0 
                                    ? `Remaining: $${student.billing.remaining_balance.toFixed(2)}` 
                                    : "Program Fully Paid"}
                                </p>
                              </div>
                            ) : (
                              student.payment_status === "paid" ? (
                                <div className="flex items-center gap-2 text-emerald-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Awaiting</span>
                                </div>
                              )
                            )}
                          </td>
                          <td className="px-10 py-8">
                            {student.is_activated ? (
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 px-4 py-2 rounded-xl w-fit">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Granted</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-500 bg-red-50/50 px-4 py-2 rounded-xl w-fit">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Restricted</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  subColor: string;
  icon: React.ReactNode;
  iconBg: string;
  hoverColor: string;
}

function StatCard({ label, value, sub, subColor, icon, iconBg, hoverColor }: StatCardProps) {
  return (
    <div className={`group bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 transition-all duration-500 ${hoverColor} dark:hover:border-slate-700`}>
      <div className="flex items-start justify-between mb-8">
        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${iconBg} dark:bg-slate-800`}>
          {icon}
        </div>
        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md bg-gray-50 dark:bg-slate-800/50 ${subColor}`}>
          {sub}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
          {value.toLocaleString()}
        </h3>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
