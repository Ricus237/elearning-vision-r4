"use client";
import Link from "next/link";
import { BookOpen, CheckCircle, Trophy, Lock, FileText, PlayCircle, Download, FilePlus, X, Mail } from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { CourseType } from "@/types/CourseType";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { checkActivation, activateAccount } from "@/lib/data";

interface DashboardClientProps {
  enrolledCourses: CourseType[];
}

const mockTrimesters = [
  {
    id: 1,
    title: "Trimester 1: Kingdom Foundations",
    isActive: true,
    progress: 45,
    subjects: Array.from({ length: 5 }).map((_, i) => ({
      id: `t1-s${i + 1}`,
      title: `Subject ${i + 1}: Core Principles`,
      completedLessons: i === 0 ? 12 : i === 1 ? 5 : 0,
      totalLessons: 12,
      isLocked: i > 1
    }))
  },
  {
    id: 2,
    title: "Trimester 2: Spiritual Identity",
    isActive: false,
    progress: 0,
    subjects: Array.from({ length: 5 }).map((_, i) => ({
      id: `t2-s${i + 1}`,
      title: `Subject ${i + 1}: Deep Diving`,
      completedLessons: 0,
      totalLessons: 12,
      isLocked: true
    }))
  },
  {
    id: 3,
    title: "Trimester 3: Ministry & Service",
    isActive: false,
    progress: 0,
    subjects: Array.from({ length: 5 }).map((_, i) => ({
      id: `t3-s${i + 1}`,
      title: `Subject ${i + 1}: Leadership Formation`,
      completedLessons: 0,
      totalLessons: 10,
      isLocked: true
    }))
  },
  {
    id: 4,
    title: "Trimester 4: Global Impact",
    isActive: false,
    progress: 0,
    subjects: Array.from({ length: 5 }).map((_, i) => ({
      id: `t4-s${i + 1}`,
      title: `Subject ${i + 1}: Advanced Application`,
      completedLessons: 0,
      totalLessons: 10,
      isLocked: true
    }))
  }
];

const DashboardClient = ({ enrolledCourses }: DashboardClientProps) => {
  const [activeTrimester, setActiveTrimester] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  
  // Question form state
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  const [isQuestionSent, setIsQuestionSent] = useState(false);
  
  // Activation State
  const [isAccountActivated, setIsAccountActivated] = useState<boolean | null>(null);
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function initActivation() {
      const match = document.cookie.match(/user_email=([^;]+)/);
      const email = match ? decodeURIComponent(match[1]) : "";
      setUserEmail(email);

      if (email) {
        const active = await checkActivation(email);
        setIsAccountActivated(active);
      } else {
        // If no email, assume not logged in or not application user
        setIsAccountActivated(true); 
      }
    }
    initActivation();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");
    setIsActivating(true);

    const res = await activateAccount(userEmail, activationCode);
    if (res.status === 'success') {
      setIsAccountActivated(true);
    } else {
      setActivationError(res.message || "Invalid code. Please check with your instructor.");
    }
    setIsActivating(false);
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSendingQuestion(true);
    // Simulate backend call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSendingQuestion(false);
    setIsQuestionSent(true);
    setQuestionText("");

    // Reset success state after 3 seconds
    setTimeout(() => {
      setIsQuestionSent(false);
      setIsAskingQuestion(false);
    }, 3000);
  };

  const closeSubjectModal = () => {
    setSelectedSubject(null);
    setIsAskingQuestion(false);
    setIsQuestionSent(false);
    setQuestionText("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans relative">
      <StudentSidebar />

      {/* Activation Overlay / Wall */}
      <AnimatePresence>
        {isAccountActivated === false && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-purple-100"
            >
              <div className="size-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl font-black font-serif text-slate-900 mb-4">Account Locked</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                Your payment was received, but your account is waiting for final activation. Please enter the secret code sent by your instructor.
              </p>

              <form onSubmit={handleActivate} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="Enter Activation Code"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black tracking-widest text-xl focus:border-purple-600 outline-none transition-colors"
                  />
                </div>
                
                {activationError && (
                  <p className="text-red-500 text-sm font-bold">{activationError}</p>
                )}

                <button 
                  type="submit"
                  disabled={isActivating || !activationCode}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                >
                  {isActivating ? "Activating..." : "Unlock Dashboard →"}
                </button>
              </form>
              
              <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                Problems? Contact your advisor at support@ibi.edu
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 pb-20 md:pb-20 lg:pb-20">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <header>
            <h1 className="text-4xl font-black font-serif text-slate-900 leading-tight">Program Courses</h1>
            <p className="text-slate-500 mt-2 font-medium text-lg max-w-2xl">
              Your one-year transformational journey through four trimesters. Each chapter unlocks as you progress in the grace of your studies.
            </p>
          </header>

          {/* Operational Checklist / Quick Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="size-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                   <Download size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Downloadable Manuals</h4>
                <p className="text-xs text-slate-500 mt-1">Available for all lessons</p>
             </div>
             <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                   <FilePlus size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Letter Grading</h4>
                <p className="text-xs text-slate-500 mt-1">Rigorous academic system</p>
             </div>
             <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="size-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                   <Trophy size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Certificate</h4>
                <p className="text-xs text-slate-500 mt-1">Granted upon completion</p>
             </div>
             <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="size-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                   <CheckCircle size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Progress Tracking</h4>
                <p className="text-xs text-slate-500 mt-1">Monitor achievements</p>
             </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">
             
             {/* Left Trimester List */}
             <div className="w-full xl:w-1/3 flex flex-col gap-4">
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs ml-2">Academic Roadmap</h3>
                
                {mockTrimesters.map((t) => (
                   <div 
                     key={t.id} 
                     onClick={() => setActiveTrimester(t.id)}
                     className={`cursor-pointer text-left p-6 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden ${
                       activeTrimester === t.id 
                       ? "bg-purple-900 border-purple-900 text-white shadow-xl shadow-purple-900/20" 
                       : "bg-white border-slate-200/60 hover:border-purple-200 text-slate-900"
                     }`}
                   >
                     {/* Lock Icon for unavailable ones */}
                     {!t.isActive && activeTrimester !== t.id && (
                        <div className="absolute top-6 right-6 text-slate-300">
                           <Lock size={20} />
                        </div>
                     )}

                     <h4 className={`text-xl font-black font-serif mb-2 pr-8 ${activeTrimester === t.id ? "text-white" : "text-slate-900"}`}>
                        {t.title}
                     </h4>
                     
                     <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider mb-4">
                        <span className={activeTrimester === t.id ? "text-purple-300" : "text-slate-500"}>
                           5 Subjects
                        </span>
                        <span className="size-1 rounded-full bg-current opacity-30" />
                        <span className={activeTrimester === t.id ? "text-purple-300" : "text-slate-500"}>
                           50-60 Lessons
                        </span>
                     </div>

                     {/* Progress Bar */}
                     <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden relative">
                        <motion.div 
                          className={`absolute top-0 left-0 h-full rounded-full ${activeTrimester === t.id ? "bg-purple-400" : "bg-purple-600"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${t.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                     </div>
                   </div>
                ))}
             </div>

             {/* Right Content View */}
             <div className="w-full xl:w-2/3 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                 <AnimatePresence mode="wait">
                    {mockTrimesters.filter(t => t.id === activeTrimester).map((trimester) => (
                       <motion.div 
                         key={trimester.id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.3 }}
                       >
                          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                             <div>
                                <h2 className="text-3xl font-black font-serif text-slate-900 mb-2">{trimester.title} Subjects</h2>
                                <p className="text-slate-500 font-medium">Weekly Study Structure applies to all lessons.</p>
                             </div>
                             <div className="hidden sm:flex flex-col items-end">
                                 <span className="text-2xl font-black text-purple-600">{trimester.progress}%</span>
                                 <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</span>
                             </div>
                          </div>

                          <div className="space-y-4">
                             {trimester.subjects.map((subject, index) => (
                                <div 
                                  key={subject.id} 
                                  onClick={() => !subject.isLocked && setSelectedSubject(subject)}
                                  className={`p-6 rounded-2xl border-2 transition-all ${subject.isLocked ? "bg-slate-50 border-transparent" : "bg-white border-slate-100 hover:border-purple-200 cursor-pointer shadow-sm hover:shadow-md"}`}
                                >
                                   <div className="flex flex-col sm:flex-row gap-6">
                                      
                                      {/* Subject Info */}
                                      <div className="flex-1">
                                         <div className="flex items-center gap-3 mb-3">
                                            <div className={`size-8 rounded-full flex items-center justify-center font-black text-sm ${subject.isLocked ? "bg-slate-200 text-slate-500" : subject.completedLessons === subject.totalLessons ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"}`}>
                                               {subject.isLocked ? <Lock size={14} /> : (subject.completedLessons === subject.totalLessons ? <CheckCircle size={14} /> : index + 1)}
                                            </div>
                                            <h4 className={`text-xl font-black ${subject.isLocked ? "text-slate-500" : "text-slate-900"}`}>
                                               {subject.title}
                                            </h4>
                                         </div>
                                         <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-lg mb-4">
                                            Weekly Structure: 40-Min Pre-Recorded Teaching • Downloadable Manual (PDF) • Scripture Meditation Assignment.
                                         </p>
                                         
                                         {/* Embedded Progress if not locked */}
                                         {!subject.isLocked && (
                                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                               <span>{subject.completedLessons}/{subject.totalLessons} Lessons Watched</span>
                                            </div>
                                         )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center sm:justify-end shrink-0">
                                         {!subject.isLocked ? (
                                            <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                                               <PlayCircle size={18} />
                                               Open Subject
                                            </button>
                                         ) : (
                                            <button disabled className="px-6 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl flex items-center gap-2 cursor-not-allowed">
                                               <Lock size={18} />
                                               Locked
                                            </button>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                          
                          <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                             <div>
                                <h4 className="text-lg font-black text-amber-900 mb-1">Exams Page</h4>
                                <p className="text-sm text-amber-700 font-medium">Separate locked page. Can only be opened with the teacher's permission. Submitted directly to our email.</p>
                             </div>
                             <button disabled className="shrink-0 px-6 py-3 bg-white border-2 border-amber-200 text-amber-700 font-bold rounded-xl cursor-not-allowed flex items-center gap-2">
                                <Lock size={18} />
                                Pending Permission
                             </button>
                          </div>

                       </motion.div>
                    ))}
                 </AnimatePresence>
             </div>
             
          </div>

        </div>
      </main>

      {/* Subject Modal */}
      <AnimatePresence>
        {selectedSubject && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-12">
            {/* Backdrop */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
               onClick={closeSubjectModal}
            />

            {/* Modal Content */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ type: "spring", bounce: 0.4 }}
               className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
               {/* Header */}
               <div className="p-6 md:p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                  <div>
                     <div className="flex flex-wrap items-center gap-3 mb-3 pr-4">
                        <div className="size-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0">
                           <PlayCircle size={20} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900">{selectedSubject.title}</h2>
                     </div>
                     <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500">
                        <span>{selectedSubject.completedLessons} / {selectedSubject.totalLessons} Lessons Completed</span>
                        <span className="hidden md:block size-1.5 rounded-full bg-slate-300" />
                        <span className="text-purple-600">Weekly Study Structure</span>
                     </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); closeSubjectModal(); }}
                    className="p-3 bg-white hover:bg-slate-100 text-slate-500 rounded-full transition-colors shadow-sm border border-slate-200 shrink-0"
                  >
                     <X size={24} />
                  </button>
               </div>

               {/* Body (scrollable) */}
               <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     
                     {/* Left - Video Placeholder */}
                     <div className="lg:col-span-2 space-y-6">
                        <div className="w-full aspect-video bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-white relative overflow-hidden group shadow-lg">
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                           <div className="relative z-10 flex flex-col items-center gap-4">
                              <button className="size-20 rounded-full bg-purple-600/90 text-white flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all shadow-xl shadow-purple-900/50 backdrop-blur-md">
                                 <PlayCircle size={40} className="ml-1" />
                              </button>
                              <div className="text-center mt-2 px-4">
                                 <h3 className="font-bold text-lg mb-1">
                                    Next Up: Lesson {selectedSubject.completedLessons < selectedSubject.totalLessons ? selectedSubject.completedLessons + 1 : selectedSubject.totalLessons}
                                 </h3>
                                 <p className="text-sm text-slate-300">40-Minute Pre-Recorded Teaching</p>
                              </div>
                           </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                           <div className="text-center sm:text-left">
                              <h4 className="font-bold text-slate-900 mb-1">Scripture Meditation Assignment</h4>
                              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">Read and meditate on this week's verses prior to viewing the session.</p>
                           </div>
                           <button className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 font-bold rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50 transition-all text-sm shrink-0 shadow-sm">
                              View Verses
                           </button>
                        </div>
                     </div>

                     {/* Right - Sidebar Assets & Email / Progress */}
                     <div className="space-y-8 lg:border-l lg:border-slate-100 lg:pl-8">
                        <div>
                           <h4 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs">Learning Assets</h4>
                           <a href="#" className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                              <div className="size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                 <FileText size={20} />
                              </div>
                              <div className="flex-1">
                                 <h5 className="font-bold text-sm text-slate-900 leading-tight">Downloadable Manual</h5>
                                 <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">PDF / Word</p>
                              </div>
                              <Download size={16} className="text-slate-400 group-hover:text-purple-600 shrink-0" />
                           </a>
                        </div>

                         <div>
                           <h4 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs">Need Help?</h4>
                           <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100/50 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500"><Mail size={80} /></div>
                              <h5 className="font-bold text-blue-900 mb-2 relative z-10">Ask a Question</h5>
                              
                              <AnimatePresence mode="wait">
                                {!isAskingQuestion ? (
                                  <motion.div
                                    key="ask-button"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                  >
                                    <p className="text-sm font-medium text-blue-700/80 mb-6 relative z-10 leading-relaxed">
                                      Submit questions directly to your instructor or admin via email.
                                    </p>
                                    <button 
                                      onClick={() => setIsAskingQuestion(true)} 
                                      className="inline-flex w-full items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors relative z-10 shadow-lg shadow-blue-600/20 active:scale-95"
                                    >
                                      <Mail size={16} />
                                      Email Instructor
                                    </button>
                                  </motion.div>
                                ) : isQuestionSent ? (
                                  <motion.div
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-4 text-center space-y-3"
                                  >
                                    <div className="size-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                                       <CheckCircle size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-green-700">Message sent successfully!</p>
                                    <p className="text-xs text-green-600 font-medium leading-relaxed">
                                       The IBI administrative team will get back to you by email shortly.
                                    </p>
                                  </motion.div>
                                ) : (
                                  <motion.form
                                    key="question-form"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleSendQuestion}
                                    className="space-y-4 relative z-10"
                                  >
                                    <textarea
                                      required
                                      autoFocus
                                      value={questionText}
                                      onChange={(e) => setQuestionText(e.target.value)}
                                      placeholder="Type your question here..."
                                      className="w-full p-4 bg-white border border-blue-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[120px] resize-none text-slate-900"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setIsAskingQuestion(false)}
                                        className="flex-1 px-4 py-3 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={isSendingQuestion || !questionText.trim()}
                                        className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                      >
                                        {isSendingQuestion ? (
                                          <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                          <Mail size={16} />
                                        )}
                                        {isSendingQuestion ? "Sending..." : "Send Message"}
                                      </button>
                                    </div>
                                  </motion.form>
                                )}
                              </AnimatePresence>
                           </div>
                        </div>

                        {/* Progress */}
                        <div>
                           <div className="flex justify-between items-end mb-3">
                               <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Your Progress</span>
                               <span className="text-xs text-purple-600 font-black">{Math.round((selectedSubject.completedLessons / selectedSubject.totalLessons) * 100)}%</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50 shadow-inner">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${(selectedSubject.completedLessons / selectedSubject.totalLessons) * 100}%` }}
                                 transition={{ duration: 1, ease: "easeOut" }}
                                 className="bg-purple-600 h-full rounded-full"
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardClient;
