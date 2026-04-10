"use client";


import { 
  Trophy, 
  Award, 
  Download, 
  Share2, 
  ShieldCheck, 
  Lock, 
  GraduationCap
} from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

const mockCertificates = [
  {
    id: 1,
    title: "Foundations of Faith",
    type: "Quarterly Achievement",
    date: "Dec 2023",
    isEarned: true,
    credentialId: "IBI-9982-K1",
    score: "A+"
  },
  {
    id: 2,
    title: "Leadership in Ministry",
    type: "Quarterly Achievement",
    date: "March 2024",
    isEarned: false,
    credentialId: null,
    score: null
  },
  {
    id: 3,
    title: "Global Evangelism",
    type: "Quarterly Achievement",
    date: null,
    isEarned: false,
    credentialId: null,
    score: null
  },
  {
    id: 4,
    title: "Master of Divinity (Basic)",
    type: "Program Diploma",
    date: null,
    isEarned: false,
    credentialId: null,
    score: null
  }
];

const CertificatesPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      <StudentSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Header */}
            <header className="animate-in slide-in-from-left duration-700">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Qualifications</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                 My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Certificates</span>
               </h1>
               <p className="text-gray-400 font-medium max-w-xl text-sm leading-relaxed">
                 Build your verified portfolio of academic and spiritual accomplishments. 
                 Earned certificates can be downloaded and shared globally.
               </p>
            </header>

            {/* Achievement Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000 slide-in-from-bottom-5">
               <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white overflow-hidden relative group">
                  <Trophy size={48} className="text-purple-400 mb-6 opacity-40 rotate-12 group-hover:rotate-0 transition-transform" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Qualifications</p>
                  <p className="text-4xl font-black mb-1">1</p>
                  <p className="text-xs font-medium text-gray-400">Earned Credentials</p>
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
               </div>
               <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group">
                  <Award size={48} className="text-gray-200 mb-6 group-hover:text-amber-500 transition-colors" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Academic GPA</p>
                  <p className="text-4xl font-black mb-1 text-gray-900">4.0</p>
                  <p className="text-xs font-medium text-gray-400">Current Grade Average</p>
               </div>
               <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group">
                  <ShieldCheck size={48} className="text-gray-200 mb-6 group-hover:text-emerald-500 transition-colors" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Verification</p>
                  <p className="text-4xl font-black mb-1 text-gray-900">Active</p>
                  <p className="text-xs font-medium text-gray-400">Authenticated Records</p>
               </div>
            </div>

            {/* Certificates List */}
            <div className="space-y-6 animate-in fade-in duration-1000 delay-300 pb-20">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Official Documents</h3>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">Last updated Dec 2023</span>
               </div>
               
               {mockCertificates.map((cert) => (
                 <div 
                   key={cert.id}
                   className={`group p-8 md:p-10 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-8 ${
                     cert.isEarned 
                     ? "bg-white border-gray-50 hover:border-purple-600 shadow-sm hover:shadow-2xl hover:shadow-purple-50" 
                     : "bg-gray-50/50 border-gray-100/50 opacity-60"
                   }`}
                 >
                    <div className="flex items-center gap-8 text-center md:text-left flex-col md:flex-row">
                       <div className={`w-24 h-24 rounded-3xl flex items-center justify-center relative overflow-hidden ${cert.isEarned ? "bg-gray-900 text-white shadow-xl shadow-gray-200" : "bg-white text-gray-200 shadow-inner"}`}>
                          {cert.isEarned ? <GraduationCap size={40} className="relative z-10" /> : <Lock size={32} className="relative z-10" />}
                          {cert.isEarned && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent" />
                          )}
                       </div>
                       <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${cert.isEarned ? "text-purple-600" : "text-gray-400"}`}>
                             {cert.type}
                          </p>
                          <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{cert.title}</h4>
                          {cert.isEarned && (
                            <div className="flex items-center gap-6 mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                               <span>ID: {cert.credentialId}</span>
                               <span className="w-1 h-1 rounded-full bg-gray-200" />
                               <span>Issued {cert.date}</span>
                               <span className="w-1 h-1 rounded-full bg-gray-200" />
                               <span className="text-emerald-500">Grade: {cert.score}</span>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-4">
                       {cert.isEarned ? (
                          <>
                            <button className="p-5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-purple-600 hover:border-purple-100 hover:shadow-lg transition-all active:scale-95" title="Share Credential">
                               <Share2 size={20} />
                            </button>
                            <button className="flex items-center gap-3 px-8 py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-purple-600 transition-all active:scale-95 transform">
                               <Download size={18} />
                               Download PDF
                            </button>
                          </>
                       ) : (
                          <div className="px-8 py-5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-300 text-[10px] font-black uppercase tracking-widest">
                             Requirement Pending
                          </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default CertificatesPage;
