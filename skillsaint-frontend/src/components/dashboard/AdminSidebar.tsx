"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/admin/exams", label: "Manage Exams (QCM)", icon: FileQuestion },
  { href: "/admin/finance", label: "Finances & Stripe", icon: CreditCard },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 px-4 py-6 md:h-[calc(100vh-100px)] md:sticky md:top-[100px] flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-4 py-4 mb-6 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-600">
          <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl">
            CR
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Christian Rector</h3>
          <p className="text-xs font-medium text-purple-600">Instructor / Admin</p>
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
        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
            pathname === "/admin/settings"
              ? "bg-purple-50 text-purple-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors w-full">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
