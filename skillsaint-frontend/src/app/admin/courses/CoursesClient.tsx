"use client";

import { useState, useTransition } from "react";
import { BookOpen, Users, ExternalLink, Eye, Plus, X, Pencil, Trash2, ChevronDown, ChevronRight, Play, FileText, Link as LinkIcon, HelpCircle } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

type Course = {
  id: number;
  fullname: string;
  shortname: string;
  summary: string;
  visible: number;
  numsections: number;
  startdate: number;
  categoryid?: number;
};

async function callMoodleAdmin(wsfunction: string, params: Record<string, any> = {}) {
  const res = await fetch("/api/moodle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: wsfunction, params })
  });
  return res.json();
}

export default function CoursesClient({ initialCourses, moodleToken }: { initialCourses: Course[], moodleToken: string }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isPending, startTransition] = useTransition();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContents, setCourseContents] = useState<any[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Form states
  const [formData, setFormData] = useState({
    fullname: "",
    shortname: "",
    summary: "",
    visible: 1,
    numsections: 4,
    startdate: "",
    enddate: "",
    categoryid: 1,
  });

  const handleOpenAdd = () => {
    setSelectedCourse(null);
    setFormData({ fullname: "", shortname: "", summary: "", visible: 1, numsections: 4, startdate: "", enddate: "", categoryid: 1 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      fullname: course.fullname,
      shortname: course.shortname || "",
      summary: course.summary ? course.summary.replace(/<[^>]*>/g, '') : "",
      visible: course.visible,
      numsections: course.numsections || 4,
      startdate: course.startdate ? new Date(course.startdate * 1000).toISOString().split('T')[0] : "",
      enddate: "",
      categoryid: course.categoryid || 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenView = async (course: Course) => {
    setSelectedCourse(course);
    setIsViewModalOpen(true);
    setIsLoadingContents(true);
    setCourseContents([]);
    try {
      const res = await callMoodleAdmin("core_course_get_contents", { courseid: course.id });
      if (!res.exception && Array.isArray(res)) {
         setCourseContents(res);
         
         // Auto-expand first section that contains items
         const firstContentSection = res.find((s: any) => s.modules && s.modules.length > 0);
         if (firstContentSection) {
             setExpandedSections({ [firstContentSection.id]: true });
         } else if (res.length > 0) {
             setExpandedSections({ [res[0].id]: true });
         }
      }
    } catch {
       // Silent error, empty contents
    } finally {
      setIsLoadingContents(false);
    }
  };

  const toggleSection = (sectionId: string) => {
      setExpandedSections(prev => ({
          ...prev,
          [sectionId]: !prev[sectionId]
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullname || !formData.shortname) {
      alert("Name and Short name are required.");
      return;
    }

    startTransition(async () => {
      try {
        if (selectedCourse) {
          // EDIT course
          const res = await callMoodleAdmin("local_skillsaint_update_course", {
            "courses[0][id]": selectedCourse.id,
            "courses[0][fullname]": formData.fullname,
            "courses[0][shortname]": formData.shortname,
            "courses[0][summary]": formData.summary,
            "courses[0][visible]": formData.visible,
            "courses[0][numsections]": formData.numsections,
            "courses[0][startdate]": formData.startdate ? Math.floor(new Date(formData.startdate).getTime() / 1000) : 0,
            "courses[0][enddate]": formData.enddate ? Math.floor(new Date(formData.enddate).getTime() / 1000) : 0,
            "courses[0][categoryid]": formData.categoryid,
          });

          if (res?.exception) {
            setActionMsg(`Error: ${res.message}`);
          } else {
            setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { 
              ...c, 
              fullname: formData.fullname, 
              shortname: formData.shortname, 
              summary: formData.summary,
              visible: formData.visible 
            } : c));
            setActionMsg(`Course "${formData.fullname}" updated!`);
            setIsModalOpen(false);
          }
        } else {
          // ADD course
          const res = await callMoodleAdmin("local_skillsaint_create_course", {
            "courses[0][fullname]": formData.fullname,
            "courses[0][shortname]": formData.shortname,
            "courses[0][summary]": formData.summary,
            "courses[0][visible]": formData.visible,
            "courses[0][numsections]": formData.numsections,
            "courses[0][startdate]": formData.startdate ? Math.floor(new Date(formData.startdate).getTime() / 1000) : 0,
            "courses[0][enddate]": formData.enddate ? Math.floor(new Date(formData.enddate).getTime() / 1000) : Math.floor(new Date(formData.startdate || Date.now()).getTime() / 1000) + 31536000,
            "courses[0][categoryid]": formData.categoryid,
          });

          if (res?.exception) {
            setActionMsg(`Error: ${res.message}`);
          } else if (Array.isArray(res) && res[0]?.id) {
            const newCourse: Course = {
              id: res[0].id,
              fullname: formData.fullname,
              shortname: res[0].shortname,
              summary: formData.summary,
              visible: formData.visible,
              numsections: formData.numsections,
              startdate: Math.floor(Date.now() / 1000),
            };
            setCourses(prev => [newCourse, ...prev]);
            setActionMsg(`Course "${formData.fullname}" created!`);
            setIsModalOpen(false);
          }
        }
      } catch (error) {
         setActionMsg("Network error.");
      }
      setTimeout(() => setActionMsg(null), 4000);
    });
  };

  const handleDelete = (course: Course) => {
    if (!confirm(`Are you sure you want to permanently delete "${course.fullname}"?`)) return;
    startTransition(async () => {
      const res = await callMoodleAdmin("local_skillsaint_delete_course", {
        "courseids[0]": course.id,
      });
      if (res?.warnings && res.warnings.length > 0) {
        setActionMsg(`Error: ${res.warnings[0].message}`);
      } else {
        setCourses(prev => prev.filter(c => c.id !== course.id));
        setActionMsg(`Course deleted.`);
        setIsViewModalOpen(false);
      }
      setTimeout(() => setActionMsg(null), 4000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {actionMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
              {actionMsg}
            </div>
          )}

          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
              <p className="text-gray-500 mt-1">{courses.length} course{courses.length !== 1 ? "s" : ""} active.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> Add New Course
            </button>
          </header>

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
                <h3 className="text-2xl font-bold text-gray-900">{courses.filter(c => c.visible).length}</h3>
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No courses found. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenView(course)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 truncate hover:text-purple-600 transition-colors">{course.fullname}</h3>
                        <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${course.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {course.visible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      {course.shortname && <p className="text-xs text-gray-400 mb-2">Short name: <strong>{course.shortname}</strong></p>}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                        <span>ID: <strong className="text-gray-700">{course.id}</strong></span>
                        {course.numsections != null && <span>Sections: <strong className="text-gray-700">{course.numsections}</strong></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleOpenView(course)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenEdit(course)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Edit course">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-purple-600" />
                 {selectedCourse ? "Edit Course Advanced Data" : "Create Ultra-Precise Course"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 
                 {/* Left Column: Essential Info */}
                 <div className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-2">General Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Course Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fullname}
                        onChange={e => setFormData({ ...formData, fullname: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all font-medium text-gray-900"
                        placeholder="e.g. Masterclass AI & Machine Learning"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Short Name *</label>
                         <input
                           type="text"
                           required
                           value={formData.shortname}
                           onChange={e => setFormData({ ...formData, shortname: e.target.value })}
                           className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-gray-900 font-mono"
                           placeholder="e.g. AIML25"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
                         <input
                           type="number"
                           min="1"
                           value={formData.categoryid}
                           onChange={e => setFormData({ ...formData, categoryid: parseInt(e.target.value) || 1 })}
                           className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                         />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                         <input
                           type="date"
                           value={formData.startdate}
                           onChange={e => setFormData({ ...formData, startdate: e.target.value })}
                           className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-gray-600"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                         <input
                           type="date"
                           value={formData.enddate}
                           onChange={e => setFormData({ ...formData, enddate: e.target.value })}
                           className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all text-gray-600"
                         />
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Settings & Content */}
                 <div className="space-y-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-2">Layout & Content</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Summary</label>
                      <textarea
                        rows={6}
                        value={formData.summary}
                        onChange={e => setFormData({ ...formData, summary: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all resize-none"
                        placeholder="Comprehensive description of what the student will learn..."
                      />
                    </div>
                    
                    <div className="pt-2">
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" className="sr-only peer" checked={formData.visible === 1} onChange={e => setFormData({ ...formData, visible: e.target.checked ? 1 : 0 })} />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                         <span className="ml-3 text-sm font-medium text-gray-700">Course Visible to Students</span>
                       </label>
                    </div>
                 </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3 flex-wrap bg-gray-50/50 -mx-6 -mb-6 p-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-xl transition-all shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                  {isPending ? "Saving..." : selectedCourse ? "Save Course Settings" : "Create Precision Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL - 2 COLUMN LAYOUT */}
      {isViewModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white max-w-6xl w-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative border border-gray-100">
             
             {/* Header */}
             <div className="flex justify-between items-start p-8 border-b border-gray-100 shrink-0 bg-white">
                <div className="flex gap-6 items-start">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                     <BookOpen className="w-8 h-8" />
                   </div>
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                       <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedCourse.fullname}</h2>
                       <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${selectedCourse.visible ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                         {selectedCourse.visible ? "Active" : "Archived"}
                       </span>
                     </div>
                     <p className="text-sm text-gray-500 font-medium">
                       {selectedCourse.shortname} • {selectedCourse.categoryid ? `Category ${selectedCourse.categoryid}` : 'General'} • Created {new Date(selectedCourse.startdate * 1000).toLocaleDateString()}
                     </p>
                   </div>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             {/* Main Content Area */}
             <div className="flex-1 overflow-y-auto w-full p-8 bg-gray-50/50">
                <div className="flex flex-col lg:flex-row gap-10">
                   
                   {/* Left Column: Description */}
                   <div className="w-full lg:w-4/12 flex flex-col">
                      <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                         <FileText className="w-5 h-5 text-gray-400" />
                         About this course
                      </h3>
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                         {selectedCourse.summary ? (
                            <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedCourse.summary }} />
                         ) : (
                            <p className="text-sm text-gray-400 italic">No description provided.</p>
                         )}
                      </div>
                   </div>

                   {/* Right Column: Curriculum */}
                   <div className="w-full lg:w-8/12 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                            Curriculum Structure
                         </h3>
                         <span className="text-xs font-semibold text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                            {selectedCourse.numsections} Sections
                         </span>
                      </div>

                      <div className="w-full flex-1">
                         {isLoadingContents ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 animate-pulse bg-white rounded-2xl border border-gray-100">
                               <BookOpen className="w-10 h-10 mb-4 opacity-20" />
                               <p className="font-medium text-sm">Loading course materials...</p>
                            </div>
                         ) : courseContents.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                               <FileText className="w-10 h-10 mb-4 opacity-20" />
                               <p className="font-medium text-sm">No structured data found.</p>
                            </div>
                         ) : (
                            <div className="space-y-4">
                               {courseContents.map(section => {
                                  const modules = section.modules || [];
                                  if (section.name === "General" && modules.length === 0) return null;
                                  const isExpanded = expandedSections[section.id];
                                  
                                  return (
                                     <div key={section.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-200 group">
                                        <button 
                                           onClick={() => toggleSection(section.id)}
                                           className={`w-full flex items-center justify-between p-5 transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}
                                        >
                                           <div className="flex items-center gap-4">
                                              <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                 {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                              </div>
                                              <span className={`font-bold text-lg block text-left ${isExpanded ? 'text-indigo-900' : 'text-gray-800'}`}>{section.name}</span>
                                           </div>
                                           <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-md">{modules.length} items</span>
                                        </button>
                                        
                                        {isExpanded && (
                                           <div className="px-5 pb-5">
                                              {section.summary && (
                                                <div className="text-sm text-gray-600 mb-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100" 
                                                   dangerouslySetInnerHTML={{ __html: section.summary }} />
                                              )}
                                              
                                              <div className="space-y-3">
                                                 {modules.length === 0 ? (
                                                   <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">This section is empty.</p>
                                                 ) : modules.map((mod: any) => (
                                                    <div key={mod.id} className="flex flex-col p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                                       <div className="flex items-start gap-4">
                                                          <div className={`p-2.5 rounded-xl shrink-0 ${
                                                             mod.modname === 'quiz' ? 'text-fuchsia-600 bg-fuchsia-100' : 
                                                             mod.modname === 'video' ? 'text-red-600 bg-red-100' : 
                                                             mod.modname === 'url' ? 'text-cyan-600 bg-cyan-100' : 
                                                             mod.modname === 'page' ? 'text-blue-600 bg-blue-100' :
                                                             mod.modname === 'forum' ? 'text-emerald-600 bg-emerald-100' :
                                                             'text-orange-600 bg-orange-100'
                                                          } shadow-sm border border-white`}>
                                                              {mod.modname === 'quiz' ? <HelpCircle className="w-5 h-5" /> : 
                                                               mod.modname === 'video' ? <Play className="w-5 h-5" /> : 
                                                               mod.modname === 'url' ? <LinkIcon className="w-5 h-5" /> : 
                                                               <FileText className="w-5 h-5" />}
                                                          </div>
                                                          <div className="flex-1 min-w-0 pt-0.5">
                                                            <div className="flex items-center justify-between mb-1">
                                                              <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-bold text-gray-900">{mod.name}</h4>
                                                                <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider bg-white border border-gray-200 px-1.5 py-0.5 rounded">{mod.modname}</span>
                                                              </div>
                                                            </div>
                                                            
                                                            {/* Direct Inline Reading */}
                                                            {mod.description && (
                                                               <div className="text-sm text-gray-600 prose prose-sm max-w-none mt-2 opacity-90" dangerouslySetInnerHTML={{ __html: mod.description }} />
                                                            )}
                                                            
                                                            {/* Inline Resource Viewer */}
                                                            {mod.contents && mod.contents.length > 0 && (
                                                               <div className="mt-4 flex flex-col gap-4">
                                                                  {mod.contents.map((file: any, i: number) => {
                                                                     const url = file.fileurl + (file.fileurl.includes('?') ? '&' : '?') + 'token=' + moodleToken;
                                                                     const isHtml = file.mimetype === 'text/html' || file.filename.endsWith('.html');
                                                                     const isImg = file.mimetype?.startsWith('image/');
                                                                     const isVideo = file.mimetype?.startsWith('video/') || file.filename.endsWith('.mp4');
                                                                     const isDoc = file.mimetype === 'application/pdf' || 
                                                                                  file.filename.endsWith('.pdf') || 
                                                                                  file.filename.endsWith('.docx') || 
                                                                                  file.filename.endsWith('.doc') || 
                                                                                  file.filename.endsWith('.xlsx');
                                                                     
                                                                     if (isHtml) return (
                                                                        <div key={i} className="flex flex-col mt-2">
                                                                           <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-t-xl w-fit flex items-center gap-2">
                                                                              <BookOpen className="w-3.5 h-3.5" /> Reading: {file.filename}
                                                                           </div>
                                                                           <iframe src={url} className="w-full h-[60vh] border-2 border-indigo-600 rounded-b-xl rounded-tr-xl bg-white shadow-sm" title={file.filename} />
                                                                        </div>
                                                                     );

                                                                     if (isDoc) {
                                                                        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                                                                        return (
                                                                           <div key={i} className="flex flex-col mt-2">
                                                                              <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-t-xl w-fit flex items-center gap-2">
                                                                                 <FileText className="w-3.5 h-3.5" /> Document: {file.filename}
                                                                              </div>
                                                                              <iframe src={viewerUrl} className="w-full h-[70vh] border-2 border-emerald-600 rounded-b-xl rounded-tr-xl bg-white shadow-sm" title={file.filename} />
                                                                           </div>
                                                                        );
                                                                     }

                                                                     if (isImg) return <img key={i} src={url} alt={file.filename} className="max-w-full rounded-xl shadow-sm border border-gray-200 mt-2" />;
                                                                     if (isVideo) return <video key={i} controls src={url} className="w-full rounded-xl shadow-sm border border-gray-200 mt-2" />;
                                                                     
                                                                     return (
                                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center w-fit gap-3 px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-800 rounded-xl text-xs font-bold group/file transition-all shadow-sm">
                                                                           <div className="p-1.5 bg-gray-100 group-hover/file:bg-indigo-100 rounded-md transition-colors"><FileText className="w-4 h-4 text-indigo-600" /></div>
                                                                           <span className="truncate max-w-[250px]">{file.filename}</span>
                                                                           <span className="text-[10px] text-gray-400 font-normal group-hover/file:text-indigo-600 ml-2">Download ↓</span>
                                                                        </a>
                                                                     );
                                                                  })}
                                                               </div>
                                                            )}
                                                          </div>
                                                       </div>
                                                    </div>
                                                 ))}
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  );
                               })}
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             {/* Footer Actions */}
             <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-white shrink-0">
                <button onClick={() => handleDelete(selectedCourse)} disabled={isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                   Delete Course
                </button>
                <button onClick={() => { setIsViewModalOpen(false); handleOpenEdit(selectedCourse); }} className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-md">
                   Edit Course Settings
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
