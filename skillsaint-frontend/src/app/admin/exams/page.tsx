"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusCircle, FileQuestion, Trash2, CheckCircle, ChevronDown, X, Loader2 } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { getExamsFull, getPublicCourses, createQuestion, initExam, getQuizQuestions } from "@/lib/moodle";
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
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");

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
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    // Load questions if not already loaded
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
      alert("Moodle requires at least 2 non-empty options for a multiple choice question.");
      return;
    }

    const exam = exams.find(e => e.courseid === Number(selectedCourseId));
    if (!exam) {
      alert("No quiz found for this course in Moodle. Please initialize the exam first.");
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
        answers: answers
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

  const totalQuestions = exams.reduce((sum, e) => sum + e.questioncount, 0);
  const coursesWithExams = exams.length;
  const coursesWithoutExams = courses.length - coursesWithExams;

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="h-full pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Assessment Center</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                  Curriculum <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Exams</span>
                </h1>
                <p className="text-gray-400 font-medium max-w-md">
                  Live management of Moodle assessments. Connect real course data with intelligence-driven evaluations.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-600 transition-all duration-300 shadow-xl shadow-gray-200 hover:shadow-purple-200 hover:-translate-y-1 active:translate-y-0"
              >
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> 
                <span className="uppercase tracking-widest text-[10px]">Add Live Question</span>
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-in fade-in duration-1000 slide-in-from-bottom-5">
              <div className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <FileQuestion className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Assets</p>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">{totalQuestions} <span className="text-sm font-medium text-gray-400">Items</span></h3>
                </div>
              </div>

              <div className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Course Quizzes</p>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">{coursesWithExams} <span className="text-sm font-medium text-gray-400">Live</span></h3>
                </div>
              </div>

              <div className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                  <FileQuestion className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Untested Courses</p>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">{coursesWithoutExams} <span className="text-sm font-medium text-gray-400">Empty</span></h3>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Synchronizing with Moodle...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Masterclass Assessments</h2>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <div className="grid grid-cols-1 gap-6 pb-20">
                  {courses.map((course, index) => {
                    const courseIdNum = Number(course.slug.current);
                    const courseExam = exams.find(e => e.courseid === courseIdNum);
                    const hasExam = !!courseExam;
                    const isExpanded = expandedCourse === courseIdNum;

                    return (
                      <div 
                        key={course._id} 
                        className={`group bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-purple-100 shadow-xl' : 'hover:shadow-lg hover:-translate-y-1'}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div
                          className={`p-8 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-purple-50/30' : 'hover:bg-gray-50/50'}`}
                          onClick={() => hasExam && toggleExpand(courseIdNum, courseExam.id)}
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${hasExam ? "bg-white shadow-sm text-emerald-500 group-hover:rotate-3" : "bg-gray-50 text-gray-300"}`}>
                              {hasExam ? <CheckCircle className="w-7 h-7" /> : <PlusCircle className="w-7 h-7" />}
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{course.title}</h3>
                              <div className="flex items-center gap-2">
                                {hasExam ? (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {courseExam.questioncount} Questions in Moodle
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 bg-gray-50 px-2 py-0.5 rounded-md italic">
                                    Moodle Quiz Not Found
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {!hasExam && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleInitExam(courseIdNum, course.title); }}
                                disabled={isInitializing === courseIdNum}
                                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                  isInitializing === courseIdNum 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                    : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200"
                                }`}
                              >
                                {isInitializing === courseIdNum ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Creating...</span>
                                  </div>
                                ) : (
                                  "Initialize Exam"
                                )}
                              </button>
                            )}
                            {hasExam && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedCourseId(courseIdNum); setShowCreateModal(true); }}
                                className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-600 transition-all shadow-lg shadow-gray-200"
                              >
                                Add Question
                              </button>
                            )}
                            {hasExam && (
                              <div className={`p-3 rounded-full transition-all duration-500 ${isExpanded ? 'bg-purple-100 text-purple-600 rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                                <ChevronDown className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                        </div>

                        {hasExam && isExpanded && (
                          <div className="border-t border-gray-100 animate-in slide-in-from-top duration-500">
                            <div className="px-10 py-4 bg-gray-50/50 flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Questions • {(quizQuestions[courseExam.id] || []).length} Items</span>
                              <button
                                onClick={() => { setSelectedCourseId(courseIdNum); setShowCreateModal(true); }}
                                className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-purple-100 transition-all"
                              >
                                + New Question
                              </button>
                            </div>
                            {(quizQuestions[courseExam.id] || []).length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 text-center">
                                <FileQuestion className="w-10 h-10 text-gray-200 mb-3" />
                                <p className="text-sm font-medium text-gray-400">No questions yet. Add your first QCM above.</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-50 px-4 md:px-10 pb-8 bg-gray-50/20">
                                {(quizQuestions[courseExam.id] || []).map((q, idx) => (
                                  <div key={q.id} className="py-6 group/item">
                                    <div className="flex items-start justify-between gap-6">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                          <span className="text-xs font-black bg-gray-900 text-white w-7 h-7 flex items-center justify-center rounded-lg">{idx + 1}</span>
                                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-purple-50 text-purple-600">{q.name}</span>
                                        </div>
                                        <p className="text-base font-black text-gray-900 mb-4 leading-tight">{q.questiontext}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-3xl">
                                          {q.answers.map((ans, aIdx) => (
                                            <div key={aIdx} className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm transition-all ${
                                              ans.fraction >= 1.0
                                                ? "bg-emerald-50 text-emerald-900 border-2 border-emerald-100 font-bold"
                                                : "bg-white text-gray-500 border border-gray-100 font-medium"
                                            }`}>
                                              <div className={`w-2 h-2 rounded-full shrink-0 ${ans.fraction >= 1.0 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                              {ans.text}
                                              {ans.fraction >= 1.0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <button className="w-9 h-9 bg-white text-gray-300 hover:text-red-500 border border-gray-100 rounded-xl flex items-center justify-center transition-all">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full p-12 max-h-[90vh] overflow-y-auto relative border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
              className="absolute top-10 right-10 p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-all disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-purple-50 flex items-center justify-center text-purple-600 mx-auto mb-6 shadow-xl shadow-purple-900/5">
                <FileQuestion className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Design</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">New Assessment Block</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Masterclass</label>
                <div className="relative group">
                  <select 
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                    className="w-full h-16 px-8 bg-gray-50 border-none rounded-2xl text-base font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c._id} value={c.slug.current}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Name (Reference)</label>
                <input
                  type="text"
                  value={newQuestion.name}
                  onChange={(e) => setNewQuestion({ ...newQuestion, name: e.target.value })}
                  className="w-full px-8 h-16 bg-gray-50 border-none rounded-2xl text-base font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="e.g., Intro Quiz Q1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inquiry Text</label>
                <textarea
                  rows={3}
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="w-full px-8 py-6 bg-gray-50 border-none rounded-2xl text-base font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all resize-none placeholder:font-normal"
                  placeholder="What is the fundamental concept being tested?"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Response Spectrum</label>
                  <button 
                    onClick={addOption}
                    className="text-[10px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> Add Choice
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {newQuestion.options.map((option, idx) => (
                    <div key={idx} className="flex gap-4 group/option">
                      <button
                        onClick={() => setNewQuestion({ ...newQuestion, correct: idx })}
                        className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${
                          newQuestion.correct === idx ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200" : "bg-white border-gray-100 hover:border-emerald-200"
                        }`}
                      >
                        {newQuestion.correct === idx ? <CheckCircle className="w-8 h-8 text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-100" />}
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
                          className={`w-full px-8 h-16 bg-gray-50 border-none rounded-2xl text-base font-bold transition-all focus:ring-4 focus:ring-emerald-50 placeholder:font-normal ${newQuestion.correct === idx ? 'text-emerald-900 bg-emerald-50/30' : 'text-gray-900'}`}
                          placeholder={`Option ${idx + 1}`}
                        />
                        {newQuestion.options.length > 2 && (
                          <button 
                            onClick={() => removeOption(idx)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/option:opacity-100 transition-all"
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

            <div className="flex gap-4 mt-12 pt-8 border-t border-gray-100">
              <button 
                onClick={() => setShowCreateModal(false)} 
                disabled={isSubmitting}
                className="flex-1 h-16 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                Discard
              </button>
              <button 
                onClick={handleCreateQuestion} 
                disabled={isSubmitting}
                className="flex-[2] h-16 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-purple-600 transition-all border-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validate and Store in Moodle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExamsPage;
