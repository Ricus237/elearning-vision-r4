"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  Globe,
  LogOut,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Manage Students", icon: Users },
  { href: "/admin/courses", label: "Manage Courses", icon: BookOpen },
  { href: "/admin/exams", label: "Manage Exams", icon: FileQuestion },
  { href: "/admin/site-content", label: "Site Content", icon: Globe },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full md:w-72 bg-white border-r border-gray-100 px-6 py-8 md:h-screen md:sticky md:top-0 flex flex-col shrink-0 animate-in slide-in-from-left duration-700">
      <div className="flex items-center gap-4 px-2 py-6 mb-10 border-b-2 border-gray-50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-200 rotate-3 group-hover:rotate-0 transition-transform">
          I
        </div>
        <div>
          <h3 className="font-black text-gray-900 tracking-tight leading-none uppercase text-sm">Control <span className="text-purple-600">Hub</span></h3>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">IBI • Vision/R4</p>
          <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">International Bible Institute</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Operations</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-4 px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
              isActive(item.href)
                ? "bg-gray-900 text-white shadow-xl shadow-gray-200 -translate-y-0.5"
                : "text-gray-400 hover:bg-purple-50 hover:text-purple-600"
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive(item.href) ? "rotate-0" : "group-hover:scale-110 group-hover:rotate-6"}`} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-gray-50 flex flex-col gap-2">
        <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">Management</p>
        <Link
          href="/admin/settings"
          className="group flex items-center gap-4 px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
          Settings
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="group flex items-center gap-4 px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 w-full text-left"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
};

export default AdminSidebar;
