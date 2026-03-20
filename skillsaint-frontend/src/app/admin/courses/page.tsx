"use client";
import { useState } from "react";
import { Search, PlusCircle, Edit3, Trash2, Eye, Users, BookOpen, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { coursesData } from "@/components/courses/courseData";
import { mockEnrollments } from "@/data/students";
import { subjects as subjectsData } from "@/data/curriculum";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

// Enrich courses with enrollment data
const coursesWithStats = coursesData.map(course => {
  const courseId = parseInt(course._id.replace("course-", ""));
  const enrollments = mockEnrollments.filter(e => e.courseId === courseId);
  const courseSubjects = subjectsData.find(s => s.courseId === courseId);
  return {
    ...course,
    enrolledStudents: enrollments.length,
    avgProgress: enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0,
    subjectsCount: courseSubjects?.subjects.length || 0,
    revenue: enrollments.length * (course.discountPrice || course.price),
  };
});

const ManageCoursesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredCourses = coursesWithStats.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = coursesWithStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalStudents = coursesWithStats.reduce((sum, c) => sum + c.enrolledStudents, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
              <p className="text-secondary mt-1">Create, edit, and monitor all your courses.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> New Course
            </button>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Courses</p>
                <h3 className="text-xl font-bold text-gray-900">{coursesWithStats.length}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Enrollments</p>
                <h3 className="text-xl font-bold text-gray-900">{totalStudents}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Lessons</p>
                <h3 className="text-xl font-bold text-gray-900">{coursesWithStats.reduce((sum, c) => sum + (c.lessonsCount || 0), 0)}</h3>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
            />
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-40 h-28 relative rounded-xl overflow-hidden shrink-0">
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{course.shortDescription}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/courses/${course.slug.current}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <span className="text-gray-500">
                        <strong className="text-gray-900">{course.enrolledStudents}</strong> students
                      </span>
                      <span className="text-gray-500">
                        <strong className="text-gray-900">{course.subjectsCount}</strong> subjects
                      </span>
                      <span className="text-gray-500">
                        <strong className="text-gray-900">{course.lessonsCount}</strong> lessons
                      </span>
                      <span className="text-gray-500">
                        Avg Progress: <strong className="text-gray-900">{course.avgProgress}%</strong>
                      </span>
                      <span className="text-gray-500">
                        Revenue: <strong className="text-emerald-600">${course.revenue}</strong>
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        course.status === "Ongoing" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500">Try adjusting your search query.</p>
            </div>
          )}

          {/* Create Course Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="e.g. Advanced Christian Apologetics" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" placeholder="Course description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                      <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="99" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-5 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-5 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
                    Create Course
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ManageCoursesPage;
