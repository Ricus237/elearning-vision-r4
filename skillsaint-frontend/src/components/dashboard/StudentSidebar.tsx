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
  { href: "/dashboard/exams", label: "Exams (Locked)", icon: Lock },
  { href: "/dashboard/certificates", label: "Certificates", icon: Trophy },
];

const bottomNavItems = [
  { href: "/dashboard/profile", label: "Profile", icon: User },
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
          // If it's an email, extract the first part
          val = val.split("@")[0];
          // Capitalize first letter
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
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 px-4 py-6 md:h-screen md:sticky md:top-0 shrink-0">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-4 mb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl border-2 border-purple-200">
             {userName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{userName}</h3>
            <p className="text-xs text-purple-600 font-medium">
              Student
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};

export default StudentSidebar;
