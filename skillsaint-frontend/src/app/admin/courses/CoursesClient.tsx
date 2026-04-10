"use client";

import { useState, useTransition, useRef} from "react";

import { BookOpen, Users, Eye, Plus, X, Pencil, Play, FileText, Bold, Italic, Underline, List, ListOrdered, Link2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

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
  overviewfiles?: { fileurl: string; filename: string }[];
  summaryfiles?: { fileurl: string; filename: string }[];
};

import { CategoryType } from "@/types/CategoryType";

interface MoodleContent {
  fileurl: string;
  filename: string;
  mimetype?: string;
}

interface MoodleModule {
  id: number;
  name: string;
  modname: string;
  description?: string;
  contents?: MoodleContent[];
}

interface MoodleSection {
  id: string;
  name: string;
  summary?: string;
  modules: MoodleModule[];
}

async function callMoodleAdmin(wsfunction: string, params: Record<string, unknown> = {}) {
  const res = await fetch("/api/moodle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: wsfunction, params })
  });
  return res.json();
}

export default function CoursesClient({ initialCourses, initialCategories, moodleToken }: { initialCourses: Course[], initialCategories: CategoryType[], moodleToken: string }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isPending, startTransition] = useTransition();
  const [actionMsg, setActionMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Rich Text Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editingModule, setEditingModule] = useState<MoodleModule | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "content">("settings");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCategoriesListModalOpen, setIsCategoriesListModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContents, setCourseContents] = useState<MoodleSection[]>([]);

  const [isLoadingContents, setIsLoadingContents] = useState(false);
  // Remove unused expandedSections if not controlling visibility in JSX
  
  // Category states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryType[]>(initialCategories);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    idnumber: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    fullname: "",
    shortname: "",
    summary: "",
    categoryid: initialCategories[0]?.slug?.current ? parseInt(initialCategories[0].slug.current) : 1,
    cover_image: "",
    syllabus_pdf: "",
    visible: 1,
  });

  const editorRef = useRef<HTMLDivElement | null>(null);

  const handleOpenAdd = () => {
    if (categories.length === 0) {
      alert("You must create at least one category before designing a course.");
      setIsCategoryModalOpen(true);
      return;
    }
    setSelectedCourse(null);
    setFormData({ 
      fullname: "", 
      shortname: "", 
      summary: "", 
      categoryid: categories[0]?.slug?.current ? parseInt(categories[0].slug.current) : 0,
      cover_image: "",
      syllabus_pdf: "",
      visible: 1,
    });
    setActiveTab("settings");
    setIsModalOpen(true);
  };

  const handleCreateCategory = () => {
    if (!categoryFormData.name) {
      alert("Category name is required.");
      return;
    }
    startTransition(async () => {
      const res = await callMoodleAdmin("core_course_create_categories", {
        "categories[0][name]": categoryFormData.name,
        "categories[0][parent]": 0,
        "categories[0][idnumber]": categoryFormData.idnumber,
        "categories[0][description]": categoryFormData.description,
      });

      if (res?.exception) {
        setActionMsg({ text: `Error: ${res.message}`, type: 'error' });
      } else if (res?.[0]?.id) {
        const newCat: CategoryType = {
          _id: res[0].id.toString(),
          title: categoryFormData.name,
          description: categoryFormData.description,
          slug: { current: res[0].id.toString() },
          courseCount: 0,
        };
        setCategories(prev => [...prev, newCat]);
        setCategoryFormData({ name: "", idnumber: "", description: "" });
        setIsCategoryModalOpen(false);
        setActionMsg({ text: `Category "${newCat.title}" created successfully!`, type: 'success' });
      }
      setTimeout(() => setActionMsg(null), 4000);
    });
  };

  const handleOpenEdit = async (course: Course) => {
    setIsLoadingContents(true);
    // Re-fetch course to get all details including files if they were missing
    try {
      const fullCourseRes = await callMoodleAdmin("core_course_get_courses_by_field", { field: "id", value: course.id });
      if (fullCourseRes?.courses && fullCourseRes.courses.length > 0) {
        course = fullCourseRes.courses[0];
      }
    } catch (e) {
      console.error("Failed to fetch full course details", e);
    }

    setSelectedCourse(course);
    
    const getAuthenticatedUrl = (file?: { fileurl: string }) => {
      if (!file) return "";
      const url = file.fileurl;
      if (url.startsWith('data:')) return url;
      if (url.includes('token=')) return url;
      return `${url}${url.includes('?') ? '&' : '?'}token=${moodleToken}`;
    };

    const coverUrl = getAuthenticatedUrl(course.overviewfiles?.[0]);
    const syllabusUrl = getAuthenticatedUrl(course.summaryfiles?.[0]);

    setFormData({
      fullname: course.fullname,
      shortname: course.shortname || "",
      summary: course.summary ? course.summary.replace(/<[^>]*>/g, '') : "",
      categoryid: course.categoryid || 1,
      cover_image: coverUrl,
      syllabus_pdf: syllabusUrl,
      visible: course.visible ?? 1,
    });
    setActiveTab("settings");
    setIsModalOpen(true);
    
    setIsLoadingContents(true);
    try {
      const res = await callMoodleAdmin("core_course_get_contents", { courseid: course.id });
      if (!res.exception && Array.isArray(res)) {
         setCourseContents(res);
      }
    } catch {} finally {
      setIsLoadingContents(false);
    }
  };

  const toBase64 = (file: File): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: "cover_image" | "syllabus_pdf") => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        setFormData(prev => ({ ...prev, [field]: base64 }));
      } catch (err) {
        console.error("File to base64 conversion failed", err);
      }
    }
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
      }
    } catch {
       console.error("Failed to load course contents");
    } finally {
      setIsLoadingContents(false);
    }
  };

  // toggleSection removed as unused

  const handleSaveSettings = async () => {
    if (!formData.fullname || !formData.shortname || !formData.categoryid) {
      alert("Course Name, Short Name, and Category are mandatory to proceed.");
      return false;
    }

    try {
      if (selectedCourse) {
        const res = await callMoodleAdmin("local_skillsaint_update_course", {
          "courses[0][id]": selectedCourse.id,
          "courses[0][fullname]": formData.fullname,
          "courses[0][shortname]": formData.shortname,
          "courses[0][summary]": formData.summary,
          "courses[0][categoryid]": formData.categoryid,
          "courses[0][visible]": formData.visible,
          "courses[0][cover_image]": formData.cover_image,
          "courses[0][syllabus_pdf]": formData.syllabus_pdf,
        });

        if (res?.exception || res?.error) {
          setActionMsg({ text: `Error: ${res.message || res.error}`, type: 'error' });
          return false;
        } else {
          setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { 
            ...c, 
            fullname: formData.fullname, 
            shortname: formData.shortname, 
            summary: formData.summary,
            categoryid: formData.categoryid,
            visible: formData.visible,
            overviewfiles: formData.cover_image 
              ? [{ fileurl: formData.cover_image, filename: 'cover.png' }] 
              : c.overviewfiles,
            summaryfiles: formData.syllabus_pdf
              ? [{ fileurl: formData.syllabus_pdf, filename: 'syllabus.pdf' }]
              : c.summaryfiles
          } : c));
          setActionMsg({ text: `Settings for "${formData.fullname}" updated.`, type: 'success' });
          return true;
        }
      } else {
        const res = await callMoodleAdmin("local_skillsaint_create_course", {
          "courses[0][fullname]": formData.fullname,
          "courses[0][shortname]": formData.shortname,
          "courses[0][summary]": formData.summary,
          "courses[0][categoryid]": formData.categoryid,
          "courses[0][visible]": formData.visible,
          "courses[0][cover_image]": formData.cover_image,
          "courses[0][syllabus_pdf]": formData.syllabus_pdf,
        });

        if (res?.exception || res?.error) {
          setActionMsg({ text: `Error: ${res.message || res.error}`, type: 'error' });
          return false;
        } else if (Array.isArray(res) && res[0]?.id) {
          const newCourse: Course = {
            id: res[0].id,
            fullname: formData.fullname,
            shortname: formData.shortname,
            summary: formData.summary,
            visible: formData.visible,
            numsections: 4,
            startdate: Math.floor(Date.now() / 1000),
            categoryid: formData.categoryid,
            overviewfiles: formData.cover_image ? [{ fileurl: formData.cover_image, filename: 'cover.png' }] : [],
            summaryfiles: formData.syllabus_pdf ? [{ fileurl: formData.syllabus_pdf, filename: 'syllabus.pdf' }] : [],
          };
          setCourses(prev => [newCourse, ...prev]);
          setActionMsg({ text: `Course "${formData.fullname}" created!`, type: 'success' });
          setSelectedCourse(newCourse);
          setActiveTab("content");
          return true;
        }
      }
    } catch {
       setActionMsg({ text: "Connection error.", type: 'error' });
       return false;
    }
    return false;
  };

  const handleTabChange = async (newTab: "settings" | "content") => {
    if (activeTab === "settings" && newTab === "content") {
      const success = await handleSaveSettings();
      if (success) {
        setActiveTab("content");
      }
    } else {
      setActiveTab(newTab);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSaveSettings();
    if (success) {
      if (!selectedCourse) setActiveTab("content");
      else setActionMsg({ text: "All changes saved.", type: 'success' });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleRenameSection = async (sectionId: string, currentName: string) => {
    const newName = prompt("Rename Chapter:", currentName || "New Chapter");
    if (!newName || newName === currentName) return;

    startTransition(async () => {
      try {
        await callMoodleAdmin("local_skillsaint_rename_section", {
          sectionid: parseInt(sectionId),
          name: newName,
        });
        setCourseContents(prev => prev.map(s => s.id === sectionId ? { ...s, name: newName } : s));
        setActionMsg({ text: `Chapter successfully renamed to "${newName}".`, type: 'success' });
      } catch {
        setActionMsg({ text: "Failed to synchronize rename.", type: 'error' });
      }
      setTimeout(() => setActionMsg(null), 3000);
    });
  };

  const handleAddSection = async () => {
    if (!selectedCourse) return;
    startTransition(async () => {
      try {
        const res = await callMoodleAdmin("local_skillsaint_add_section", { courseid: selectedCourse.id });
        if (res?.exception) {
          setActionMsg({ text: `Access Denied: ${res.message}`, type: 'error' });
        } else {
          const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse.id });
          if (Array.isArray(fresh)) {
             setCourseContents(fresh);
             setActionMsg({ text: "Chapter successfully added to curriculum.", type: 'success' });
          }
        }
      } catch {
        setActionMsg({ text: "Connectivity failed.", type: 'error' });
      }
      setTimeout(() => setActionMsg(null), 3000);
    });
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedCourse) return;
    if (!confirm("Are you sure you want to delete this chapter and all its assets?")) return;

    startTransition(async () => {
      try {
        const res = await callMoodleAdmin("local_skillsaint_delete_section", {
          sectionid: parseInt(sectionId)
        });
        if (res?.exception) {
          setActionMsg({ text: `Error: ${res.message}`, type: 'error' });
        } else {
          const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse.id });
          if (Array.isArray(fresh)) setCourseContents(fresh);
          setActionMsg({ text: "Chapter successfully removed.", type: 'success' });
        }
      } catch {
        setActionMsg({ text: "Failed to reach Moodle.", type: 'error' });
      }
      setTimeout(() => setActionMsg(null), 3000);
    });
  };

  const handleAddModule = async (sectionId: string) => {
    if (!selectedCourse) return;
    const assetTitle = prompt("Asset Name (e.g. Introduction Video):");
    if (!assetTitle) return;

    startTransition(async () => {
      try {
        const res = await callMoodleAdmin("local_skillsaint_add_module", {
           courseid: selectedCourse.id,
           sectionid: parseInt(sectionId),
           name: assetTitle,
           content: `<p>New learning content for ${assetTitle}</p>`
        });

        if (res?.exception) {
          setActionMsg({ text: `Direct deployment failed: ${res.message}.`, type: 'error' });
        } else {
          const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse.id });
          if (Array.isArray(fresh)) setCourseContents(fresh);
          setActionMsg({ text: `Asset "${assetTitle}" deployed to curriculum.`, type: 'success' });
        }
      } catch {
        setActionMsg({ text: "Deployment failed.", type: 'error' });
      }
      setTimeout(() => setActionMsg(null), 3000);
    });
  };

  const handleUpdateModuleContent = async (mod: MoodleModule) => {
    if (!selectedCourse) return;
    
    setEditingModule(mod);
    setIsEditorOpen(true);
    setEditorContent("Loading content...");
    
    try {
      const res = await callMoodleAdmin("local_skillsaint_get_module_content", { cmid: mod.id });
      if (res && res.content !== undefined) {
        setEditorContent(res.content || "");
      } else {
        setEditorContent(mod.description || "");
      }
    } catch {
      setEditorContent(mod.description || "");
    }
  };

  const handleSaveEditorContent = async () => {
    if (!editingModule) return;
    startTransition(async () => {
      try {
        const res = await callMoodleAdmin("local_skillsaint_update_module_content", {
           cmid: editingModule.id,
           content: editorContent
        });
        if (res?.exception || res?.error) {
          setActionMsg({ text: `Update failed: ${res.message || res.error}.`, type: 'error' });
        } else {
          setActionMsg({ text: `Content for "${editingModule.name}" updated successfully.`, type: 'success' });
          setIsEditorOpen(false);
          setEditingModule(null);
          const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse!.id });
          if (Array.isArray(fresh)) setCourseContents(fresh);
        }
      } catch {
        setActionMsg({ text: "Failed to update module.", type: 'error' });
      }
      setTimeout(() => setActionMsg(null), 3000);
    });
  };

  const handleDelete = (course: Course) => {
    if (!confirm(`Are you sure you want to permanently delete "${course.fullname}"?`)) return;
    startTransition(async () => {
      const res = await callMoodleAdmin("local_skillsaint_delete_course", {
        "courseids[0]": course.id,
      });
      if ((res?.warnings && res.warnings.length > 0) || res?.error) {
        setActionMsg({ text: `Error: ${res.warnings?.[0]?.message || res.error}`, type: 'error' });
      } else {
        setCourses(prev => prev.filter(c => c.id !== course.id));
        setActionMsg({ text: `Course deleted.`, type: 'success' });
        setIsViewModalOpen(false);
      }
      setTimeout(() => setActionMsg(null), 4000);
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="h-full pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {actionMsg && (
              <div className={`mb-8 border-2 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top duration-300 shadow-lg ${
                actionMsg.type === 'error' 
                  ? "bg-red-50 border-red-100 text-red-600" 
                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
              }`}>
                {actionMsg.text}
              </div>
            )}

            {/* Header Section */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Education Manager</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                  Masterclass <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Library</span>
                </h1>
                <p className="text-gray-400 font-medium max-w-md text-sm">
                  Strategic management of your academic assets and theological categories.
                </p>
              </div>
              
              <div className="flex gap-4 animate-in fade-in duration-1000 delay-300">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="group flex items-center gap-3 bg-white border-2 border-gray-900 text-gray-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-900 hover:text-white transition-all duration-300 shadow-xl shadow-gray-100"
                >
                  <Plus className="w-4 h-4" /> Add Category
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="group flex items-center gap-3 bg-purple-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition-all duration-300 shadow-xl shadow-purple-200 hover:-translate-y-1 active:translate-y-0"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> New Masterclass
                </button>
              </div>
            </header>

            {/* Stats Summary Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 animate-in fade-in duration-1000 slide-in-from-bottom-5">
              <div className="group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-10 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500">
                <div className="w-20 h-20 rounded-[2rem] bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-sm">
                  <BookOpen className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Live Curriculum</p>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{courses.length} <span className="text-sm font-medium text-gray-300 italic">Courses</span></h3>
                </div>
              </div>

              <div className="group bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-10 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden">
                <div className="w-20 h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm">
                  <List className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Domains</p>
                    {categories.length > 3 && (
                      <button 
                        onClick={() => setIsCategoriesListModalOpen(true)}
                        className="text-[9px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full transition-all"
                      >
                        Explore More +
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 3).map((cat) => (
                      <span key={cat._id} className="text-[9px] font-black text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg truncate max-w-[120px]">
                        {cat.title}
                      </span>
                    ))}
                    {categories.length === 0 && <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">No segments configured</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Container */}
            <div className="pb-20">
              {courses.length === 0 ? (
                <div className="bg-white rounded-[4rem] p-24 shadow-sm border border-gray-100 text-center animate-pulse">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                    <BookOpen className="w-12 h-12 text-gray-200" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Curriculum Empty</h2>
                  <p className="text-gray-400 font-medium">Your global learning segments will appear here once initialized.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {courses.map(course => (
                    <div 
                      key={course.id} 
                      className="group relative bg-white rounded-[3rem] p-8 shadow-sm border border-gray-50 hover:border-purple-100 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-2 flex flex-col overflow-hidden animate-in fade-in duration-700 slide-in-from-bottom-5"
                    >
                      {/* Visual Accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-bl-[5rem] group-hover:scale-150 transition-transform duration-700" />
                      
                      {/* Course Header/Icon */}
                      <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-white to-gray-50 shadow-inner flex items-center justify-center text-purple-600 group-hover:rotate-6 transition-transform duration-500 overflow-hidden border border-gray-50">
                          {course.overviewfiles && course.overviewfiles.length > 0 ? (
                            <Image 
                              src={course.overviewfiles[0].fileurl.startsWith('data:') 
                                ? course.overviewfiles[0].fileurl 
                                : `${course.overviewfiles[0].fileurl}${course.overviewfiles[0].fileurl.includes('?') ? '&' : '?'}token=${moodleToken}`} 
                              alt={course.fullname} 
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized={course.overviewfiles[0].fileurl.startsWith('data:')}
                            />
                          ) : (
                            <BookOpen className="w-8 h-8" />
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${course.visible ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {course.visible ? "Visible" : "Hidden"}
                        </span>
                      </div>

                      {/* Course Content */}
                      <div className="flex-1 mb-6 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-widest border border-purple-100">
                            {categories.find(c => parseInt(c.slug.current) === course.categoryid)?.title || "General"}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors mb-4 min-h-[3rem] tracking-tight">
                          {course.fullname}
                        </h3>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-400 font-medium line-clamp-3 leading-relaxed">
                            {course.summary.replace(/<[^>]*>/g, '') || "Strategic theological curriculum designed for advanced leadership."}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                             <div className="w-6 h-px bg-gray-100" />
                             <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] truncate">
                               REF: {course.shortname || `#${course.id}`}
                             </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats/Actions */}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50 relative z-10">
                        <div className="flex -space-x-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-white flex items-center justify-center text-blue-600 shadow-sm">
                             <Users className="w-4 h-4" />
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-gray-50 border-2 border-white flex items-center justify-center text-gray-300 shadow-sm">
                             <Plus className="w-3 h-3" />
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenView(course); }} 
                            className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                            title="Structure Overview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(course); }} 
                            className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-400 hover:bg-purple-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                            title="Core Settings"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-10 relative">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 mx-auto mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Category</h2>
              <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest">Masterclass Classification</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category Name *</label>
                <input 
                  type="text" 
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  placeholder="e.g. Advanced Theology"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 text-gray-900 transition-all font-bold placeholder:font-normal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ID Number (Optional)</label>
                <input 
                  type="text" 
                  value={categoryFormData.idnumber}
                  onChange={e => setCategoryFormData({...categoryFormData, idnumber: e.target.value})}
                  placeholder="e.g. THEO-01"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 text-gray-900 transition-all font-bold placeholder:font-normal"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brief Description</label>
                <textarea 
                  value={categoryFormData.description}
                  onChange={e => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="What is this category about?"
                  rows={3}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 text-gray-900 transition-all font-bold placeholder:font-normal resize-none"
                />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-2xl bg-gray-50 text-gray-500 font-black tracking-widest uppercase text-[10px] hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCategory}
                disabled={isPending}
                className="flex-[2] px-4 py-4 rounded-2xl bg-purple-600 text-white font-black tracking-widest uppercase text-[10px] shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 my-8 border border-gray-100">
            <div className="flex flex-col border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      {selectedCourse ? "Course Designer" : "Create New Masterclass"}
                    </h2>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex px-8 gap-8">
                <button 
                  type="button"
                  onClick={() => handleTabChange("settings")}
                  className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === "settings" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  General Settings
                </button>
                <button 
                  type="button"
                  onClick={() => handleTabChange("content")}
                  className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === "content" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  Course Content
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-8 max-h-[60vh] overflow-y-auto bg-gray-50/30">
                {activeTab === "settings" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Course Identity</label>
                        <input
                          type="text"
                          required
                          value={formData.fullname}
                          onChange={e => setFormData({ ...formData, fullname: e.target.value })}
                          className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-400 transition-all font-bold text-gray-900 shadow-sm"
                          placeholder="e.g. Advanced Theology"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Unique Code</label>
                           <input
                             type="text"
                             required
                             value={formData.shortname}
                             onChange={e => setFormData({ ...formData, shortname: e.target.value })}
                             className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-400 transition-all text-gray-900 font-mono font-bold shadow-sm"
                             placeholder="ATH-2025"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Moodle Category</label>
                           <select
                             id="categoryid"
                             value={formData.categoryid}
                             onChange={(e) => setFormData({ ...formData, categoryid: parseInt(e.target.value) })}
                             className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900 transition-all font-bold"
                             required
                           >
                             {categories.length === 0 && <option value="">No categories available - create one first</option>}
                             {categories.map((cat) => (
                               <option key={cat._id} value={parseInt(cat.slug.current)}>
                                 {cat.title}
                               </option>
                             ))}
                           </select>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Premium Course Summary</label>
                        <textarea
                          rows={4}
                          value={formData.summary}
                          onChange={e => setFormData({ ...formData, summary: e.target.value })}
                          className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-400 transition-all resize-none font-medium text-gray-700 leading-relaxed shadow-sm mb-6"
                          placeholder="Craft a compelling narrative..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cover Image</label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-3xl cursor-pointer bg-white hover:bg-gray-50 transition-all group overflow-hidden">
                              {formData.cover_image ? (
                                <Image src={formData.cover_image} alt="Preview" width={128} height={128} className="w-full h-full object-cover" unoptimized />
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 text-gray-300 mb-2 group-hover:text-purple-400 transition-colors" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Upload Cover</p>
                                </div>
                              )}
                              <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, "cover_image")} />
                          </label>
                          {formData.cover_image && (
                            <button type="button" onClick={() => setFormData({...formData, cover_image: ""})} className="text-[10px] text-red-400 font-bold hover:text-red-600 ml-1">Remove Image</button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Syllabus (PDF)</label>
                            {formData.syllabus_pdf && (
                              <a 
                                href={formData.syllabus_pdf} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-purple-600 font-bold hover:underline uppercase tracking-wide"
                              >
                                View Current
                              </a>
                            )}
                          </div>
                          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all group ${formData.syllabus_pdf ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <FileText className={`w-8 h-8 mb-2 transition-colors ${formData.syllabus_pdf ? 'text-blue-500' : 'text-gray-300 group-hover:text-blue-400'}`} />
                                  <p className={`text-[10px] font-bold uppercase tracking-widest ${formData.syllabus_pdf ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {formData.syllabus_pdf ? "Replace Syllabus" : "Upload Syllabus"}
                                  </p>
                              </div>
                              <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileChange(e, "syllabus_pdf")} />
                          </label>
                          {formData.syllabus_pdf && (
                            <button type="button" onClick={() => setFormData({...formData, syllabus_pdf: ""})} className="text-[10px] text-red-400 font-bold hover:text-red-600 ml-1">Detach Document</button>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Visibility</label>
                            <p className="text-[10px] text-gray-500 font-medium">Show course to students</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, visible: prev.visible ? 0 : 1 }))}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.visible ? 'bg-emerald-500' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.visible ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {isLoadingContents ? (
                       <div className="py-20 flex flex-col items-center justify-center text-gray-400 animate-pulse bg-white rounded-[2rem] border border-gray-100">
                          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                          <p className="font-bold text-sm tracking-widest uppercase">Fetching Architecture...</p>
                       </div>
                    ) : courseContents.length === 0 ? (
                       <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                          <p className="font-black text-gray-900 text-xl mb-2">Architectural Blueprint Needed.</p>
                          {selectedCourse && (
                            <button onClick={handleAddSection} type="button" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all">
                               Initialize Curriculum
                            </button>
                          )}
                       </div>
                    ) : (
                       <div className="grid grid-cols-1 gap-6">
                          {courseContents.map((section, index) => (
                            <div key={section.id} className="space-y-4">
                               <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all">
                                  <div className="flex items-center gap-5">
                                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Play className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{section.name || `Section ${index}`}</h4>
                                     </div>
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => selectedCourse && handleAddModule(section.id)} type="button" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title="Add Asset">
                                        <Plus className="w-5 h-5" />
                                     </button>
                                     <button onClick={() => handleRenameSection(section.id, section.name)} type="button" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Rename Chapter">
                                        <Pencil className="w-4 h-4" />
                                     </button>
                                     <button onClick={() => handleDeleteSection(section.id)} type="button" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Remove Chapter">
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                               </div>
                               <div className="pl-12 space-y-3">
                                  {section.modules?.map(mod => (
                                    <div key={mod.id} className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex items-center justify-between group/mod hover:bg-white transition-all">
                                      <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-400">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-gray-800">{mod.name}</p>
                                        </div>
                                      </div>
                                      <button type="button" onClick={() => handleUpdateModuleContent(mod)} className="p-2 text-gray-400 hover:text-purple-600 transition-all">
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          ))}
                          <button onClick={handleAddSection} type="button" className="w-full py-8 rounded-[3rem] border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50/30 flex items-center justify-center gap-3 transition-all group mt-6">
                             <Plus className="w-5 h-5" />
                             <span className="uppercase tracking-[0.2em] text-xs">Add Core Chapter</span>
                          </button>
                       </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center">
                <button type="submit" disabled={isPending} className="px-10 py-4 text-sm font-black text-white bg-gray-900 hover:bg-black rounded-2xl transition-all shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center gap-3 active:scale-95 uppercase tracking-widest">
                  {isPending ? "Syncing..." : selectedCourse ? "Update Course" : "Deploy Masterclass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white max-w-6xl w-full max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative border border-gray-100">
             <div className="flex justify-between items-start p-8 border-b border-gray-100 shrink-0 bg-white">
                <h2 className="text-2xl font-black text-gray-900">{selectedCourse.fullname}</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto w-full p-8 bg-gray-50/50">
                {courseContents.map(section => (
                   <div key={section.id} className="mb-6 bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="font-bold text-lg mb-4">{section.name}</h3>
                      {section.modules?.map(mod => (
                        <div key={mod.id} className="p-4 bg-gray-50 rounded-xl mb-2">{mod.name}</div>
                      ))}
                   </div>
                ))}
             </div>
             <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-white shrink-0">
                <button onClick={() => handleDelete(selectedCourse)} className="text-red-500 hover:text-red-700 px-4 py-2 rounded-xl text-sm font-bold">Delete Course</button>
                <button onClick={() => { setIsViewModalOpen(false); handleOpenEdit(selectedCourse); }} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold">Edit Course</button>
             </div>
          </div>
        </div>
      )}

      {isEditorOpen && editingModule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Editing &quot;{editingModule.name}&quot;</h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-2 rounded-full bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-gray-50 p-6 flex flex-col">
              <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 flex-wrap">
                  <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bold"><Bold className="w-4 h-4" /></button>
                  <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Italic"><Italic className="w-4 h-4" /></button>
                  <button onClick={() => document.execCommand('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Underline"><Underline className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 mx-1"></div>
                  <button onClick={() => document.execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bullet List"><List className="w-4 h-4" /></button>
                  <button onClick={() => document.execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 mx-1"></div>
                  <button onClick={() => {
                    const url = prompt('Enter link URL:');
                    if (url) document.execCommand('createLink', false, url);
                  }} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Add Link"><Link2 className="w-4 h-4" /></button>
                  <button onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) document.execCommand('insertImage', false, url);
                  }} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Add Image"><ImageIcon className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 mx-1"></div>
                  <button onClick={() => document.execCommand('formatBlock', false, 'H1')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm" title="Heading 1">H1</button>
                  <button onClick={() => document.execCommand('formatBlock', false, 'H2')} className="p-2 hover:bg-gray-200 rounded text-gray-700 font-bold text-sm" title="Heading 2">H2</button>
                </div>
                <div 
                  className="flex-1 p-4 overflow-y-auto max-w-none focus:outline-none min-h-[300px]"
                  contentEditable
                  onInput={(e) => setEditorContent(e.currentTarget.innerHTML)}
                  ref={(node) => {
                    if (node) {
                      editorRef.current = node;
                      // Only update innerHTML if it's different and we are NOT currently focused
                      if (node.innerHTML !== editorContent && document.activeElement !== node) {
                        node.innerHTML = editorContent;
                      }
                    } else {
                      editorRef.current = null;
                    }
                  }}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEditorContent} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md">Save Content</button>
            </div>
          </div>
        </div>
      )}
      {isCategoriesListModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 p-10 relative flex flex-col max-h-[80vh]">
            <button onClick={() => setIsCategoriesListModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="mb-8 text-center shrink-0">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-4">
                <List className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Mastery Domains</h2>
              <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest">{categories.length} Registered Categories</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {categories.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 rounded-2xl border border-gray-100 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                         <span className="text-[10px] font-black uppercase tracking-tighter">
                            {cat.title.substring(0,2)}
                         </span>
                      </div>
                      <div>
                         <p className="font-black text-gray-900 text-sm tracking-tight">{cat.title}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                           ID: {cat.slug.current} • {courses.filter(c => c.categoryid === parseInt(cat.slug.current)).length} Courses
                         </p>
                      </div>
                   </div>
                   <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>

            <div className="mt-8 shrink-0">
               <button 
                 onClick={() => {
                   setIsCategoriesListModalOpen(false);
                   setIsCategoryModalOpen(true);
                 }}
                 className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 <Plus className="w-4 h-4" /> Add New Domain
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
