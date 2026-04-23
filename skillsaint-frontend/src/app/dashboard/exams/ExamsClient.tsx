/* eslint-disable */
"use client";

import { 
  Lock, 
  FileText, 
  Clock, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2,
  Trophy,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface Exam {
  id: number;
  courseid: number;
  name: string;
  timeLimit: number;
  intro: string;
  questioncount?: number;
}

interface ExamResult {
  id: number;
  quizid: number;
  score: number;
  attempt: number;
  date: number;
}

const ExamsClient = ({ initialExams, results = [] }: { initialExams: Exam[], results?: ExamResult[] }) => {
  return (
    <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-14">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="animate-in fade-in duration-500">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-all bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-x-1">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
        
        {/* Header */}
        <header className="animate-in slide-in-from-left duration-700 -mt-4">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-1 rounded-full bg-purple-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Academic Assessment</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
             My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Assessments</span>
           </h1>
           <p className="text-gray-400 font-medium max-w-xl text-sm leading-relaxed">
             Real-time examination portal synchronized with your current enrollments.
             <br /><span className="text-purple-600 font-bold uppercase text-[10px] tracking-widest mt-2 block">Ensure all modules are completed before attempting finals.</span>
           </p>
        </header>

        {/* Overall Guidelines Card */}
        <section className="bg-gray-50 rounded-[4rem] p-8 md:p-12 border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-10 animate-in fade-in duration-1000 slide-in-from-bottom-5">
           <div className="flex-1 space-y-6">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                 <AlertCircle className="text-purple-600" size={28} />
                 Exam Protocol
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   "Single-sitting completion required.",
                   "Passing score threshold: 70%.",
                   "Official GBI Board verification.",
                   "Secure browser monitoring active."
                 ].map((text, i) => (
                   <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                         <CheckCircle2 size={12} />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{text}</p>
                   </li>
                 ))}
              </ul>
           </div>
           <div className="w-full lg:w-80 bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-100 border border-gray-100 text-center relative overflow-hidden">
              <Trophy size={48} className="mx-auto text-purple-600 mb-6 relative z-10" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 relative z-10">Real-time status</p>
              <p className="text-4xl font-black text-gray-900 relative z-10">
                 {initialExams.length} <span className="text-sm text-gray-300 uppercase">Available</span>
              </p>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-50" />
           </div>
        </section>

        {/* Exam Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-1000 delay-300 pb-20">
           {initialExams.length > 0 ? (
             initialExams.map((exam) => {
               const qCount = exam.questioncount || 0;
               const estimatedMinutes = qCount > 0 ? qCount * 2 : 0;
               
               return (
                 <div 
                   key={exam.id}
                   className="group relative p-10 rounded-[4rem] border-2 border-gray-50 bg-white hover:border-purple-600 shadow-sm hover:shadow-2xl hover:shadow-purple-50 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden"
                 >
                   <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-10">
                         <div className="w-16 h-16 bg-gray-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-gray-200 group-hover:bg-purple-600 group-hover:scale-110 transition-all">
                            <FileText size={28} />
                         </div>
                         <span className="px-5 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            Ready
                         </span>
                      </div>

                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none mb-3 group-hover:text-purple-600 transition-colors">
                        {exam.name}
                      </h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10"> Quiz #{exam.id}</p>

                      <div className="grid grid-cols-2 gap-6 mb-12">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                               <Clock size={16} />
                            </div>
                            <span className="text-xs font-black text-gray-500 uppercase tracking-tight">
                              {exam.timeLimit > 0 
                                ? `${Math.floor(exam.timeLimit / 60)} Min` 
                                : estimatedMinutes > 0 
                                  ? `~${estimatedMinutes} Min`
                                  : "Unlimited"}
                            </span>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                               <HelpCircle size={16} />
                            </div>
                            <span className="text-xs font-black text-gray-500 uppercase tracking-tight">
                              {qCount > 0 ? `${qCount} Questions` : "Standard Format"}
                            </span>
                         </div>
                      </div>

                      {/* Attempt History */}
                      {results.filter(r => r.quizid === exam.id).length > 0 && (
                        <div className="mb-10 space-y-3">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <Trophy size={12} className="text-purple-600" />
                             Attempt History ({results.filter(r => r.quizid === exam.id).length})
                           </p>
                           <div className="flex flex-wrap gap-2">
                              {results.filter(r => r.quizid === exam.id).slice(0, 3).map((res, i) => (
                                <div key={res.id} className={`px-3 py-1.5 rounded-xl border text-[10px] font-black ${res.score >= 70 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                   #{res.attempt}: {Math.round(res.score)}%
                                </div>
                              ))}
                              {results.filter(r => r.quizid === exam.id).length > 3 && (
                                <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 text-[10px] font-black">
                                   +{results.filter(r => r.quizid === exam.id).length - 3} more
                                </div>
                              )}
                           </div>
                        </div>
                      )}

                      <div className="mt-auto">
                         <Link href={`/exam?quizId=${exam.id}`} className="w-full">
                           <button className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 group-hover:bg-purple-600 transition-all shadow-xl shadow-gray-200 group-hover:shadow-purple-300">
                             Start Certification
                             <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                           </button>
                         </Link>
                      </div>
                   </div>

                   {/* Background decoration */}
                   <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-purple-100/30 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               );
             })
           ) : (
             <div className="col-span-full py-24 bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                <Lock className="text-gray-200 mb-8" size={64} />
                <h4 className="text-2xl font-black text-gray-400 uppercase tracking-[0.2em]">No Active Exams</h4>
                <p className="text-sm text-gray-400 mt-4 max-w-md px-8">
                  Assessments are automatically unlocked as you progress through your enrolled courses. 
                  Check your dashboard for course progress.
                </p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ExamsClient;
