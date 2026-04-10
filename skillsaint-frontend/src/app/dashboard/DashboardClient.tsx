"use client";

import { 
  CheckCircle2, 
  Lock, 
  FileText, 
  PlayCircle, 
  Download, 
  X, 
  Clock, 
  Play,
  Send,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { activateAccount } from "@/lib/data";

interface EnrolledCourse {
  id: number;
  fullname: string;
  image_url?: string;
  summary?: string;
}

interface DashboardData {
  courses: EnrolledCourse[];
  plan: string;
  exams?: Array<{ id: number; name: string; courseid: number; timeLimit: number; }>;
}

interface Subject {
  id: number;
  title: string;
  name: string;
  image: string;
  status: string;
  progress: number;
  manual: string;
  summary?: string;
  instructor: string;
}

const DashboardClient = ({ initialData, userEmail, isActivated: serverIsActivated }: { initialData: DashboardData, userEmail: string, isActivated: boolean }) => {
  const [activeTrimester, setActiveTrimester] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showActivationWall, setShowActivationWall] = useState(!serverIsActivated);
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState("");

  // Use real data or fallbacks
  const enrolledCourses = initialData?.courses || [];
  const userPlan = initialData?.plan || "none";
  const isExecutive = userPlan === "executive";

  // Map courses to trimesters 
  // For now, we put everything in Trimester 1 as a list of enrolled subjects.
  // Real logic would be based on course categories or manual mapping.
  const roadmap = [
    {
      id: 1,
      title: "Active Studies",
      subtitle: "Current Enrollment",
      status: "Active",
      progress: enrolledCourses.length > 0 ? 35 : 0,
      subjects: enrolledCourses.map((c: EnrolledCourse) => ({
        id: c.id,
        title: c.fullname,
        name: c.fullname,
        image: c.image_url || "/images/course/course-1.png",
        status: "Resume",
        progress: 12, // Mock progress, should come from Moodle gradebook later
        manual: "Course_Guide.pdf",
        summary: c.summary,
        instructor: "IBI Global Team"
      }))
    },
    {
       id: 2,
       title: "Next Phase",
       subtitle: "Spiritual Identity",
       status: isExecutive ? "Unlocked" : "Locked",
       progress: 0,
       subjects: []
    },
    {
       id: 3,
       title: "Ministry",
       subtitle: "Service & Leadership",
       status: "Locked",
       progress: 0,
       subjects: []
    },
    {
       id: 4,
       title: "Impact",
       subtitle: "Global Kingdom Reach",
       status: "Locked",
       progress: 0,
       subjects: []
    }
  ];

  useEffect(() => {
    // Check local bypass for dev/test
    const localBypass = localStorage.getItem('ibi_dev_activated');
    if (localBypass === 'true') {
      setShowActivationWall(false);
    }
  }, []);

  const handleActivate = async () => {
    if (!activationCode) return;
    setIsActivating(true);
    setActivationError("");

    // Special bypass for testing
    if (activationCode === "0000") {
      localStorage.setItem('ibi_dev_activated', 'true');
      setShowActivationWall(false);
      await activateAccount(userEmail, activationCode);
      window.location.reload();
      return;
    }

    try {
      const result = await activateAccount(userEmail, activationCode);
      if (result.status === "success" ) {
        setShowActivationWall(false);
        window.location.reload(); // Refresh to get all data
      } else {
        setActivationError(result.message || "Invalid code");
      }
    } catch {
      setActivationError("Error activating account");
    } finally {
      setIsActivating(false);
    }
  };

  const currentTrimester = roadmap.find(t => t.id === activeTrimester);

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative selection:bg-purple-100 selection:text-purple-900">
      <StudentSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-14">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Real Data Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-in slide-in-from-left duration-700">
               <div>
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-1 rounded-full bg-purple-600" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Student Portal</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-4">
                    Welcome back, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                       Scholar.
                    </span>
                  </h1>
                  <p className="text-gray-400 font-medium max-w-xl text-sm leading-relaxed">
                    You are currently on the <span className="text-gray-900 font-bold uppercase tracking-widest">{userPlan}</span> {isExecutive ? "Full Access" : "Standard"} enrollment.
                    Your academic journey is synchronized with IBI Global standards.
                  </p>
               </div>

               <div className="flex items-center gap-10">
                  <div className="text-left">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Courses</p>
                     <p className="text-4xl font-black text-gray-900">{enrolledCourses.length}</p>
                  </div>
                  <div className="h-10 w-px bg-gray-100 hidden sm:block" />
                  <div className="text-left">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                     <p className="text-4xl font-black text-emerald-500">{serverIsActivated ? "Active" : "Pending"}</p>
                  </div>
               </div>
            </header>

            {/* Trimester Roadmap */}
            <nav className="flex flex-wrap items-center gap-4 animate-in fade-in duration-1000 slide-in-from-bottom-5">
               {roadmap.map((trimester) => (
                 <button 
                  key={trimester.id}
                  onClick={() => setActiveTrimester(trimester.id)}
                  className={`relative px-8 py-5 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
                    activeTrimester === trimester.id 
                    ? "bg-gray-900 border-gray-900 text-white shadow-2xl shadow-gray-200 -translate-y-1 scale-105 z-10" 
                    : "bg-white border-gray-50 text-gray-400 hover:border-gray-200"
                  }`}
                 >
                    <div className="relative z-10 flex items-center gap-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${activeTrimester === trimester.id ? "text-purple-400" : "text-gray-400"}`}>
                        0{trimester.id}
                       </span>
                       <div className="text-left">
                          <p className="text-sm font-black tracking-tight">{trimester.title}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${activeTrimester === trimester.id ? "text-white" : ""}`}>
                            {trimester.subtitle}
                          </p>
                       </div>
                       {trimester.status === "Locked" && <Lock size={12} className="opacity-40" />}
                    </div>
                    {activeTrimester === trimester.id && (
                       <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/20 rounded-full blur-2xl -mr-12 -mt-12" />
                    )}
                 </button>
               ))}
            </nav>

            {/* Subjects Grid */}
            <section className="animate-in fade-in duration-1000 delay-200 pb-20">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {currentTrimester?.subjects && currentTrimester.subjects.length > 0 ? (
                    currentTrimester.subjects.map((subject: Subject) => (
                      <div 
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject)}
                        className="group relative bg-white border border-gray-100 rounded-[3rem] p-4 pb-8 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-50 hover:-translate-y-2 cursor-pointer overflow-hidden"
                      >
                         <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden mb-8">
                            <Image 
                              src={subject.image} 
                              alt={subject.title} 
                              fill 
                              className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-4 left-4 right-4">
                               <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                                     {subject.status}
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="px-4">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-2 group-hover:text-purple-600 transition-colors">
                               {subject.title}
                            </h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Moodle Course #{subject.id}</p>
                            
                            <div className="space-y-4">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  <span>Curriculum Progress</span>
                                  <span className="text-gray-900">{subject.progress}%</span>
                               </div>
                               <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gray-900 rounded-full transition-all duration-1000" 
                                    style={{ width: `${subject.progress}%` }} 
                                  />
                               </div>
                            </div>
                         </div>

                         {/* Background decoration */}
                         <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-100/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-24 bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                       <Lock className="text-gray-200 mb-6" size={56} />
                       <h4 className="text-xl font-black text-gray-400 uppercase tracking-widest">Enrollment Required</h4>
                       <p className="text-sm text-gray-400 mt-2 max-w-sm px-6">
                         This phase is currently locked. Complete your current course load or contact support to modify your learning path.
                       </p>
                    </div>
                  )}
               </div>
            </section>
          </div>
        </div>
      </main>

      {/* Activation Wall Overlay */}
      <AnimatePresence>
        {showActivationWall && (
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-[20px] flex items-center justify-center p-6 overflow-y-auto"
           >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[4rem] p-10 md:p-16 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden"
              >
                 <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50" />
                 <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />

                 <div className="relative z-10">
                    <div className="w-24 h-24 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-gray-200">
                       <ShieldCheck size={40} />
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-6">
                       Account <br />
                       <span className="text-purple-600">Verification</span>
                    </h2>
                    
                    <p className="text-gray-400 font-medium mb-10 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                       To protect our community and your academic records, please enter the unique 16-character code provided by your International Bible Institute administrator.
                    </p>

                    <div className="max-w-md mx-auto space-y-4">
                       <div className="group relative">
                          <input 
                            type="text" 
                            placeholder="IBI-XXXX-XXXX-XXXX"
                            value={activationCode}
                            onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                            className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-center text-lg font-black tracking-[0.3em] uppercase transition-all focus:bg-white focus:border-purple-600 outline-none"
                          />
                          <div className="absolute inset-0 rounded-[2rem] border-2 border-gray-900 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                       </div>
                       
                       {activationError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{activationError}</p>}
                       
                       <button 
                        onClick={handleActivate}
                        disabled={isActivating}
                        className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gray-200 transition-all hover:bg-purple-600 hover:shadow-purple-100 active:scale-95 disabled:opacity-50"
                       >
                          {isActivating ? "Verifying..." : "Validate Access"}
                       </button>
                    </div>

                    <p className="mt-12 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      Problems? contact admin@ibi-edu.com
                    </p>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Subject Modal (Viewer) */}
      <AnimatePresence>
         {selectedSubject && (
           <SubjectModal subject={selectedSubject} onClose={() => setSelectedSubject(null)} />
         )}
      </AnimatePresence>
    </div>
  );
};

const SubjectModal = ({ subject, onClose }: { subject: Subject; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("video");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingMessage(true);
    setTimeout(() => {
      setIsSendingMessage(false);
      setMessageSent(true);
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-gray-900/80 backdrop-blur-xl flex items-center justify-center p-6"
    >
       <motion.div 
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[4rem] w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-white/20"
       >
          {/* Left Side: Content Viewer */}
          <div className="flex-1 bg-gray-900 p-8 flex flex-col relative overflow-hidden">
             <div className="relative z-10 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-purple-400">
                      <PlayCircle size={24} />
                   </div>
                   <div>
                      <h3 className="text-white font-black uppercase tracking-widest text-xs">{subject.title}</h3>
                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">Module 01: Kingdom Authority</p>
                   </div>
                </div>
                <button onClick={onClose} className="p-4 bg-white/10 text-white rounded-2xl transition-all hover:bg-white hover:text-gray-900">
                   <X size={20} />
                </button>
             </div>

             <div className="flex-1 rounded-[3rem] bg-black border border-white/5 relative flex items-center justify-center shadow-inner group cursor-pointer overflow-hidden">
                <Image src={subject.image} alt="subject" fill className="object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center gap-6">
                   <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all group-hover:scale-110 group-hover:bg-purple-600">
                      <Play size={32} />
                   </div>
                   <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Initialize Media Pipeline</p>
                </div>
                
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-1 px-10">
                   {[40, 70, 45, 90, 65, 80, 50, 85, 40, 100, 60].map((h, i) => (
                      <div key={i} className="w-1 bg-white/20 rounded-full" style={{ height: `${h * 0.4}px` }} />
                   ))}
                </div>
             </div>

             <div className="mt-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-3">
                      <Clock size={16} className="text-purple-400" />
                      <span className="text-[10px] font-black tracking-widest uppercase">42:15 Remaining</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-[10px] font-black tracking-widest uppercase">Auto-Save Active</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Quality:</span>
                   <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full">4K ULTRA</span>
                </div>
             </div>
          </div>

          {/* Right Side: Resources & Contact */}
          <div className="w-full lg:w-96 bg-white border-l border-gray-50 p-10 flex flex-col">
             <nav className="flex items-center gap-6 mb-10 border-b border-gray-50 pb-6">
                <button 
                  onClick={() => setActiveTab("video")} 
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === "video" ? "text-purple-600" : "text-gray-400"}`}
                >
                  Resources
                </button>
                <button 
                  onClick={() => setActiveTab("advisor")} 
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === "advisor" ? "text-purple-600" : "text-gray-400"}`}
                >
                  Inquiry
                </button>
             </nav>

             <div className="flex-1 overflow-y-auto">
                {activeTab === "video" ? (
                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Study Materials</h4>
                         <button className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-purple-200 hover:bg-white transition-all group text-left">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-sm">
                                  <FileText size={18} />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-gray-900 group-hover:text-purple-600 transition-colors">Course Manual</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase">PDF • 4.2 MB</p>
                               </div>
                            </div>
                            <Download size={16} className="text-gray-300 group-hover:text-purple-400 transition-transform" />
                         </button>
                      </div>

                      <div className="p-8 bg-purple-50 rounded-[2.5rem]">
                         <HelpCircle className="text-purple-600 mb-4" size={24} />
                         <h5 className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-2">Subject Summary</h5>
                         <p className="text-xs text-purple-900/70 leading-relaxed font-medium line-clamp-6">
                            {subject.summary || "No description provided for this module."}
                         </p>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-6">
                      <div className="text-left mb-6">
                         <h4 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-2">Direct Inquiry</h4>
                         <p className="text-xs font-medium text-gray-400">Response time within 24 hours.</p>
                      </div>
                      
                      {messageSent ? (
                        <div className="py-10 text-center animate-in zoom-in duration-500">
                           <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 size={32} />
                           </div>
                           <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Message Sent</h5>
                           <p className="text-xs text-gray-400 leading-relaxed">An advisor will review your query and respond via email.</p>
                           <button onClick={() => setMessageSent(false)} className="mt-8 text-[10px] font-black text-purple-600 uppercase tracking-widest">Send another</button>
                        </div>
                      ) : (
                        <form onSubmit={handleSendMessage} className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Question</label>
                              <textarea 
                                required
                                className="w-full p-6 bg-gray-50 rounded-3xl border-2 border-transparent focus:border-purple-600 focus:bg-white text-sm font-medium outline-none transition-all resize-none h-48"
                                placeholder="State your inquiry clearly..."
                              />
                           </div>
                           <button 
                            disabled={isSendingMessage}
                            className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-gray-200 hover:bg-purple-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                              {isSendingMessage ? "Dispatching..." : (
                                <>
                                  <Send size={16} />
                                  Transmit
                                </>
                              )}
                           </button>
                        </form>
                      )}
                   </div>
                )}
             </div>

             <div className="mt-10 pt-8 border-t border-gray-50 italic">
                <p className="text-[9px] font-medium text-gray-300">
                   Authenticated Academic Resources • © 2024 International Bible Institute
                </p>
             </div>
          </div>
       </motion.div>
    </motion.div>
  );
};

export default DashboardClient;
