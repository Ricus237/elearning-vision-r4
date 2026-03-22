"use client";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, Trophy } from "lucide-react";
import Image from "next/image";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { CourseType } from "@/types/CourseType";

interface DashboardClientProps {
  enrolledCourses: CourseType[];
}

const DashboardClient = ({ enrolledCourses }: DashboardClientProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <StudentSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 pb-20 md:pb-20 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-secondary mt-1">Welcome back! Here&apos;s an overview of your learning progress.</p>
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
                <h3 className="text-2xl font-bold text-gray-900">0</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Courses Completed</p>
                <h3 className="text-2xl font-bold text-gray-900">0</h3>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Continue Learning</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {enrolledCourses.length === 0 ? (
               <div className="col-span-full bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
                  <p className="text-gray-500">You haven&apos;t enrolled in any courses yet.</p>
                  <Link href="/courses" className="mt-4 inline-block text-purple-600 font-bold">Browse Courses</Link>
               </div>
            ) : (
                enrolledCourses.map((course) => (
                    <div key={course._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6">
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
                            Last accessed: Recently
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2">
                            {course.title}
                        </h3>
                        
                        <div className="mt-auto">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-medium text-gray-700">0% Complete</span>
                                <span className="text-xs text-gray-500">0/{course.lessonsCount} Lessons</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div 
                                className="bg-purple-600 h-2.5 rounded-full" 
                                style={{ width: `0%` }}
                            ></div>
                            </div>
                            
                            <Link 
                            href={`/courses/${course.slug.current}`}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                            >
                            Continue Learning
                            </Link>
                        </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardClient;
