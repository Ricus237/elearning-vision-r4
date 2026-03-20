"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckCircle,
  LayoutDashboard,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import Image from "next/image";
import { mockStudents } from "@/data/students";

const currentStudent = mockStudents[0];

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/my-courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/completed-exams", label: "Completed Exams", icon: CheckCircle },
  { href: "/dashboard/certificates", label: "Certificates", icon: Trophy },
];

const bottomNavItems = [
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const StudentSidebar = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 px-4 py-6 md:h-[calc(100vh-100px)] md:sticky md:top-[100px] shrink-0">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-4 mb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-100">
            <Image
              src={currentStudent.profileImage}
              alt={currentStudent.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentStudent.name}</h3>
            <p className="text-xs text-gray-500">
              {currentStudent.isBeliever ? "Believer" : "Seeker"}
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
        </div>
      </div>
    </aside>
  );
};

export default StudentSidebar;
