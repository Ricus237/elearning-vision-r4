"use client";

import { useEffect, useState } from "react";
import { 
  PlayCircle, 
  FileText, 
  X, 
  Send, 
  CheckCircle2, 
  HelpCircle,
  ChevronLeft,
  BookOpen
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { sendInquiryAction } from "@/lib/actions";

interface MoodleModule {
  id: number;
  name: string;
  modname: string;
  description?: string;
  contents?: Array<{
    fileurl: string;
    filename: string;
    mimetype?: string;
  }>;
}

interface MoodleSection {
  id: number;
  name: string;
  summary: string;
  modules: MoodleModule[];
}

export default function CoursePageClient({
  courseId,
  courseTitle,
  moodleToken,
}: {
  courseId: number;
  courseTitle: string;
  moodleToken: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("curriculum");
  const [sections, setSections] = useState<MoodleSection[]>([]);
  const [activeModule, setActiveModule] = useState<MoodleModule | null>(null);
  const [moduleContent, setModuleContent] = useState<string>("");
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const response = await fetch("/api/moodle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ function: "core_course_get_contents", params: { courseid: courseId } }),
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          const filteredData = data
            .map((section: MoodleSection) => ({
              ...section,
              modules: section.modules.filter(
                (mod) => mod.modname !== "forum" && mod.modname !== "quiz"
              ),
            }))
            .filter((section) => section.modules.length > 0);

          setSections(filteredData);
          const firstSection = filteredData.find((s) => s.modules && s.modules.length > 0);
          if (firstSection) setActiveModule(firstSection.modules[0]);
        }
      } catch (err) {
        console.error("Failed to fetch course content:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContents();
  }, [courseId]);

  useEffect(() => {
    if (!activeModule) return;
    const fetchModuleContent = async () => {
      setIsModuleLoading(true);
      try {
        const response = await fetch("/api/moodle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            function: "local_skillsaint_get_module_content",
            params: { cmid: activeModule.id },
          }),
        });
        const data = await response.json();
        if (data && data.content !== undefined) {
          setModuleContent(data.content);
        } else {
          setModuleContent(activeModule.description || "");
        }
      } catch (err) {
        console.error("Failed to fetch module content:", err);
        setModuleContent(activeModule.description || "");
      } finally {
        setIsModuleLoading(false);
      }
    };
    fetchModuleContent();
  }, [activeModule]);

  const processHtml = (html: string) => {
    if (!html) return "";
    const moodleFileRegex = /src="([^"]+pluginfile\.php\/[^"]+)"/g;
    return html.replace(moodleFileRegex, (match, url) => {
      let finalUrl = url;
      if (url.includes("pluginfile.php") && !url.includes("webservice/pluginfile.php")) {
        finalUrl = url.replace("pluginfile.php", "webservice/pluginfile.php");
      }
      const separator = finalUrl.includes("?") ? "&" : "?";
      if (finalUrl.includes("token=")) return `src="${finalUrl}"`;
      return `src="${finalUrl}${separator}token=${moodleToken}&forcedownload=0"`;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const result = await sendInquiryAction({
        courseid: courseId,
        subject: `Question regarding ${courseTitle}`,
        message: inquiryMessage,
      });
      if (result.success) {
        setMessageSent(true);
        setInquiryMessage("");
      } else {
        alert(result.error || "Failed to transmit inquiry.");
      }
    } catch (err) {
      console.error(err);
      alert("Error transmitting inquiry.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col lg:flex-row overflow-hidden selection:bg-purple-100 selection:text-purple-900">
      
      {/* Sidebar: Curriculum */}
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden sticky top-0 shadow-sm z-30">
        <div className="p-8 border-b border-gray-100 bg-white">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-600 transition-colors mb-6"
          >
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1 leading-tight">
            {courseTitle}
          </h3>
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
            Course Explorer
          </p>
        </div>

        <nav className="flex items-center gap-6 px-8 py-4 bg-white border-b border-gray-50">
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${activeTab === "curriculum" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Modules
          </button>
          <button
            onClick={() => setActiveTab("advisor")}
            className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${activeTab === "advisor" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Inquiry
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === "curriculum" ? (
            <div className="space-y-8">
              {sections.length > 0 ? sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                     {section.name || `Section ${sIdx + 1}`}
                  </h4>
                  <div className="space-y-1">
                    {section.modules.map((mod, mIdx) => (
                      <button
                        key={mIdx}
                        onClick={() => setActiveModule(mod)}
                        className={`w-full flex items-start gap-4 p-3 rounded-xl transition-all text-left group ${
                          activeModule?.id === mod.id
                            ? "bg-purple-600 text-white shadow-md shadow-purple-100"
                            : "hover:bg-purple-50 text-gray-600"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${activeModule?.id === mod.id ? "text-white" : "text-purple-400 group-hover:text-purple-600"}`}>
                          {mod.modname === "video" ? <PlayCircle size={14} /> : <FileText size={14} />}
                        </div>
                        <span className={`text-[11px] font-black uppercase leading-snug ${activeModule?.id === mod.id ? "text-white" : "text-gray-700 group-hover:text-purple-700"}`}>
                          {mod.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-gray-300">
                  <BookOpen size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] uppercase font-black tracking-widest">No modules</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-left mb-6 px-2">
                <h4 className="text-base font-black text-gray-900 tracking-tight mb-2">Direct Inquiry</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Help is on the way</p>
              </div>

              {messageSent ? (
                <div className="py-10 text-center bg-white rounded-3xl border border-emerald-100 animate-in zoom-in duration-500">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={24} />
                  </div>
                  <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2">Message Sent</h5>
                  <button onClick={() => setMessageSent(false)} className="text-[9px] font-black text-purple-600 underline uppercase tracking-widest">
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    required
                    className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 focus:border-purple-600 focus:bg-white text-xs font-medium outline-none transition-all resize-none h-40 shadow-sm"
                    placeholder="Ask our team anything..."
                  />
                  <button
                    disabled={isSendingMessage}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingMessage ? "Sending..." : (<><Send size={12} /> Send Message</>)}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Viewer */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f0f2f5]">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-xl border-b border-gray-200/50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-purple-600">
              {activeModule?.modname === "video" ? <PlayCircle size={20} /> : <FileText size={20} />}
            </div>
            <div className="max-w-[150px] md:max-w-md">
              <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.2em] mb-0.5">Academic Session</p>
              <h3 className="text-gray-900 font-black uppercase tracking-widest text-xs truncate">
                {activeModule?.name || "Initializing..."}
              </h3>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 border border-gray-100 rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Syncing Assets...</p>
            </div>
          ) : activeModule ? (
            <div className="p-6 md:p-12 lg:p-16 max-w-5xl mx-auto">
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl shadow-gray-200/50 border border-white"
              >
                <div className="mb-12">
                  <div className="h-1.5 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-8 shadow-lg shadow-purple-100" />
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-6">
                    {activeModule.name}
                  </h1>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Module Detail & Resources</p>
                </div>

                {isModuleLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-50 rounded-[3rem] bg-slate-50/30">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Reconstructing content...</p>
                  </div>
                ) : (
                  <div
                    className="text-gray-600 leading-relaxed font-medium space-y-8 moodle-content site-content-render prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processHtml(moduleContent || activeModule.description || "") }}
                  />
                )}

                {/* Assets Section */}
                {activeModule.contents && activeModule.contents.length > 0 && (
                  <div className="mt-20 pt-16 border-t border-gray-100">
                    <div className="flex items-center gap-6 mb-12">
                      <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Interactive Resources</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supports this chapter</p>
                      </div>
                      <div className="h-px flex-1 bg-gray-50" />
                    </div>

                    <div className="grid grid-cols-1 gap-12">
                      {activeModule.contents.map((file, idx) => {
                        let baseUrl = file.fileurl;
                        if (baseUrl.includes("pluginfile.php") && !baseUrl.includes("webservice/pluginfile.php")) {
                          baseUrl = baseUrl.replace("pluginfile.php", "webservice/pluginfile.php");
                        }
                        const fileUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}token=${moodleToken}&forcedownload=0`;
                        const isImage = file.mimetype?.includes("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.filename);
                        const isVideo = file.mimetype?.includes("video") || /\.(mp4|webm|ogg|mov)$/i.test(file.filename);
                        const isPdf = file.mimetype?.includes("pdf") || /\.pdf$/i.test(file.filename);

                        if (isImage) {
                          return (
                            <div key={idx} className="group rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl transition-all hover:scale-[1.01]">
                              <Image src={fileUrl} alt={file.filename} width={1200} height={800} className="w-full h-auto transition-transform duration-700 group-hover:scale-105" unoptimized />
                            </div>
                          );
                        }
                        if (isVideo) {
                          return (
                            <div key={idx} className="rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl bg-black aspect-video group">
                              <video src={fileUrl} controls className="w-full h-full" />
                            </div>
                          );
                        }
                        if (isPdf) {
                          return (
                            <div key={idx} className="rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-gray-100 shadow-2xl bg-white group">
                              <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between px-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                                    <FileText size={20} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-1">{file.filename}</span>
                                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em]">Portable Document Format</span>
                                  </div>
                                </div>
                              </div>
                              <iframe src={fileUrl} className="w-full h-[80vh] border-none bg-white" title={file.filename} loading="lazy" />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Footer text */}
              <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  End of Session — Global Bible Institute Academic Portal
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-6 p-10 text-center animate-pulse">
              <HelpCircle size={64} className="opacity-10" />
              <p className="text-xs font-black uppercase tracking-widest max-w-xs text-gray-400">
                Awaiting Chapter Selection...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
