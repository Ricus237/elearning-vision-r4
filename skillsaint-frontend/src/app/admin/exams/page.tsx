"use client";
import { useState } from "react";
import { PlusCircle, FileQuestion, Edit3, Trash2, Eye, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { examQuestions, courses } from "@/data/curriculum";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

const ManageExamsPage = () => {
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct: 0,
    difficulty: "easy",
  });

  const toggleExpand = (courseId: number) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const totalQuestions = examQuestions.reduce((sum, eq) => sum + eq.questions.length, 0);
  const coursesWithExams = examQuestions.length;
  const coursesWithoutExams = courses.length - coursesWithExams;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Exams (QCM)</h1>
              <p className="text-secondary mt-1">Create and manage multiple-choice exams for your courses.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Add Questions
            </button>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Questions</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalQuestions}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Courses with Exams</p>
                <h3 className="text-2xl font-bold text-gray-900">{coursesWithExams}</h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Need Exams</p>
                <h3 className="text-2xl font-bold text-gray-900">{coursesWithoutExams}</h3>
              </div>
            </div>
          </div>

          {/* Course Exams List */}
          <div className="space-y-4">
            {courses.map((course) => {
              const courseExam = examQuestions.find(eq => eq.courseId === course.id);
              const hasExam = !!courseExam;
              const isExpanded = expandedCourse === course.id;

              return (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => hasExam && toggleExpand(course.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasExam ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {hasExam ? <CheckCircle className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">
                          {hasExam
                            ? `${courseExam.questions.length} questions created`
                            : "No exam created yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!hasExam && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                          className="text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                        >
                          Create Exam
                        </button>
                      )}
                      {hasExam && (
                        isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Questions */}
                  {hasExam && isExpanded && (
                    <div className="border-t border-gray-100">
                      <div className="p-4 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Questions</span>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="text-sm text-purple-600 font-medium hover:text-purple-700"
                        >
                          + Add Question
                        </button>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {courseExam.questions.map((q, idx) => (
                          <div key={q.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center rounded-full">
                                    {idx + 1}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    q.difficulty === "easy" ? "bg-green-100 text-green-700" :
                                    q.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }`}>
                                    {q.difficulty}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {q.options.map((option, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`text-sm px-3 py-2 rounded-lg ${
                                        optIdx === q.correct
                                          ? "bg-green-50 text-green-800 border border-green-200"
                                          : "bg-gray-50 text-gray-600 border border-gray-100"
                                      }`}
                                    >
                                      {optIdx === q.correct && <span className="font-medium">✓ </span>}
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

          {/* Create Question Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Question</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white">
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                    <textarea
                      rows={3}
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                      placeholder="Enter the question text..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options (mark the correct answer)</label>
                    <div className="space-y-3">
                      {newQuestion.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <button
                            onClick={() => setNewQuestion({ ...newQuestion, correct: idx })}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              newQuestion.correct === idx ? "border-green-500 bg-green-500" : "border-gray-300"
                            }`}
                          >
                            {newQuestion.correct === idx && <CheckCircle className="w-4 h-4 text-white" />}
                          </button>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const opts = [...newQuestion.options];
                              opts[idx] = e.target.value;
                              setNewQuestion({ ...newQuestion, options: opts });
                            }}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                            placeholder={`Option ${idx + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <div className="flex gap-3">
                      {["easy", "medium", "hard"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setNewQuestion({ ...newQuestion, difficulty: d })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                            newQuestion.difficulty === d
                              ? d === "easy" ? "bg-green-100 text-green-700" : d === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-5 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-5 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
                    Add Question
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

export default ManageExamsPage;
