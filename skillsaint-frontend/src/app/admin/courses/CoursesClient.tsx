/* eslint-disable */

"use client";

import { useState, useTransition, useRef} from "react";
import toast from "react-hot-toast";

import { BookOpen, Users, Eye, Plus, X, Pencil, Play, FileText, Bold, Italic, Underline, List, ListOrdered, Link2, Image as ImageIcon, CheckCircle, FileQuestion, GripVertical, Trash, Loader2, ChevronUp, ChevronDown, Video, Upload, Clock } from "lucide-react";
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
  courseimage?: string;
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
  instance?: number; // L'ID réel de l'activité (ex: Quiz ID)
  url?: string;
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

interface CoursesClientProps {
  initialCourses: Course[];
  initialCategories: CategoryType[];
  moodleToken: string;
  moodleUrl: string;
}

export default function CoursesClient({ initialCourses, initialCategories, moodleToken, moodleUrl }: CoursesClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isPending, startTransition] = useTransition();

  // Rich Text Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editingModule, setEditingModule] = useState<MoodleModule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "content">("settings");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCategoriesListModalOpen, setIsCategoriesListModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContents, setCourseContents] = useState<MoodleSection[]>([]);

  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Record<number, any[]>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<number | null>(null);

  // Add Module Modal
  const [addModuleModal, setAddModuleModal] = useState<{
    isOpen: boolean;
    sectionId: string;
    type: 'page' | 'quiz' | 'video' | 'pdf' | null;
    name: string;
    videoUrl: string;
    pdfBase64: string | null;
    pdfName: string;
    timelimit: number;
    isCreating: boolean;
  }>({
    isOpen: false,
    sectionId: '',
    type: null,
    name: '',
    videoUrl: '',
    pdfBase64: null,
    pdfName: '',
    timelimit: 0,
    isCreating: false,
  });
  
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
      toast.error("You must create at least one category before designing a course.");
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
      toast.error("Category name is required.");
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
        toast.error(`Error: ${res.message}`);
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
        toast.success(`Category "${newCat.title}" created successfully!`);
      }
    });
  };

  // Helper to format Moodle URLs for Web Service access
  const formatMoodleImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith('data:')) return url;
    
    let finalUrl = url;
    // 1. Ensure absolute URL
    if (finalUrl.startsWith('/')) {
      const base = moodleUrl.endsWith('/') ? moodleUrl.slice(0, -1) : moodleUrl;
      finalUrl = `${base}${finalUrl}`;
    }
    
    // 2. Switch to webservice endpoint if it's a pluginfile
    if (finalUrl.includes('pluginfile.php') && !finalUrl.includes('webservice/pluginfile.php')) {
      finalUrl = finalUrl.replace('pluginfile.php', 'webservice/pluginfile.php');
    }
    
    // 3. Append token
    if (!finalUrl.includes('token=')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}token=${moodleToken}&forcedownload=0`;
    } else if (!finalUrl.includes('forcedownload=')) {
      finalUrl = `${finalUrl}&forcedownload=0`;
    }
    
    return finalUrl;
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
    
    const coverUrl = course.overviewfiles?.[0] 
      ? formatMoodleImageUrl(course.overviewfiles[0].fileurl) 
      : formatMoodleImageUrl(course.courseimage);
    
    const syllabusUrl = formatMoodleImageUrl(course.summaryfiles?.[0]?.fileurl);

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
      toast.error("Course Name, Short Name, and Category are mandatory.");
      return false;
    }

    setIsSaving(true);
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
          toast.error(`Error: ${res.message || res.error}`);
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
          toast.success(`Settings for "${formData.fullname}" updated.`);
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
          toast.error(`Error: ${res.message || res.error}`);
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
          toast.success(`Course "${formData.fullname}" created!`);
          setSelectedCourse(newCourse);
          setActiveTab("content");
          return true;
        }
      }
    } finally {
       setIsSaving(false);
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
    if (activeTab === "content") {
       setIsModalOpen(false);
       return;
    }
    const success = await handleSaveSettings();
    if (success) {
      if (!selectedCourse) {
        // Transition to content for new builds
        setActiveTab("content");
      } else {
        // Close if it was just a settings update
        setIsModalOpen(false);
        toast.success(`Finalized: "${formData.fullname}" is up to date.`);
      }
    }
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
        toast.success(`Chapter successfully renamed to "${newName}".`);
      } catch {
        toast.error("Failed to synchronize rename.");
      }
    });
  };

  const handleAddSection = async () => {
    if (!selectedCourse) return;
    startTransition(async () => {
      try {
        const res = await callMoodleAdmin("local_skillsaint_add_section", { courseid: selectedCourse.id });
        if (res?.exception) {
          toast.error(`Access Denied: ${res.message}`);
        } else {
          const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse.id });
          if (Array.isArray(fresh)) {
             setCourseContents(fresh);
             toast.success("Chapter successfully added to curriculum.");
          }
        }
      } catch {
        toast.error("Connectivity failed.");
      }
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
          toast.error(`Error: ${res.message}`);
        } else {
          const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse.id });
          if (Array.isArray(fresh)) setCourseContents(fresh);
          toast.success("Chapter successfully removed.");
        }
      } catch {
        toast.error("Failed to reach Moodle.");
      }
    });
  };

  const openAddModuleModal = (sectionId: string) => {
    setAddModuleModal({
      isOpen: true,
      sectionId,
      type: null,
      name: '',
      videoUrl: '',
      pdfBase64: null,
      pdfName: '',
      timelimit: 0,
      isCreating: false,
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    setAddModuleModal(prev => ({ ...prev, pdfBase64: base64, pdfName: file.name }));
  };

  const handleCreateModule = async () => {
    if (!selectedCourse || !addModuleModal.type || !addModuleModal.name.trim()) {
      toast.error("Please select a type and enter a name.");
      return;
    }

    setAddModuleModal(prev => ({ ...prev, isCreating: true }));

    try {
      let res;
      const { type, name, sectionId, videoUrl, pdfBase64, timelimit } = addModuleModal;

      if (type === 'quiz') {
        res = await callMoodleAdmin("local_skillsaint_init_exam", {
          courseid: selectedCourse.id,
          name: name.trim(),
          sectionid: parseInt(sectionId),
          timelimit: timelimit * 60 // Convert minutes to seconds for Moodle
        });
      } else if (type === 'video') {
        // Convert YouTube/Vimeo URL to embed
        let embedHtml = '';
        const url = videoUrl.trim();
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (ytMatch) {
          embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`;
        } else if (vimeoMatch) {
          embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`;
        } else if (url) {
          embedHtml = `<video controls width="100%" style="border-radius:12px;"><source src="${url}" type="video/mp4">Your browser does not support video.</video>`;
        }
        res = await callMoodleAdmin("local_skillsaint_add_module", {
          courseid: selectedCourse.id,
          sectionid: parseInt(sectionId),
          name: name.trim(),
          content: embedHtml || `<p>Video: ${name.trim()}</p>`
        });
      } else if (type === 'pdf' && pdfBase64) {
        const embedHtml = `<embed src="${pdfBase64}" type="application/pdf" width="100%" height="800px" style="border-radius:12px;border:1px solid #e5e7eb;" />`;
        res = await callMoodleAdmin("local_skillsaint_add_module", {
          courseid: selectedCourse.id,
          sectionid: parseInt(sectionId),
          name: name.trim(),
          content: embedHtml
        });
      } else {
        // Default: Page
        res = await callMoodleAdmin("local_skillsaint_add_module", {
          courseid: selectedCourse.id,
          sectionid: parseInt(sectionId),
          name: name.trim(),
          content: `<p>New learning content for ${name.trim()}</p>`
        });
      }

      if (res?.exception) {
        toast.error(`Deployment failed: ${res.message}.`);
      } else {
        const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse.id });
        if (Array.isArray(fresh)) setCourseContents(fresh);
        const typeLabel = type === 'quiz' ? 'Assessment' : type === 'video' ? 'Video' : type === 'pdf' ? 'Document' : 'Page';
        toast.success(`${typeLabel} "${name.trim()}" deployed successfully.`);
        setAddModuleModal(prev => ({ ...prev, isOpen: false }));
      }
    } catch {
      toast.error("Deployment failed.");
    } finally {
      setAddModuleModal(prev => ({ ...prev, isCreating: false }));
    }
  };

  const fetchQuizQuestions = async (quizId: number) => {
    setIsLoadingQuestions(quizId);
    try {
      const res = await callMoodleAdmin("local_skillsaint_get_quiz_questions", { quizid: quizId });
      if (Array.isArray(res)) {
        setQuizQuestions(prev => ({ ...prev, [quizId]: res }));
      }
    } catch {
      toast.error("Failed to load questions.");
    } finally {
      setIsLoadingQuestions(null);
    }
  };

  const toggleQuizEditor = (quizId: number) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
    } else {
      setExpandedQuizId(quizId);
      if (!quizQuestions[quizId]) {
        fetchQuizQuestions(quizId);
      }
    }
  };

  const handleQuizAddQuestion = async (quizId: number) => {
    if (!selectedCourse) return;
    
    startTransition(async () => {
      try {
        // We create TWO questions as requested
        for (let i = 0; i < 2; i++) {
          await callMoodleAdmin("local_skillsaint_create_question", {
            courseid: selectedCourse.id,
            quizid: quizId,
            name: `Question`,
            text: "Double click to edit question text",
            mark: 1,
            answers: [
              { text: "Option A", fraction: 1.0 },
              { text: "Option B", fraction: 0.0 }
            ]
          });
        }

        toast.success("Double question block added.");
        fetchQuizQuestions(quizId);
      } catch {
        toast.error("Error creating questions.");
      }
    });
  };

  const handleQuizDeleteQuestion = async (quizId: number, questionId: number) => {
    if (!confirm("Remove this question permanently?")) return;

    startTransition(async () => {
      try {
        const res = await callMoodleAdmin("local_skillsaint_delete_question", { 
          quizid: quizId, 
          questionid: questionId 
        });
        if (res?.status === "success" || (res && !res.exception)) {
          setQuizQuestions(prev => ({
            ...prev,
            [quizId]: (prev[quizId] || []).filter(q => q.id !== questionId)
          }));
          toast.success("Question removed.");
        }
      } catch {
        toast.error("Failed to delete question.");
      }
    });
  };

  const handleQuizUpdateQuestion = async (quizId: number, question: any) => {
    setIsSaving(true);
    try {
      const res = await callMoodleAdmin("local_skillsaint_update_question", {
        questionid: question.id,
        name: question.name || "Question",
        text: question.questiontext,
        answers: question.answers
      });
      if (res?.status === "success" || (res && !res.exception)) {
        toast.success("Changes synced.");
      } else {
        toast.error("Sync failed.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuizReorder = async (quizId: number, newQuestions: any[]) => {
    const questionIds = newQuestions.map(q => q.id);
    setQuizQuestions(prev => ({ ...prev, [quizId]: newQuestions }));
    
    try {
      await callMoodleAdmin("local_skillsaint_reorder_questions", {
        quizid: quizId,
        questionids: questionIds
      });
      toast.success("Order updated.");
    } catch {
      toast.error("Failed to sync order.");
    }
  };

  const handleQuizAddOption = (quizId: number, questionIdx: number) => {
    const updatedQuestions = [...(quizQuestions[quizId] || [])];
    const question = updatedQuestions[questionIdx];
    const newChar = String.fromCharCode(65 + question.answers.length); // Next letter
    question.answers.push({ text: `Option ${newChar}`, fraction: 0.0 });
    
    setQuizQuestions(prev => ({ ...prev, [quizId]: updatedQuestions }));
    handleQuizUpdateQuestion(quizId, question);
  };

  const handleQuizRemoveOption = (quizId: number, questionIdx: number, answerIdx: number) => {
    const updatedQuestions = [...(quizQuestions[quizId] || [])];
    const question = updatedQuestions[questionIdx];
    
    if (question.answers.length <= 2) {
      toast.error("Minimum 2 options required.");
      return;
    }

    question.answers.splice(answerIdx, 1);
    setQuizQuestions(prev => ({ ...prev, [quizId]: updatedQuestions }));
    handleQuizUpdateQuestion(quizId, question);
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
    setIsSaving(true);
    try {
      const res = await callMoodleAdmin("local_skillsaint_update_module_content", {
          cmid: editingModule.id,
          content: editorContent
      });
      if (res?.exception || res?.error) {
        toast.error(`Update failed: ${res.message || res.error}.`);
      } else {
        toast.success(`Content for "${editingModule.name}" updated successfully.`);
        setIsEditorOpen(false);
        setEditingModule(null);
        const fresh = await callMoodleAdmin("core_course_get_contents", { courseid: selectedCourse!.id });
        if (Array.isArray(fresh)) setCourseContents(fresh);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (course: Course) => {
    if (!confirm(`Are you sure you want to permanently delete "${course.fullname}"?`)) return;
    startTransition(async () => {
      const res = await callMoodleAdmin("local_skillsaint_delete_course", {
        "courseids[0]": course.id,
      });
      if ((res?.warnings && res.warnings.length > 0) || res?.error) {
        toast.error(`Error: ${res.warnings?.[0]?.message || res.error}`);
      } else {
        setCourses(prev => prev.filter(c => c.id !== course.id));
        toast.success(`Course deleted.`);
        setIsViewModalOpen(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120] flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="h-full pt-24 md:pt-0 p-6 md:p-10 lg:p-12 bg-[#f0f2f5] dark:bg-[#0b1120]">
          <div className="max-w-7xl mx-auto">

            {/* Header Section */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Education Manager</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">
                  Masterclass <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Library</span>
                </h1>
                <p className="text-gray-400 font-medium max-w-md text-sm">
                  Strategic management of your academic assets and theological categories.
                </p>
              </div>
              
              <div className="flex gap-4 animate-in fade-in duration-1000 delay-300">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="group flex items-center gap-3 bg-white dark:bg-slate-800 border-2 border-gray-900 dark:border-slate-700 text-gray-900 dark:text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-900 dark:hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-xl shadow-gray-100 dark:shadow-none"
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
              <div className="group bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-10 hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-none transition-all duration-500">
                <div className="w-20 h-20 rounded-[2rem] bg-purple-50 dark:bg-slate-800 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-sm">
                  <BookOpen className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Live Curriculum</p>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{courses.length} <span className="text-sm font-medium text-gray-300 dark:text-slate-600 italic">Courses</span></h3>
                </div>
              </div>

              <div className="group bg-white dark:bg-[#1e293b] p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-10 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-none transition-all duration-500 relative overflow-hidden">
                <div className="w-20 h-20 rounded-[2rem] bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-sm">
                  <List className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Active Domains</p>
                    {categories.length > 3 && (
                      <button 
                        onClick={() => setIsCategoriesListModalOpen(true)}
                        className="text-[9px] font-black text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 uppercase tracking-widest bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full transition-all"
                      >
                        Explore More +
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 3).map((cat) => (
                      <span key={cat._id} className="text-[9px] font-black text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-3 py-1.5 rounded-lg truncate max-w-[120px]">
                        {cat.title}
                      </span>
                    ))}
                    {categories.length === 0 && <span className="text-[9px] text-gray-300 dark:text-slate-600 font-bold uppercase tracking-widest">No segments configured</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Container */}
            <div className="pb-20">
              {courses.length === 0 ? (
                <div className="bg-white dark:bg-[#1e293b] rounded-[4rem] p-24 shadow-sm border border-gray-100 dark:border-slate-800 text-center animate-pulse">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                    <BookOpen className="w-12 h-12 text-gray-200 dark:text-slate-700" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Curriculum Empty</h2>
                  <p className="text-gray-400 dark:text-slate-500 font-medium">Your global learning segments will appear here once initialized.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {courses.map(course => (
                    <div 
                      key={course.id} 
                      className="group relative bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:border-purple-100 dark:hover:border-purple-900 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-1 flex flex-col overflow-hidden animate-in fade-in duration-700 slide-in-from-bottom-5"
                    >
                      {/* Visual Accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-bl-[5rem] group-hover:scale-150 transition-transform duration-700" />
                      
                      {/* Course Header/Icon */}
                      <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 shadow-inner flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:rotate-6 transition-transform duration-500 overflow-hidden border border-gray-50 dark:border-slate-800">
                          {(() => {
                            const hasOverview = course.overviewfiles && course.overviewfiles.length > 0;
                            const imageUrl = hasOverview ? course.overviewfiles![0].fileurl : course.courseimage;
                            
                            if (!imageUrl) return <BookOpen className="w-8 h-8" />;

                            const finalUrl = formatMoodleImageUrl(imageUrl);

                            return (
                              <Image 
                                src={finalUrl} 
                                alt={course.fullname} 
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                unoptimized={true}
                              />
                            );
                          })()}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${course.visible ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500"}`}>
                          {course.visible ? "Visible" : "Hidden"}
                        </span>
                      </div>

                      {/* Course Content */}
                      <div className="flex-1 mb-6 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800">
                            {categories.find(c => parseInt(c.slug.current) === course.categoryid)?.title || "General"}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-4 min-h-[3rem] tracking-tight">
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
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-slate-800 relative z-10">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenView(course); }} 
                            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-900 dark:hover:bg-purple-600 hover:text-white dark:hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                            title="Structure Overview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(course); }} 
                            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white dark:hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                            title="Core Settings"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(course); }} 
                          className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm"
                          title="Delete Course"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
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
          <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 p-10 relative">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-8 right-8 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">New Category</h2>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">Masterclass Classification</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category Name *</label>
                <input 
                  type="text" 
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  placeholder="e.g. Advanced Theology"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-gray-900 dark:text-white transition-all font-bold placeholder:font-normal dark:placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">ID Number (Optional)</label>
                <input 
                  type="text" 
                  value={categoryFormData.idnumber}
                  onChange={e => setCategoryFormData({...categoryFormData, idnumber: e.target.value})}
                  placeholder="e.g. THEO-01"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-gray-900 dark:text-white transition-all font-bold placeholder:font-normal dark:placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Brief Description</label>
                <textarea 
                  value={categoryFormData.description}
                  onChange={e => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="What is this category about?"
                  rows={3}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-gray-900 dark:text-white transition-all font-bold placeholder:font-normal dark:placeholder:text-slate-600 resize-none"
                />
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex-1 px-4 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-black tracking-widest uppercase text-[10px] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCategory}
                disabled={isPending || isSaving}
                className="flex-[2] px-4 py-4 rounded-2xl bg-purple-600 text-white font-black tracking-widest uppercase text-[10px] shadow-lg shadow-purple-200 hover:bg-purple-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending || isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 my-8 border border-gray-100 dark:border-slate-800">
            <div className="flex flex-col border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {selectedCourse ? "Course Designer" : "Create New Masterclass"}
                    </h2>
                  </div>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex px-8 gap-8">
                <button 
                  type="button"
                  onClick={() => handleTabChange("settings")}
                  className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === "settings" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}
                >
                  General Settings
                </button>
                <button 
                  type="button"
                  onClick={() => handleTabChange("content")}
                  className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === "content" ? "border-purple-600 text-purple-600 dark:text-purple-400" : "border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"}`}
                >
                  Course Content
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-8 max-h-[60vh] overflow-y-auto bg-gray-50/30 dark:bg-slate-900/50">
                {activeTab === "settings" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Course Identity</label>
                        <input
                          type="text"
                          required
                          value={formData.fullname}
                          onChange={e => setFormData({ ...formData, fullname: e.target.value })}
                          className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-purple-50 dark:focus:ring-purple-900/20 focus:border-purple-400 transition-all font-bold text-gray-900 dark:text-white shadow-sm dark:placeholder:text-slate-600"
                          placeholder="e.g. Advanced Theology"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Unique Code</label>
                           <input
                             type="text"
                             required
                             value={formData.shortname}
                             onChange={e => setFormData({ ...formData, shortname: e.target.value })}
                             className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 dark:focus:ring-purple-900/10 focus:border-purple-400 transition-all text-gray-900 dark:text-white font-mono font-bold shadow-sm"
                             placeholder="ATH-2025"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Moodle Category</label>
                           <select
                             id="categoryid"
                             value={formData.categoryid}
                             onChange={(e) => setFormData({ ...formData, categoryid: parseInt(e.target.value) })}
                             className="w-full px-5 h-14 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-white transition-all font-bold appearance-none"
                             required
                           >
                             {categories.length === 0 && <option value="">No categories - Create one!</option>}
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
                        <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Premium Course Summary</label>
                        <textarea
                          rows={4}
                          value={formData.summary}
                          onChange={e => setFormData({ ...formData, summary: e.target.value })}
                          className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-400 transition-all resize-none font-medium text-gray-700 leading-relaxed shadow-sm mb-6"
                          placeholder="Craft a compelling narrative..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Cover Image</label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 dark:border-slate-700 border-dashed rounded-3xl cursor-pointer bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 transition-all group overflow-hidden">
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
                          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all group ${formData.syllabus_pdf ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750'}`}>
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
                       <div className="py-20 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 animate-pulse bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800">
                          <BookOpen className="w-12 h-12 mb-4 opacity-20 dark:opacity-40" />
                          <p className="font-bold text-sm tracking-widest uppercase">Fetching Architecture...</p>
                       </div>
                    ) : courseContents.length === 0 ? (
                       <div className="py-20 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800">
                          <p className="font-black text-gray-900 dark:text-white text-xl mb-2">Architectural Blueprint Needed.</p>
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
                               <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-purple-200 dark:hover:border-purple-900 transition-all">
                                  <div className="flex items-center gap-5">
                                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Play className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{section.name || `Section ${index}`}</h4>
                                     </div>
                                  </div>
                                   <div className="flex gap-2">
                                     <button onClick={() => selectedCourse && openAddModuleModal(section.id)} type="button" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-all" title="Add Asset">
                                        <Plus className="w-5 h-5" />
                                     </button>
                                     <button onClick={() => handleRenameSection(section.id, section.name)} type="button" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all" title="Rename Chapter">
                                        <Pencil className="w-4 h-4" />
                                     </button>
                                     <button onClick={() => handleDeleteSection(section.id)} type="button" className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 transition-all" title="Remove Chapter">
                                        <X className="w-4 h-4" />
                                     </button>
                                  </div>
                               </div>
                                <div className="pl-12 space-y-3">
                                   {section.modules?.filter(mod => mod.modname !== 'forum').map(mod => (
                                    <div key={mod.id} className="space-y-3">
                                      <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between group/mod ${expandedQuizId === mod.instance ? 'bg-white border-purple-200 shadow-lg' : 'bg-white/50 backdrop-blur-sm border-gray-100 hover:bg-white'}`}>
                                        <div className="flex items-center gap-4">
                                          <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center ${mod.modname === 'quiz' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                                            {mod.modname === 'quiz' ? <FileQuestion className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-gray-800">{mod.name} {mod.modname === 'quiz' && <span className="ml-2 text-[10px] font-black uppercase text-purple-400 tracking-widest">Assessment</span>}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              if (mod.modname === 'quiz' && mod.instance) {
                                                toggleQuizEditor(mod.instance);
                                              } else {
                                                handleUpdateModuleContent(mod);
                                              }
                                            }} 
                                            className={`p-2 transition-all rounded-lg ${expandedQuizId === mod.instance ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                                          >
                                            {mod.modname === 'quiz' && expandedQuizId === mod.instance ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Fluid Quiz Editor Panel */}
                                      {mod.modname === 'quiz' && expandedQuizId === mod.instance && (
                                        <div className="bg-white rounded-[2rem] border border-purple-100 p-6 shadow-xl animate-in slide-in-from-top-2 duration-300 ml-4 mb-6">
                                          <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                <FileQuestion className="w-4 h-4" />
                                              </div>
                                              <h5 className="font-black text-gray-900 uppercase tracking-tight text-xs">Questionnaire Designer</h5>
                                            </div>
                                            <button 
                                              type="button"
                                              onClick={() => handleQuizAddQuestion(mod.instance!)}
                                              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-md active:scale-95"
                                            >
                                              <Plus className="w-3 h-3" />
                                              Add New Block
                                            </button>
                                          </div>

                                          {isLoadingQuestions === mod.instance ? (
                                            <div className="py-12 flex flex-col items-center justify-center text-purple-300">
                                              <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                              <p className="text-[10px] font-bold uppercase tracking-widest">Loading Items...</p>
                                            </div>
                                          ) : (
                                            <div className="space-y-4">
                                              {quizQuestions[mod.instance!]?.length === 0 && (
                                                <div className="py-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-400">
                                                  <p className="text-xs font-bold uppercase tracking-widest">This examination is empty.</p>
                                                </div>
                                              )}
                                              {quizQuestions[mod.instance!]?.map((q, qIdx) => (
                                                <div key={q.id} className="group/q bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-purple-200 hover:shadow-sm transition-all relative">
                                                  <div className="flex gap-4 mb-4">
                                                    <div className="mt-1 flex flex-col items-center gap-1">
                                                      <div className="text-[10px] font-black text-purple-300">#{qIdx + 1}</div>
                                                      <div className="flex flex-col gap-0.5 mt-2">
                                                        <button 
                                                          type="button" 
                                                          disabled={qIdx === 0}
                                                          onClick={() => {
                                                            const updated = [...(quizQuestions[mod.instance!] || [])];
                                                            [updated[qIdx-1], updated[qIdx]] = [updated[qIdx], updated[qIdx-1]];
                                                            handleQuizReorder(mod.instance!, updated);
                                                          }}
                                                          className="p-1 text-gray-200 hover:text-purple-400 disabled:opacity-0 transition-colors"
                                                        >
                                                           <ChevronUp className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                          type="button" 
                                                          disabled={qIdx === (quizQuestions[mod.instance!]?.length || 0) - 1}
                                                          onClick={() => {
                                                            const updated = [...(quizQuestions[mod.instance!] || [])];
                                                            [updated[qIdx], updated[qIdx+1]] = [updated[qIdx+1], updated[qIdx]];
                                                            handleQuizReorder(mod.instance!, updated);
                                                          }}
                                                          className="p-1 text-gray-200 hover:text-purple-400 disabled:opacity-0 transition-colors"
                                                        >
                                                           <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                    <div className="flex-1">
                                                      <input 
                                                        className="w-full bg-transparent border-none focus:ring-0 font-bold text-gray-900 placeholder:text-gray-300 p-0 text-base"
                                                        value={q.questiontext}
                                                        onChange={(e) => {
                                                          const updated = [...(quizQuestions[mod.instance!] || [])];
                                                          updated[qIdx].questiontext = e.target.value;
                                                          setQuizQuestions(prev => ({ ...prev, [mod.instance!]: updated }));
                                                        }}
                                                        onBlur={() => handleQuizUpdateQuestion(mod.instance!, q)}
                                                        placeholder="Enter your question here..."
                                                      />
                                                    </div>
                                                    <button 
                                                      type="button" 
                                                      onClick={() => handleQuizDeleteQuestion(mod.instance!, q.id)}
                                                      className="text-gray-300 hover:text-red-500 transition-colors"
                                                    >
                                                      <Trash className="w-4 h-4" />
                                                    </button>
                                                  </div>

                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                                    {q.answers.map((ans: any, aIdx: number) => (
                                                      <div key={aIdx} className={`flex items-center gap-3 p-3 rounded-xl border border-white transition-all group/ans relative ${ans.fraction > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-white shadow-sm'}`}>
                                                        <button 
                                                          type="button"
                                                          onClick={() => {
                                                            const updated = [...(quizQuestions[mod.instance!] || [])];
                                                            updated[qIdx].answers = updated[qIdx].answers.map((a: any, i: number) => ({
                                                              ...a,
                                                              fraction: i === aIdx ? 1.0 : 0.0
                                                            }));
                                                            setQuizQuestions(prev => ({ ...prev, [mod.instance!]: updated }));
                                                            handleQuizUpdateQuestion(mod.instance!, q);
                                                          }}
                                                          title="Set as Correct Answer"
                                                          className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all ${ans.fraction > 0 ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-white'}`}
                                                        />
                                                        <input 
                                                          className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-gray-700 p-0"
                                                          value={ans.text}
                                                          onChange={(e) => {
                                                            const updated = [...(quizQuestions[mod.instance!] || [])];
                                                            updated[qIdx].answers[aIdx].text = e.target.value;
                                                            setQuizQuestions(prev => ({ ...prev, [mod.instance!]: updated }));
                                                          }}
                                                          onBlur={() => handleQuizUpdateQuestion(mod.instance!, q)}
                                                        />
                                                        {q.answers.length > 2 && (
                                                          <button 
                                                            type="button" 
                                                            onClick={() => handleQuizRemoveOption(mod.instance!, qIdx, aIdx)}
                                                            className="opacity-0 group-hover/ans:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500"
                                                          >
                                                            <X className="w-3 h-3" />
                                                          </button>
                                                        )}
                                                      </div>
                                                    ))}
                                                    <button 
                                                      type="button"
                                                      onClick={() => handleQuizAddOption(mod.instance!, qIdx)}
                                                      className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-100 text-gray-300 hover:border-purple-200 hover:text-purple-400 hover:bg-purple-50/20 transition-all"
                                                    >
                                                      <Plus className="w-3 h-3" />
                                                      <span className="text-[10px] font-black uppercase">Add Option</span>
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}

                                              <button 
                                                type="button"
                                                onClick={() => handleQuizAddQuestion(mod.instance!)}
                                                className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 flex items-center justify-center gap-2 hover:border-purple-200 hover:text-purple-400 hover:bg-purple-50/20 transition-all"
                                              >
                                                <Plus className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Append Next Question</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
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
                <button 
                  type="submit" 
                  disabled={isPending || isSaving} 
                  className={`px-10 py-5 text-[10px] font-black text-white rounded-2xl transition-all shadow-xl shadow-gray-200/50 disabled:opacity-50 flex items-center gap-3 active:scale-95 uppercase tracking-[0.2em] min-w-[200px] justify-center ${activeTab === "content" ? "bg-emerald-600 border-2 border-emerald-600 hover:bg-emerald-700" : "bg-gray-900 border-2 border-gray-900 hover:bg-purple-600 hover:border-purple-600 text-white"}`}
                >
                  {isPending || isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Syncing with Moodle...
                    </>
                  ) : activeTab === "content" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Finish & Close Designer
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {selectedCourse ? "Synchronize Course Settings" : "Deploy Masterclass Build"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isViewModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0b1120] max-w-5xl w-full max-h-[90vh] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden relative border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
             
             {/* Hero Header Area */}
             <div className="relative h-48 md:h-56 shrink-0 overflow-hidden">
                {(() => {
                   const hasOverview = selectedCourse.overviewfiles && selectedCourse.overviewfiles.length > 0;
                   const imageUrl = hasOverview ? selectedCourse.overviewfiles![0].fileurl : selectedCourse.courseimage;
                   const finalUrl = formatMoodleImageUrl(imageUrl);
                   
                   if (finalUrl) {
                     return (
                       <Image 
                         src={finalUrl} 
                         alt={selectedCourse.fullname} 
                         fill
                         className="object-cover"
                         unoptimized={true}
                       />
                     );
                   }
                   return <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-900" />;
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-2xl transition-all border border-white/20">
                  <X className="w-6 h-6" />
                </button>

                <div className="absolute bottom-10 left-10 right-10">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/30">
                        {categories.find(c => parseInt(c.slug.current) === selectedCourse.categoryid)?.title || "General"}
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                        REF: {selectedCourse.shortname}
                      </span>
                   </div>
                   <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-2xl">{selectedCourse.fullname}</h2>
                </div>
             </div>

             <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left: Summary & Metadata */}
                <div className="w-full md:w-80 border-r border-gray-100 dark:border-slate-800 p-8 overflow-y-auto bg-gray-50/30 dark:bg-slate-900/30 shrink-0">
                   <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Course Narrative</h4>
                   <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium mb-8">
                     {selectedCourse.summary.replace(/<[^>]*>/g, '') || "No specialized summary available for this architectural build."}
                   </p>

                   <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                         <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                            <BookOpen size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Curriculum</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{courseContents.length} Major Chapters</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <Users size={20} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{selectedCourse.visible ? "Public Distribution" : "Internal Archive"}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right: Curriculum View */}
                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#0b1120]">
                   <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Academic Architecture</h4>
                      {isLoadingContents && <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />}
                   </div>

                   {isLoadingContents ? (
                      <div className="space-y-4">
                         {[1,2,3].map(i => (
                           <div key={i} className="h-20 bg-gray-50 dark:bg-slate-900 rounded-[2rem] animate-pulse" />
                         ))}
                      </div>
                   ) : courseContents.length === 0 ? (
                      <div className="py-20 text-center">
                         <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No curriculum modules deployed.</p>
                      </div>
                   ) : (
                      <div className="space-y-6">
                         {courseContents.map((section, sIdx) => (
                            <div key={section.id} className="group/section">
                               <div className="flex items-center gap-4 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black">
                                     {sIdx + 1}
                                  </div>
                                  <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight uppercase">{section.name || "Untitled Segment"}</h3>
                               </div>
                               <div className="grid grid-cols-1 gap-3 pl-12">
                                  {section.modules?.filter(m => m.modname !== 'forum').map(mod => (
                                     <div key={mod.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-purple-100 dark:hover:border-purple-900 hover:bg-white dark:hover:bg-slate-800 transition-all group/mod">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-gray-400 group-hover/mod:text-purple-600 transition-colors">
                                           {mod.modname === 'quiz' ? <FileQuestion size={16} /> : <FileText size={16} />}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-slate-300 group-hover/mod:text-gray-900 dark:group-hover/mod:text-white transition-colors">{mod.name}</span>
                                        {mod.modname === 'quiz' && (
                                           <span className="ml-auto text-[8px] font-black bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Exam</span>
                                        )}
                                     </div>
                                  ))}
                                  {(!section.modules || section.modules.length === 0) && (
                                     <p className="text-[10px] text-gray-400 italic">No assets in this chapter.</p>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => handleDelete(selectedCourse)} 
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                  Terminate Course
                </button>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setIsViewModalOpen(false)} 
                     className="px-8 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                   >
                     Close Overview
                   </button>
                   <button 
                     onClick={() => { setIsViewModalOpen(false); handleOpenEdit(selectedCourse); }} 
                     className="px-8 py-4 rounded-2xl bg-gray-900 dark:bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 dark:shadow-none hover:bg-purple-600 dark:hover:bg-purple-700 transition-all active:scale-95"
                   >
                     Enter Design Studio
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {isEditorOpen && editingModule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden border border-gray-100 dark:border-slate-800">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Editing &quot;{editingModule.name}&quot;</h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-900 p-6 flex flex-col">
              <div className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden flex flex-col">
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex-wrap">
                  <button onClick={() => document.execCommand('bold')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Bold"><Bold className="w-4 h-4" /></button>
                  <button onClick={() => document.execCommand('italic')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Italic"><Italic className="w-4 h-4" /></button>
                  <button onClick={() => document.execCommand('underline')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Underline"><Underline className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>
                  <button onClick={() => document.execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Bullet List"><List className="w-4 h-4" /></button>
                  <button onClick={() => document.execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>
                  <button onClick={() => {
                    const url = prompt('Enter link URL:');
                    if (url) document.execCommand('createLink', false, url);
                  }} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Add Link"><Link2 className="w-4 h-4" /></button>
                  <button onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) document.execCommand('insertImage', false, url);
                  }} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300" title="Add Image"><ImageIcon className="w-4 h-4" /></button>
                  <div className="w-px h-5 bg-gray-300 dark:bg-slate-700 mx-1"></div>
                  <button onClick={() => document.execCommand('formatBlock', false, 'H1')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300 font-bold text-sm" title="Heading 1">H1</button>
                  <button onClick={() => document.execCommand('formatBlock', false, 'H2')} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded text-gray-700 dark:text-slate-300 font-bold text-sm" title="Heading 2">H2</button>
                </div>
                <div 
                  className="flex-1 p-4 overflow-y-auto max-w-none focus:outline-none min-h-[300px] dark:text-white"
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

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
              <button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
               <button 
                onClick={handleSaveEditorContent} 
                disabled={isSaving}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-100 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Masterclass...
                  </>
                ) : "Save Content Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isCategoriesListModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 p-10 relative flex flex-col max-h-[80vh]">
            <button onClick={() => setIsCategoriesListModalOpen(false)} className="absolute top-8 right-8 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="mb-8 text-center shrink-0">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <List className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Mastery Domains</h2>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">{categories.length} Registered Categories</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {categories.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between p-5 bg-gray-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-none hover:shadow-gray-200/50 rounded-2xl border border-gray-100 dark:border-slate-700 transition-all group">
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
                 className="w-full py-5 bg-gray-900 dark:bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black dark:hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl dark:shadow-none"
               >
                 <Plus className="w-4 h-4" /> Add New Domain
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Module Modal */}
      {addModuleModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-slate-800 p-10 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setAddModuleModal(prev => ({ ...prev, isOpen: false }))} className="absolute top-8 right-8 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                <Plus className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Deploy New Asset</h2>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1 font-medium">Choose the asset type and configure it below.</p>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { key: 'page' as const, icon: FileText, label: 'Page', color: 'blue' },
                { key: 'quiz' as const, icon: FileQuestion, label: 'Quiz', color: 'purple' },
                { key: 'video' as const, icon: Video, label: 'Video', color: 'rose' },
                { key: 'pdf' as const, icon: Upload, label: 'Document', color: 'amber' },
              ].map(item => {
                const isActive = addModuleModal.type === item.key;
                const colorMap: Record<string, string> = {
                  blue: isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 hover:bg-blue-50 hover:text-blue-600',
                  purple: isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-none' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 hover:bg-purple-50 hover:text-purple-600',
                  rose: isActive ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 hover:bg-rose-50 hover:text-rose-600',
                  amber: isActive ? 'bg-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-none' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 hover:bg-amber-50 hover:text-amber-600',
                };
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setAddModuleModal(prev => ({ ...prev, type: item.key }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${colorMap[item.color]}`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Name Input */}
            {addModuleModal.type && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Asset Name *</label>
                  <input
                    type="text"
                    value={addModuleModal.name}
                    onChange={e => setAddModuleModal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={addModuleModal.type === 'quiz' ? 'e.g. Module 1 Assessment' : addModuleModal.type === 'video' ? 'e.g. Introduction Lecture' : addModuleModal.type === 'pdf' ? 'e.g. Course Syllabus' : 'e.g. Chapter Overview'}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-gray-900 dark:text-white transition-all font-bold placeholder:font-normal dark:placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                {/* Video URL Field */}
                {addModuleModal.type === 'video' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Video URL</label>
                    <input
                      type="url"
                      value={addModuleModal.videoUrl}
                      onChange={e => setAddModuleModal(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-100 dark:focus:ring-rose-900/20 text-gray-900 dark:text-white transition-all font-bold placeholder:font-normal dark:placeholder:text-slate-600"
                    />
                    <p className="text-[10px] text-gray-400 ml-1 font-medium">YouTube, Vimeo, or direct MP4 link supported.</p>
                  </div>
                )}

                {/* Time Limit Field for Quiz */}
                {addModuleModal.type === 'quiz' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Time Limit (Minutes)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={addModuleModal.timelimit}
                        onChange={e => setAddModuleModal(prev => ({ ...prev, timelimit: parseInt(e.target.value) || 0 }))}
                        placeholder="e.g. 60"
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-gray-900 dark:text-white font-bold"
                      />
                      <Clock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-gray-400 ml-1 font-medium">Set to 0 for no time limit.</p>
                  </div>
                )}

                {/* PDF Upload Field */}
                {addModuleModal.type === 'pdf' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Upload Document</label>
                    <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${
                      addModuleModal.pdfBase64 ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-amber-300 hover:bg-amber-50/20'
                    }`}>
                      <div className="flex flex-col items-center justify-center py-4">
                        {addModuleModal.pdfBase64 ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-amber-600 mb-1" />
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{addModuleModal.pdfName}</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-gray-300 dark:text-slate-600 mb-1 group-hover:text-amber-500 transition-colors" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose PDF file</p>
                          </>
                        )}
                      </div>
                      <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setAddModuleModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-black tracking-widest uppercase text-[10px] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateModule}
                    disabled={addModuleModal.isCreating || !addModuleModal.name.trim() || (addModuleModal.type === 'pdf' && !addModuleModal.pdfBase64)}
                    className="flex-[2] px-4 py-4 rounded-2xl bg-purple-600 text-white font-black tracking-widest uppercase text-[10px] shadow-lg shadow-purple-200 dark:shadow-none hover:bg-purple-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {addModuleModal.isCreating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Deploy {addModuleModal.type === 'quiz' ? 'Assessment' : addModuleModal.type === 'video' ? 'Video' : addModuleModal.type === 'pdf' ? 'Document' : 'Page'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!addModuleModal.type && (
              <p className="text-center text-sm text-gray-300 dark:text-slate-600 font-bold py-4">Select an asset type above to continue.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
