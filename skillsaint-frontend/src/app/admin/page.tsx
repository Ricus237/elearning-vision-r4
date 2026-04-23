import PageHeader from "@/components/pageHeader";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Settings, BarChart3 } from "lucide-react";
import { Users, BookOpen } from "@/lib/icons";


export const metadata: Metadata = {
  title: `Admin Dashboard | ${siteName}`,
  description: "Manage your SkillSaint learning platform.",
};

const AdminDashboard = () => {
  const stats = [
    { label: "Total Students", value: "1,240", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Courses", value: "48", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Monthly Revenue", value: "$12,450", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },

  ];

  return (
    <main className="bg-white dark:bg-[#0b1120]">
      <PageHeader
        description="Monitor platform activity, manage courses, and review student progress."
        subTitle="Administration"
      >
        LMS Dashboard
      </PageHeader>

      <section className="py-20 bg-[#f0f2f5] dark:bg-[#0b1120] min-h-screen">
        <div className="container">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className={`size-16 ${stat.bg} dark:bg-slate-800 ${stat.color} dark:text-opacity-80 rounded-2xl flex items-center justify-center`}>
                  <stat.icon className="size-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                <LayoutDashboard className="size-6 text-purple-600 dark:text-purple-400" />
                Quick Management
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/admin/courses" className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 group transition-colors border border-transparent hover:border-purple-100 dark:hover:border-purple-900/50">
                  <BookOpen className="size-6 text-gray-400 dark:text-slate-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-4" />
                  <p className="font-black text-gray-900 dark:text-white">Manage Courses</p>
                  <p className="text-sm text-gray-500 dark:text-slate-500">Add, edit or remove courses</p>
                </Link>
                <Link href="/admin/students" className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50">
                  <Users className="size-6 text-gray-400 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-4" />
                  <p className="font-black text-gray-900 dark:text-white">User Directory</p>
                  <p className="text-sm text-gray-500 dark:text-slate-500">Manage student enrollments</p>
                </Link>
                <Link href="/admin/settings" className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 group transition-colors border border-transparent hover:border-amber-100 dark:hover:border-amber-900/50">
                  <Settings className="size-6 text-gray-400 dark:text-slate-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 mb-4" />
                  <p className="font-black text-gray-900 dark:text-white">Platform Settings</p>
                  <p className="text-sm text-gray-500 dark:text-slate-500">Configure LMS integration</p>
                </Link>
              </div>
            </div>

            <div className="bg-purple-600 dark:bg-purple-900/40 p-10 rounded-[3rem] text-white flex flex-col justify-between border border-transparent dark:border-purple-500/20">
              <div>
                <h2 className="text-2xl font-black mb-4">LMS Integration</h2>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">Status</span>
                  <span className="px-2 py-1 bg-emerald-500 rounded text-[10px] font-black uppercase">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
