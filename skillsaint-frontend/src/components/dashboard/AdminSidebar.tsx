"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  Trophy,
  Globe,
  LogOut,
  Settings,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Manage Students", icon: Users },
  { href: "/admin/courses", label: "Manage Courses", icon: BookOpen },
  { href: "/admin/exams", label: "Manage Exams", icon: FileQuestion },
  { href: "/admin/exams/results", label: "Exam Results", icon: Trophy },
  { href: "/admin/support", label: "Support Inbox", icon: MessageCircle },
  { href: "/admin/site-content", label: "Site Content", icon: Globe },
];

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    
    // Check if there's a more specific nav item that matches the current pathname
    const isMoreSpecificMatch = navItems.some(item => 
      item.href !== href && 
      item.href.startsWith(href) && 
      pathname.startsWith(item.href)
    );

    return pathname.startsWith(href) && !isMoreSpecificMatch;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-6 left-6 z-[110]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-[100] w-64 h-screen bg-white dark:bg-[#0b1120] border-r border-gray-100 dark:border-slate-800 px-4 py-6 flex flex-col shrink-0 transition-transform duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      <div className="flex items-center gap-4 px-2 py-4 mb-6 border-b-2 border-gray-50 dark:border-slate-800/50">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-200 dark:shadow-none rotate-3 group-hover:rotate-0 transition-transform">
          G
        </div>
        <div>
          <h3 className="font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase text-sm">Control <span className="text-purple-600 dark:text-purple-400">Hub</span></h3>
          <p className="text-[10px] font-black text-gray-300 dark:text-slate-500 uppercase tracking-widest mt-1">GBI • Vision/R4</p>
          <p className="text-[8px] font-bold text-gray-400 dark:text-slate-600 mt-1 uppercase tracking-tighter">Global Bible Institute</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <p className="px-4 text-[9px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-2">Operations</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-4 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
              isActive(item.href)
                ? "bg-gray-900 dark:bg-purple-600 text-white shadow-xl shadow-gray-200 dark:shadow-none -translate-y-0.5"
                : "text-gray-400 dark:text-slate-500 hover:bg-purple-50 dark:hover:bg-slate-800/50 hover:text-purple-600 dark:hover:text-purple-400"
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform duration-500 ${isActive(item.href) ? "rotate-0" : "group-hover:scale-110 group-hover:rotate-6"}`} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-50 dark:border-slate-800/50 flex flex-col gap-1">
        <p className="px-4 text-[9px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Management</p>
        <Link
          href="/admin/settings"
          className="group flex items-center gap-4 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
          Settings
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="group flex items-center gap-4 px-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all duration-300 w-full text-left cursor-pointer"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
