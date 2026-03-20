"use client";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { mockStudents, mockEnrollments } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

// Get mock data - using first student
const currentStudent = mockStudents[0];
const studentEnrollments = mockEnrollments.filter(e => e.studentId === currentStudent.id);

// Map enrollments to courses with full details
const enrolledCourses = studentEnrollments.map(enrollment => {
  const course = coursesData.find(c => c._id === `course-${enrollment.courseId}`);
  return {
    id: enrollment.id,
    title: course?.title || "Course",
    progress: enrollment.progress,
    totalLessons: enrollment.totalLessons,
    completedLessons: enrollment.lessonsCompleted,
    thumbnail: course?.thumbnail || "/images/courses/img-1.png",
    lastAccessed: "Recently",
    courseSlug: course?.slug.current || "course"
  };
});

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <StudentSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10">
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
                <h3 className="text-2xl font-bold text-gray-900">{studentEnrollments.reduce((sum, e) => sum + e.lessonsCompleted, 0)}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Courses Completed</p>
                <h3 className="text-2xl font-bold text-gray-900">{studentEnrollments.filter(e => e.progress === 100).length}</h3>
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
                      href={`/courses/${course.courseSlug}`}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                    >
                      {course.progress === 100 ? "View Course" : "Continue Learning"}
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
