"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  CreditCard,
  LogOut,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Manage Students", icon: Users },
  { href: "/admin/courses", label: "Manage Courses", icon: BookOpen },
  { href: "/admin/exams", label: "Manage Exams", icon: FileQuestion },
  { href: "/admin/finance", label: "Finances", icon: CreditCard },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 px-4 py-6 md:h-screen md:sticky md:top-0 flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-4 py-4 mb-6 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl border-2 border-purple-200">
          A
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Administration</h3>
          <p className="text-xs font-medium text-purple-600">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
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

      <div className="mt-auto pt-6 border-t border-gray-100 space-y-1">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
};

export default AdminSidebar;
