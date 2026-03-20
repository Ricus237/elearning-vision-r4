"use client";
import { useState } from "react";
import { Search, UserX, MoreVertical, Eye, Mail, ChevronLeft, ChevronRight, Filter, Users } from "lucide-react";
import Image from "next/image";
import { mockStudents, mockEnrollments } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

// Build full student data with enrollments
const allStudents = mockStudents.map(student => {
  const enrollments = mockEnrollments.filter(e => e.studentId === student.id);
  const enrolledCourses = enrollments.map(enrollment => {
    const course = coursesData.find(c => c._id === `course-${enrollment.courseId}`);
    return {
      title: course?.title || "Course",
      progress: enrollment.progress,
    };
  });
  return {
    ...student,
    enrolledCourses,
    totalEnrollments: enrollments.length,
    avgProgress: enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0,
  };
});

const ManageStudentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Suspended">("all");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const filteredStudents = allStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const viewingStudent = selectedStudent ? allStudents.find(s => s.id === selectedStudent) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">

          {viewingStudent ? (
            /* Student Detail View */
            <div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Students
              </button>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="h-24 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <div className="px-8 pb-8 -mt-10">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                      <Image src={viewingStudent.profileImage} alt={viewingStudent.name} width={80} height={80} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900">{viewingStudent.name}</h2>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          viewingStudent.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {viewingStudent.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{viewingStudent.email}</p>
                      <p className="text-gray-400 text-sm mt-1">{viewingStudent.address}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors">
                        <Mail className="w-4 h-4" /> Contact
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors">
                        <UserX className="w-4 h-4" /> Suspend
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Enrolled Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{viewingStudent.totalEnrollments}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Average Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{viewingStudent.avgProgress}%</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Date(viewingStudent.registeredAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Enrolled Courses</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {viewingStudent.enrolledCourses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No courses enrolled</div>
                  ) : (
                    viewingStudent.enrolledCourses.map((course, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${course.progress === 100 ? "bg-green-500" : "bg-purple-600"}`}
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">{course.progress}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Students List View */
            <div>
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
                <p className="text-secondary mt-1">View, manage, and monitor all enrolled students.</p>
              </header>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                    <h3 className="text-2xl font-bold text-gray-900">{allStudents.length}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active</p>
                    <h3 className="text-2xl font-bold text-gray-900">{allStudents.filter(s => s.status === "Active").length}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Suspended</p>
                    <h3 className="text-2xl font-bold text-gray-900">{allStudents.filter(s => s.status !== "Active").length}</h3>
                  </div>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "Active" | "Suspended")}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                        <th className="p-4 font-medium">Student</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Courses</th>
                        <th className="p-4 font-medium">Avg Progress</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Joined</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200">
                                <Image src={student.profileImage} alt={student.name} width={36} height={36} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-medium text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-500 text-sm">{student.email}</td>
                          <td className="p-4 font-medium text-gray-900">{student.totalEnrollments}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${student.avgProgress}%` }}></div>
                              </div>
                              <span className="text-sm text-gray-700">{student.avgProgress}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              student.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 text-sm">
                            {new Date(student.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedStudent(student.id)}
                                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Suspend">
                                <UserX className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No students found</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ManageStudentsPage;
