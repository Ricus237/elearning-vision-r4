"use client";
import Link from "next/link";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  GraduationCap, 
  LayoutDashboard, 
  Settings, 
  Trophy, 
  User 
} from "lucide-react";
import Image from "next/image";

// Dummy data for the dashboard
const enrolledCourses = [
  {
    id: 1,
    title: "UI/UX Design Fundamentals",
    progress: 75,
    totalLessons: 70,
    completedLessons: 52,
    thumbnail: "/images/courses/img-4.png",
    lastAccessed: "2 hours ago"
  },
  {
    id: 2,
    title: "Complete React Developer Course",
    progress: 30,
    totalLessons: 24,
    completedLessons: 7,
    thumbnail: "/images/courses/img-1.png",
    lastAccessed: "1 day ago"
  }
];

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 px-4 py-6 md:h-[calc(100vh-100px)] md:sticky md:top-[100px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 py-4 mb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-100">
              <Image 
                src="/images/hero/avatar-1.png" 
                alt="User Profile" 
                width={48} 
                height={48} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Student Name</h3>
              <p className="text-xs text-gray-500">Free Member</p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-medium transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              Overview
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
              <BookOpen className="w-5 h-5" />
              My Courses
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
              <CheckCircle className="w-5 h-5" />
              Completed Exams
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
              <Trophy className="w-5 h-5" />
              Certificates
            </Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
              <User className="w-5 h-5" />
              Profile
            </Link>
            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-secondary mt-1">Welcome back! Here's an overview of your learning progress.</p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
                <h3 className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Lessons</p>
                <h3 className="text-2xl font-bold text-gray-900">59</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Certificates</p>
                <h3 className="text-2xl font-bold text-gray-900">0</h3>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Continue Learning</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-1/3 aspect-[4/3] relative rounded-2xl overflow-hidden shrink-0">
                  <Image 
                    src={course.thumbnail} 
                    alt={course.title} 
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-500">
                    <Clock className="w-4 h-4" />
                    Last accessed: {course.lastAccessed}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-medium text-gray-700">{course.progress}% Complete</span>
                      <span className="text-xs text-gray-500">{course.completedLessons}/{course.totalLessons} Lessons</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                    
                    <Link 
                      href="/courses/ui-ux-design-fundamentals" 
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                    >
                      Resume Course
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
