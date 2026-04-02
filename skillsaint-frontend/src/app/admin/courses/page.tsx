import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { fetchMoodle } from "@/lib/moodle";
import { BookOpen, Users, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

/**
 * Admin Courses page – 100% live data from Moodle core_course_get_courses.
 * No static mock data.
 */
const ManageCoursesPage = async () => {
  let courses: any[] = [];
  let totalEnrolled = 0;

  try {
    const data = await fetchMoodle("core_course_get_courses");
    if (Array.isArray(data)) {
      // Exclude the site course (id=1)
      courses = data.filter((c: any) => c.id !== 1);
      totalEnrolled = courses.reduce((sum: number, c: any) => sum + (c.numsections || 0), 0);
    }
  } catch {}

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
              <p className="text-gray-500 mt-1">Live data from Moodle — {courses.length} course{courses.length !== 1 ? "s" : ""} found.</p>
            </div>
            <a
              href={`${process.env.MOODLE_URL}/course/edit.php?category=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm text-sm"
            >
              <ExternalLink className="w-4 h-4" /> Add Course in Moodle
            </a>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Courses</p>
                <h3 className="text-2xl font-bold text-gray-900">{courses.length}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Visible Courses</p>
                <h3 className="text-2xl font-bold text-gray-900">{courses.filter((c: any) => c.visible).length}</h3>
              </div>
            </div>
          </div>

          {/* Courses List */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No courses found in Moodle.<br />Make sure the plugin is configured and the token has read access.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course: any) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 truncate">{course.fullname}</h3>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${course.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {course.visible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      {course.shortname && <p className="text-xs text-gray-400 mb-2">Short name: <strong>{course.shortname}</strong></p>}
                      {course.summary && (
                        <p className="text-sm text-gray-500 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: course.summary.replace(/<[^>]*>/g, '').slice(0, 160) + (course.summary.length > 160 ? '…' : '') }}
                        />
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                        <span>ID: <strong className="text-gray-700">{course.id}</strong></span>
                        {course.numsections != null && <span>Sections: <strong className="text-gray-700">{course.numsections}</strong></span>}
                        {course.startdate > 0 && <span>Starts: <strong className="text-gray-700">{new Date(course.startdate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`${process.env.NEXT_PUBLIC_MOODLE_URL ?? ''}/course/view.php?id=${course.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View in Moodle"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={`${process.env.NEXT_PUBLIC_MOODLE_URL ?? ''}/course/edit.php?id=${course.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit in Moodle"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
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

export default ManageCoursesPage;
