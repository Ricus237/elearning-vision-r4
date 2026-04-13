"use client";

import { 
  Send,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  HelpCircle,
  Search,
  MessageSquare,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Trash2
} from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { useState, useEffect, useCallback } from "react";
import { getStudentInquiriesAction, sendInquiryAction, getStudentDashboardAction, addInquiryMessageAction, deleteInquiryAction } from "@/lib/actions";

interface Inquiry {
  id: number;
  courseid: number;
  coursename: string;
  subject: string;
  message: string;
  admin_reply: string;
  status: "open" | "replied" | "resolved";
  timecreated: number;
  timemodified: number;
  messages?: Array<{
    id: number;
    userid: number;
    message: string;
    timecreated: number;
  }>;
}

const statusColors: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  replied: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle size={10} />,
  replied: <Clock size={10} />,
  resolved: <CheckCircle2 size={10} />,
};

export default function NotificationsPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeInquiryId, setActiveInquiryId] = useState<number | null>(null);
  const [isMobileList, setIsMobileList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // New Message Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(0); // 0 means 'General'
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [myCourses, setMyCourses] = useState<{id: number, fullname: string}[]>([]);

  // Load inquiries and courses
  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStudentInquiriesAction();
      setInquiries(data as Inquiry[]);
      if (data.length > 0 && activeInquiryId === null) {
        setActiveInquiryId(data[0].id);
      }
      
      const dashboardData = await getStudentDashboardAction();
      if (dashboardData && dashboardData.courses) {
        setMyCourses(dashboardData.courses);
      }
    } catch (err) {
      console.error("Failed to load inquiries", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeInquiryId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const activeInquiry = inquiries.find(q => q.id === activeInquiryId);

  const handleSendNewInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await sendInquiryAction({
        courseid: selectedCourseId,
        subject: newSubject,
        message: newMessage,
      });
      if (res?.success) {
        setIsComposeOpen(false);
        setNewSubject("");
        setNewMessage("");
        setSelectedCourseId(0);
        await loadInquiries();
      } else {
        alert(res?.error || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeInquiryId || !replyText.trim()) return;
    setIsSending(true);
    try {
      const res = await addInquiryMessageAction({
        inquiry_id: activeInquiryId,
        message: replyText
      });
      if (res?.success) {
        setReplyText("");
        await loadInquiries();
      } else {
        alert(res?.error || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!activeInquiryId) return;
    if (!confirm("Are you sure you want to delete this thread? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteInquiryAction(activeInquiryId);
      if (res?.success) {
        setActiveInquiryId(null);
        await loadInquiries();
      } else {
        alert(res?.error || "Failed to delete thread.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting thread.");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectInquiry = (id: number) => {
    setActiveInquiryId(id);
    setIsMobileList(false); // Switch to Chat View on mobile
  };

  const filteredInquiries = inquiries.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.coursename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#f0f2f5] flex flex-col md:flex-row relative selection:bg-purple-100 selection:text-purple-900 overflow-hidden">
      <StudentSidebar />

      <main className="flex-1 flex flex-col h-screen h-[100dvh] overflow-hidden">
        {/* Header container */}
        <div className="pt-20 md:pt-8 px-6 md:px-10 shrink-0 pb-4">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-1 rounded-full bg-purple-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Communication Desk</span>
           </div>
           
           <div className="flex flex-row items-end justify-between gap-4">
             <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none">
               My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Messages</span>
             </h1>
             <button
               onClick={() => setIsComposeOpen(true)}
               className="bg-gray-900 hover:bg-purple-600 text-white rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
             >
               <Plus size={16} /> <span className="hidden md:inline">New Message</span>
             </button>
           </div>
        </div>

        {/* Messaging Interface */}
        <div className="flex-1 p-6 md:px-10 md:pb-10 pt-0 overflow-hidden">
          <div className="h-full bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex overflow-hidden">
            
            {/* Left Sidebar: Thread List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white shrink-0 h-full ${isMobileList ? 'flex' : 'hidden md:flex'}`}>
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
                 <div className="relative">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                   <input 
                     type="text" 
                     placeholder="Search subjects..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-gray-50 pl-12 pr-4 py-3 text-sm rounded-xl outline-none focus:bg-purple-50 focus:text-purple-900 transition-colors placeholder:text-gray-400 font-medium border border-transparent focus:border-purple-200"
                   />
                 </div>
              </div>

              {/* Threads */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Loader2 size={24} className="animate-spin text-purple-600" />
                    <span className="text-xs font-bold">Loading messages...</span>
                  </div>
                ) : filteredInquiries.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center text-gray-300 gap-4 mt-10">
                    <MessageSquare size={48} className="opacity-40" />
                    <p className="text-sm font-medium">No conversations found.</p>
                  </div>
                ) : (
                  filteredInquiries.map(inq => (
                    <button 
                      key={inq.id}
                      onClick={() => selectInquiry(inq.id)}
                      className={`w-full text-left p-5 border-b border-gray-50 flex items-start gap-4 transition-colors ${activeInquiryId === inq.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activeInquiryId === inq.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-500'}`}>
                        <HelpCircle size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-black text-sm truncate pr-2 ${activeInquiryId === inq.id ? 'text-purple-900' : 'text-gray-900'}`}>{inq.subject}</h4>
                            <span className="text-[9px] font-bold text-gray-400 shrink-0">
                              {new Date(inq.timecreated * 1000).toLocaleDateString()}
                            </span>
                         </div>
                         <div className="flex items-center gap-2 mb-1">
                           <p className={`text-[9px] uppercase font-black tracking-widest text-purple-600 truncate`}>
                             {inq.coursename}
                           </p>
                           <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[inq.status]}`}>
                             {statusIcons[inq.status]} {inq.status}
                           </span>
                         </div>
                         <p className={`text-xs truncate ${inq.status === 'replied' ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>
                            {inq.messages && inq.messages.length > 0 
                              ? (inq.messages[inq.messages.length - 1].userid === 0 ? "Advisor replied: " : "You sent: ") + inq.messages[inq.messages.length - 1].message
                              : inq.message}
                         </p>
                      </div>
                      {(inq.status === 'replied' || inq.status === 'open') && !inq.admin_reply && (
                        <div className="shrink-0 w-2 h-2 bg-amber-400 rounded-full shadow-md mt-1" />
                      )}
                      {inq.status === 'replied' && inq.admin_reply && (
                        <div className="shrink-0 w-2 h-2 bg-purple-600 rounded-full shadow-md mt-1" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Side: Chat Area */}
            {activeInquiry ? (
              <div className={`${!isMobileList ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-[#fafafa]`}>
                {/* Chat Header */}
                <div className="px-4 md:px-8 py-5 bg-white border-b border-gray-100 flex justify-between items-center shrink-0 shadow-sm z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <button 
                      onClick={() => setIsMobileList(true)} 
                      className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center justify-center mr-1"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 leading-tight">{activeInquiry.subject}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeInquiry.coursename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${statusColors[activeInquiry.status]}`}>
                      {statusIcons[activeInquiry.status]}
                      {activeInquiry.status}
                    </div>
                    <button 
                      onClick={handleDeleteInquiry}
                      disabled={isDeleting}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                      title="Delete Conversation"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
                    {activeInquiry.messages && activeInquiry.messages.length > 0 ? (
                      activeInquiry.messages.map((msg) => {
                        const isMe = msg.userid != 0;
                        return (
                          <div key={msg.id} className={`flex gap-4 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                            <div className="shrink-0 flex flex-col items-center gap-2">
                              {isMe ? (
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-gray-900 text-white">
                                  <User size={14} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                                  <ShieldCheck size={14} />
                                </div>
                              )}
                            </div>
                            <div className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 px-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                  {isMe ? 'Me' : 'Support Advisor'}
                                </span>
                                <span className="text-[8px] font-bold text-gray-300">
                                  <Clock size={8} className="inline mr-1 -mt-0.5" />
                                  {new Date(msg.timecreated * 1000).toLocaleString()}
                                </span>
                              </div>
                              <div className={`px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm border ${
                                isMe 
                                ? "bg-white border-gray-100 text-gray-800 rounded-tr-sm" 
                                : "bg-purple-600 text-white border-purple-600 rounded-tl-sm"
                              }`}>
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 opacity-50">
                        <MessageSquare size={32} className="mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No messages found...</p>
                      </div>
                    )}
                 </div>

                 {/* Reply Input Area */}
                 {activeInquiry.status !== "resolved" ? (
                   <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                      <div className="flex gap-4">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your response here..."
                          className="flex-1 bg-gray-50 rounded-2xl px-5 py-3 text-sm font-medium outline-none resize-none h-12 border-2 border-transparent focus:border-purple-200 transition-all focus:bg-white"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={isSending || !replyText.trim()}
                          className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-purple-600 transition-all disabled:opacity-50 shrink-0"
                        >
                          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                      </div>
                   </div>
                 ) : (
                   <div className="p-6 bg-emerald-50/30 border-t border-gray-100 shrink-0">
                      <div className="flex items-center justify-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        <CheckCircle2 size={16} />
                        <p>This inquiry has been resolved.</p>
                      </div>
                   </div>
                 )}
              </div>
            ) : (
              <div className={`${!isMobileList ? 'flex' : 'hidden md:flex'} flex-1 items-center justify-center bg-[#fafafa]`}>
                 <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={24} />
                    </div>
                    <h3 className="text-gray-500 font-bold">Select a conversation to view details</h3>
                 </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {/* Compose Form Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">New Message</h2>
              <button 
                onClick={() => setIsComposeOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSendNewInquiry} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Related Course</label>
                <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border-none outline-none focus:ring-4 focus:ring-purple-50 transition-all font-medium text-sm text-gray-800"
                >
                  <option value={0}>General Inquiry / System Support</option>
                  {myCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.fullname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</label>
                <input 
                  type="text"
                  required
                  placeholder="What is your question about?"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border-none outline-none focus:ring-4 focus:ring-purple-50 transition-all font-medium text-sm text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message</label>
                <textarea 
                  required
                  placeholder="Describe your issue or question in detail..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border-none outline-none focus:ring-4 focus:ring-purple-50 transition-all font-medium text-sm text-gray-800 resize-none h-32 custom-scrollbar"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !newSubject.trim() || !newMessage.trim()}
                className="w-full mt-2 bg-gray-900 text-white rounded-xl py-4 font-black uppercase tracking-widest text-xs hover:bg-purple-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
