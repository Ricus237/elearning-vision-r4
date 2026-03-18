"use client";
import Link from "next/link";
import { Clock, BookOpen, Search, Filter } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { mockStudents, mockEnrollments } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

const currentStudent = mockStudents[0];
const studentEnrollments = mockEnrollments.filter(e => e.studentId === currentStudent.id);

const enrolledCourses = studentEnrollments.map(enrollment => {
  const course = coursesData.find(c => c._id === `course-${enrollment.courseId}`);
  return {
    id: enrollment.id,
    title: course?.title || "Course",
    shortDescription: course?.shortDescription || "",
    progress: enrollment.progress,
    totalLessons: enrollment.totalLessons,
    completedLessons: enrollment.lessonsCompleted,
    thumbnail: course?.thumbnail || "/images/courses/img-1.png",
    instructor: course?.instructor?.name || "Instructor",
    level: course?.level || "Beginner",
    lastAccessed: "Recently",
    courseSlug: course?.slug.current || "course",
    enrolledAt: enrollment.enrolledAt,
  };
});

const MyCoursesPage = () => {
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = enrolledCourses.filter(course => {
    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && course.progress === 100) ||
      (filter === "in-progress" && course.progress < 100);
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-secondary mt-1">Track and continue your enrolled courses.</p>
          </header>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all" ? "bg-purple-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                All ({enrolledCourses.length})
              </button>
              <button
                onClick={() => setFilter("in-progress")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "in-progress" ? "bg-purple-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "completed" ? "bg-purple-600 text-white" : "text-gray-600 hover:text-gray-900"}`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500 mb-6">
                {filter !== "all" ? "Try changing your filter." : "You haven't enrolled in any courses yet."}
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-700 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-2/5 aspect-[4/3] sm:aspect-auto relative shrink-0">
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                      {course.progress === 100 && (
                        <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          ✓ Completed
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">{course.level}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{course.instructor}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.shortDescription}</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-medium text-gray-700">{course.progress}%</span>
                          <span className="text-xs text-gray-500">{course.completedLessons}/{course.totalLessons} lessons</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${course.progress === 100 ? "bg-green-500" : "bg-purple-600"}`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>

                        <Link
                          href={`/courses/${course.courseSlug}`}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold py-2.5 px-4 rounded-xl transition-colors"
                        >
                          {course.progress === 100 ? "Review Course" : "Continue Learning"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default MyCoursesPage;
