"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Settings,
  Trophy,
  User,
  LogOut,
  Lock
} from "lucide-react";
import { logoutAction } from "@/lib/actions";

const navItems = [
  { href: "/dashboard", label: "Program Courses", icon: BookOpen },
  { href: "/dashboard/exams", label: "My Assessments", icon: Lock },
  { href: "/dashboard/certificates", label: "Certificates", icon: Trophy },
];

const managementItems = [
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const StudentSidebar = () => {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const userCookie = cookies.find((c) => c.trim().startsWith("moodle_user="));
      if (userCookie) {
        let val = decodeURIComponent(userCookie.split("=")[1]);
        if (val.includes("@")) {
          val = val.split("@")[0];
          val = val.charAt(0).toUpperCase() + val.slice(1);
        }
        setUserName(val);
      }
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full md:w-72 bg-white border-r border-gray-100 px-6 py-8 md:h-screen md:sticky md:top-0 flex flex-col shrink-0 animate-in slide-in-from-left duration-700">
      <div className="flex items-center gap-4 px-2 py-6 mb-10 border-b-2 border-gray-50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-200 rotate-3 group-hover:rotate-0 transition-transform">
          {userName.charAt(0)}
        </div>
        <div>
          <h3 className="font-black text-gray-900 tracking-tight leading-none uppercase text-sm">
            Student <span className="text-purple-600">Portal</span>
          </h3>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">
            IBI • {userName}
          </p>
          <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">International Bible Institute</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Academic</p>
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
        {managementItems.map((item) => (
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

export default StudentSidebar;
