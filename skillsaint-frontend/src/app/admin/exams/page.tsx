"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusCircle, FileQuestion, Trash2, CheckCircle, ChevronDown, X, Loader2 } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { getExamsFull, getPublicCourses, createQuestion, initExam, getQuizQuestions, deleteQuestion } from "@/lib/moodle";
import { CourseType } from "@/types/CourseType";

interface MoodleExam {
  id: number;
  courseid: number;
  coursename: string;
  name: string;
  intro: string;
  questioncount: number;
}

const ManageExamsPage = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [exams, setExams] = useState<MoodleExam[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Record<number, Array<{id: number, name: string, questiontext: string, correct: number, answers: Array<{text: string, fraction: number}>}>>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [selectedQuizId, setSelectedQuizId] = useState<number>(0);

  const [newQuestion, setNewQuestion] = useState({
    name: "",
    question: "",
    options: ["", ""], // Start with 2 options (minimum)
    correct: 0,
    difficulty: "medium",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesData, examsData] = await Promise.all([
        getPublicCourses(),
        getExamsFull()
      ]);
      setCourses(coursesData || []);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (error) {
      console.error("Failed to fetch exams data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = async (courseId: number, quizId: number) => {
    if (expandedCourse === quizId) {
      setExpandedCourse(null);
      setSelectedQuizId(0);
      return;
    }
    
    setExpandedCourse(quizId);
    setSelectedQuizId(quizId);
    setSelectedCourseId(courseId);
    
    if (!quizQuestions[quizId]) {
      const data = await getQuizQuestions(quizId);
      if (Array.isArray(data)) {
        setQuizQuestions(prev => ({ ...prev, [quizId]: data }));
      }
    }
  };

  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) return;
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions,
      correct: prev.correct >= newOptions.length ? 0 : prev.correct
    }));
  };

  const handleInitExam = async (courseId: number, courseTitle: string) => {
    setIsInitializing(courseId);
    try {
      const res = await initExam(courseId, `${courseTitle} - Exam`);
      if (res && res.status === "success") {
        await fetchData(); // Refresh list
      } else {
        alert("Failed to initialize exam: " + (res?.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      setIsInitializing(null);
    }
  };

  const handleCreateQuestion = async () => {
    const filledOptions = newQuestion.options.filter(opt => opt.trim() !== "");
    
    if (!selectedCourseId || !newQuestion.question || !newQuestion.name) {
      alert("Please fill in the question name, text and select a course.");
      return;
    }

    if (filledOptions.length < 2) {
      alert("Requires at least 2 non-empty options for a multiple choice question.");
      return;
    }

    const exam = exams.find(e => e.id === Number(selectedQuizId));
    if (!exam) {
      alert("No quiz found for this course. Please initialize the exam first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Map only the filled options
      const answers = newQuestion.options
        .map((opt, idx) => ({
          text: opt,
          fraction: idx === newQuestion.correct ? 1.0 : 0.0
        }))
        .filter(ans => ans.text.trim() !== "");

      const res = await createQuestion({
        courseid: Number(selectedCourseId),
        quizid: exam.id,
        name: newQuestion.name,
        text: newQuestion.question,
        answers: answers,
        mark: 1 // On définit un point par défaut pour que le quiz soit notable
      });

      if (res && res.status === "success") {
        setShowCreateModal(false);
        setNewQuestion({
          name: "",
          question: "",
          options: ["", ""],
          correct: 0,
          difficulty: "medium",
        });
        fetchData(); 
      } else {
        alert("Failed to create question: " + (res?.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (quizId: number, questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await deleteQuestion(quizId, questionId);
      if (res && res.status === "success") {
        // Refresh local state by removing the question
        setQuizQuestions(prev => ({
          ...prev,
          [quizId]: (prev[quizId] || []).filter(q => q.id !== questionId)
        }));
      } else {
        alert("Failed to delete question");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const totalQuestions = exams.reduce((sum, e) => sum + e.questioncount, 0);
  const coursesWithExams = exams.length;
  const coursesWithoutExams = courses.length - coursesWithExams;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120] flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="h-full pt-24 md:pt-0 p-6 md:p-10 lg:p-12 bg-[#f0f2f5] dark:bg-[#0b1120]">
          <div className="max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Assessment Center</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">
                  Curriculum <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Exams</span>
                </h1>
                <p className="text-gray-400 dark:text-slate-500 font-medium max-w-md">
                  Live management of assessments. Connect real course data with intelligence-driven evaluations.
                </p> 
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex items-center justify-center gap-3 bg-gray-900 dark:bg-purple-600 text-white px-8 py-5 rounded-2xl font-bold hover:bg-purple-600 dark:hover:bg-purple-700 transition-all duration-300 shadow-xl shadow-gray-200 dark:shadow-none hover:-translate-y-1 active:translate-y-0 w-full lg:w-auto"
              >
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> 
                <span className="uppercase tracking-widest text-[10px]">Add Live Question</span>
              </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 animate-in fade-in duration-1000 slide-in-from-bottom-5">
              <div className="group bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-6 hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-none transition-all duration-500">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-slate-800 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <FileQuestion className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Assets</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{totalQuestions} <span className="text-sm font-medium text-gray-400 dark:text-slate-600">Items</span></h3>
                </div>
              </div>

              <div className="group bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-6 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-none transition-all duration-500">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Course Quizzes</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{coursesWithExams} <span className="text-sm font-medium text-gray-400 dark:text-slate-600">Live</span></h3>
                </div>
              </div>

              <div className="group bg-white dark:bg-[#1e293b] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-6 hover:shadow-xl hover:shadow-orange-500/5 dark:hover:shadow-none transition-all duration-500">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-slate-800 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                  <FileQuestion className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Untested Courses</p>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{coursesWithoutExams} <span className="text-sm font-medium text-gray-400 dark:text-slate-600">Empty</span></h3>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-[0.3em]">Synchronizing with database...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Masterclass Assessments</h2>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 gap-6 pb-20">
                  {courses.map((course, index) => {
                    const courseIdNum = Number(course.slug.current);
                    const courseExams = exams.filter(e => e.courseid === courseIdNum);
                    const hasExams = courseExams.length > 0;
                    
                    return (
                      <div 
                        key={course._id} 
                        className={`group bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-500 hover:shadow-lg`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="p-8 pb-4">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${hasExams ? "bg-white dark:bg-slate-800 shadow-sm text-emerald-500 dark:text-emerald-400 group-hover:rotate-3" : "bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-600"}`}>
                                {hasExams ? <CheckCircle className="w-7 h-7" /> : <PlusCircle className="w-7 h-7" />}
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-1">{course.title}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">{courseExams.length} Active Assessments</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const name = prompt("New Quiz name:", `${course.title} - Assessment`);
                                if (name) handleInitExam(courseIdNum, name);
                              }}
                              disabled={isInitializing === courseIdNum}
                              className="px-6 py-3 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 dark:shadow-none"
                            >
                              {isInitializing === courseIdNum ? "Creating..." : "Initialize New Quiz"}
                            </button>
                          </div>
                          
                          {!hasExams ? (
                            <div className="py-8 bg-gray-50/30 dark:bg-slate-900/10 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No quizzes found for this module</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {courseExams.map(exam => {
                                const isExpanded = expandedCourse === exam.id;
                                return (
                                  <div key={exam.id} className={`border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-purple-100 dark:ring-purple-900 shadow-lg' : ''}`}>
                                    <div 
                                      className={`p-5 flex items-center justify-between cursor-pointer ${isExpanded ? 'bg-purple-50/50 dark:bg-purple-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/20'}`}
                                      onClick={() => toggleExpand(courseIdNum, exam.id)}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-600 shadow-sm">
                                          <FileQuestion className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{exam.name}</h4>
                                          <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">{exam.questioncount} Questions</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setSelectedCourseId(courseIdNum); setSelectedQuizId(exam.id); setShowCreateModal(true); }}
                                          className="px-4 py-2 bg-gray-900 dark:bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-purple-600 transition-all"
                                        >
                                          Add Question
                                        </button>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                      </div>
                                    </div>
                                    
                                    {isExpanded && (
                                      <div className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-[#1e293b]">
                                        <div className="p-6">
                                          {(quizQuestions[exam.id] || []).length === 0 ? (
                                            <div className="py-8 text-center bg-gray-50/50 dark:bg-slate-900/50 rounded-xl">
                                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                                                Intelligence void detected.<br/>Add questions to activate this node.
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="space-y-4">
                                              {(quizQuestions[exam.id] || []).map((q, qIdx) => (
                                                <div key={q.id} className="group/item flex items-start justify-between gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-slate-900/50 rounded-xl transition-all">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className="text-[10px] font-black bg-gray-900 text-white w-5 h-5 flex items-center justify-center rounded-md">{qIdx + 1}</span>
                                                      <p className="text-sm font-black text-gray-900 dark:text-white">{q.questiontext}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                      {q.answers.map((ans, aIdx) => (
                                                        <div key={aIdx} className={`px-3 py-2 rounded-lg text-[10px] border ${ans.fraction >= 1.0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'bg-white border-gray-100 text-gray-400 font-medium'}`}>
                                                          {ans.text}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(exam.id, q.id); }}
                                                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="p-8 pt-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => !isSubmitting && setShowCreateModal(false)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] shadow-2xl max-w-3xl w-full p-6 md:p-12 max-h-[90vh] overflow-y-auto relative border border-gray-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
              className="absolute top-10 right-10 p-3 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-6 shadow-xl shadow-purple-900/5">
                <FileQuestion className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Intelligence Design</h2>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2">New Assessment Block</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Target Assessment</label>
                <div className="relative group">
                  <select 
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                    className="w-full h-16 px-8 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-base font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a quiz...</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.coursename} - {e.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-600 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Internal Name (Reference)</label>
                <input
                  type="text"
                  value={newQuestion.name}
                  onChange={(e) => setNewQuestion({ ...newQuestion, name: e.target.value })}
                  className="w-full px-8 h-12 md:h-16 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-base font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all dark:placeholder:text-slate-600"
                  placeholder="e.g., Intro Quiz Q1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Inquiry Text</label>
                <textarea
                  rows={3}
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="w-full px-8 py-6 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-base font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all resize-none placeholder:font-normal dark:placeholder:text-slate-600"
                  placeholder="What is the fundamental concept being tested?"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Response Spectrum</label>
                  <button 
                    onClick={addOption}
                    className="text-[10px] font-black text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 uppercase tracking-widest flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> Add Choice
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {newQuestion.options.map((option, idx) => (
                    <div key={idx} className="flex gap-4 group/option">
                      <button
                        onClick={() => setNewQuestion({ ...newQuestion, correct: idx })}
                        className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${
                          newQuestion.correct === idx ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-none" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900"
                        }`}
                      >
                        {newQuestion.correct === idx ? <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-white" /> : <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-100 dark:bg-slate-700" />}
                      </button>
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const opts = [...newQuestion.options];
                            opts[idx] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          className={`w-full px-6 md:px-8 h-12 md:h-16 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm md:text-base font-bold transition-all focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-900/20 placeholder:font-normal dark:placeholder:text-slate-600 ${newQuestion.correct === idx ? 'text-emerald-900 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10' : 'text-gray-900 dark:text-white'}`}
                          placeholder={`Option ${idx + 1}`}
                        />
                        {newQuestion.options.length > 2 && (
                          <button 
                            onClick={() => removeOption(idx)}
                            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/option:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-gray-100 dark:border-slate-800">
              <button 
                onClick={() => setShowCreateModal(false)} 
                disabled={isSubmitting}
                className="flex-1 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Discard
              </button>
              <button 
                onClick={handleCreateQuestion} 
                disabled={isSubmitting}
                className="flex-[2] h-16 bg-gray-900 dark:bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 dark:shadow-none hover:bg-purple-600 dark:hover:bg-purple-700 transition-all border-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate and Store"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExamsPage;
