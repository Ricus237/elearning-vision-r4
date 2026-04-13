"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, CheckCircle2, Clock, Send, Filter,
  User, AlertCircle, RefreshCw, ChevronRight,
  ArrowLeft, ShieldCheck,
} from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { getAdminInquiriesAction, replyInquiryAction } from "@/lib/actions";

interface Inquiry {
  id: number;
  userid: number;
  student_name: string;
  student_email: string;
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
  open:     "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  replied:  "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  resolved: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
};

const statusIcons: Record<string, React.ReactNode> = {
  open:     <AlertCircle size={12} />,
  replied:  <Clock size={12} />,
  resolved: <CheckCircle2 size={12} />,
};

export default function AdminSupportPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const loadInquiries = useCallback(async (filter = "all") => {
    setIsLoading(true);
    try {
      const data = await getAdminInquiriesAction(filter);
      setInquiries(data as Inquiry[]);
      
      // If we have a selected inquiry, refresh its data too
      if (selectedInquiry) {
        const updated = (data as Inquiry[]).find(i => i.id === selectedInquiry.id);
        if (updated) setSelectedInquiry(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedInquiry]);

  useEffect(() => { loadInquiries(activeFilter); }, [activeFilter, loadInquiries]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInquiries(activeFilter);
    setIsRefreshing(false);
  };

  const handleSelect = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    // Note: replyText is kept empty for new replies in a thread
    setReplyText(""); 
    setShowDetail(true);
  };

  const handleSendReply = async (newStatus: "replied" | "resolved") => {
    if (!selectedInquiry || !replyText.trim()) return;
    setIsSending(true);
    try {
      await replyInquiryAction({
        inquiry_id: selectedInquiry.id,
        reply: replyText,
        status: newStatus,
      });
      
      setReplyText(""); // Clear text after successful send
      await loadInquiries(activeFilter); // Refresh list and detail
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const openCount = inquiries.filter(i => i.status === "open").length;
  const filters = ["all", "open", "replied", "resolved"];

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#0b1120] flex flex-col md:flex-row relative selection:bg-purple-100 selection:text-purple-900 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-screen h-screen overflow-hidden">

        {/* Header */}
        <div className="pt-6 px-6 md:px-10 shrink-0 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 rounded-full bg-purple-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Admin Panel</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Inbox</span>
              </h1>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-2 font-medium">Manage and reply to student course inquiries.</p>
            </div>
            <div className="flex items-center gap-4">
              {openCount > 0 && (
                <div className="px-3 md:px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-amber-700 dark:text-amber-400 font-black text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span className="hidden sm:inline">{openCount} unresolved</span>
                  <span className="sm:hidden">{openCount}</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-900 transition-all shadow-sm"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 md:px-10 pb-4 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl p-2 border border-gray-100 dark:border-slate-700 shadow-sm w-fit">
            <Filter size={14} className="text-gray-400 dark:text-slate-500 ml-2 hidden sm:block" />
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeFilter === f
                    ? "bg-gray-900 dark:bg-purple-600 text-white shadow-sm"
                    : "text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 px-6 md:px-10 pb-10 overflow-hidden">
          <div className="h-full bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm flex overflow-hidden">

            {/* Left: Inquiry List */}
            <div className={`w-full md:w-96 border-r border-gray-100 dark:border-slate-800 flex flex-col shrink-0 h-full ${showDetail ? "hidden md:flex" : "flex"}`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && inquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-slate-600">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Loading inquiries...</p>
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-300 dark:text-slate-800 p-8">
                    <MessageCircle size={48} className="opacity-40" />
                    <p className="text-sm font-bold text-gray-400 dark:text-slate-600 text-center">No inquiries match this filter.</p>
                  </div>
                ) : (
                  inquiries.map(inq => (
                    <button
                      key={inq.id}
                      onClick={() => handleSelect(inq)}
                      className={`w-full text-left p-5 border-b border-gray-50 dark:border-slate-800 flex items-start gap-4 transition-colors group ${
                        selectedInquiry?.id === inq.id
                          ? "bg-purple-50 dark:bg-purple-900/10 border-l-4 border-l-purple-600"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800/30 border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black ${
                        selectedInquiry?.id === inq.id ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                      }`}>
                        {inq.student_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-black text-sm text-gray-900 dark:text-white truncate pr-2">{inq.student_name}</p>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-full border ${statusColors[inq.status]}`}>
                            {statusIcons[inq.status]}
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest truncate mb-1">
                          {inq.coursename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium truncate italic">{inq.subject}</p>
                        <p className="text-[9px] text-gray-300 dark:text-slate-600 mt-1">
                          {new Date(inq.timecreated * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 dark:text-slate-700 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-1 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Detail Panel (Chat View) */}
            {selectedInquiry ? (
              <div className={`flex-1 flex flex-col h-full bg-[#fafafa] dark:bg-slate-900/50 ${showDetail ? "flex" : "hidden md:flex"}`}>
                {/* Detail Header */}
                <div className="px-8 py-5 bg-white dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4 shrink-0 shadow-sm z-10">
                  <button
                    onClick={() => setShowDetail(false)}
                    className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm">
                    {selectedInquiry.student_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white leading-tight">{selectedInquiry.student_name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500">{selectedInquiry.student_email}</p>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[selectedInquiry.status]}`}>
                        {statusIcons[selectedInquiry.status]} {selectedInquiry.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Area (Chat Style) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
                    {/* Course Context */}
                    <div className="flex justify-center mb-4">
                      <span className="px-4 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                        Inquiry regarding {selectedInquiry.coursename}
                      </span>
                    </div>

                    {selectedInquiry.messages && selectedInquiry.messages.length > 0 ? (
                      selectedInquiry.messages.map((msg) => {
                        const isStudent = msg.userid != 0;
                        return (
                          <div key={msg.id} className={`flex gap-4 max-w-xl ${isStudent ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                            <div className="shrink-0">
                              {isStudent ? (
                                <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-slate-700 text-white flex items-center justify-center shadow-sm">
                                  <User size={14} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                                  <ShieldCheck size={14} />
                                </div>
                              )}
                            </div>
                            <div className={`flex flex-col gap-1 w-full ${isStudent ? 'items-start' : 'items-end'}`}>
                              <div className="flex items-center gap-2 px-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                                <span>{isStudent ? selectedInquiry.student_name : 'Me (Admin)'}</span>
                                <span className="text-[8px] text-gray-300 dark:text-slate-700 lowercase font-medium">
                                   {new Date(msg.timecreated * 1000).toLocaleString()}
                                </span>
                              </div>
                              <div className={`px-5 py-3.5 rounded-[1.5rem] text-sm leading-relaxed shadow-sm border ${
                                isStudent 
                                ? "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-tl-sm" 
                                : "bg-purple-600 text-white border-purple-600 rounded-tr-sm shadow-purple-100 dark:shadow-none"
                              }`}>
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                       /* Fallback for legacy inquiries if messages table wasn't populated */
                       <div className="flex gap-4 mr-auto max-w-xl">
                         <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                           <User size={14} />
                         </div>
                         <div>
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{selectedInquiry.student_name}</span>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] rounded-tl-sm px-5 py-4 border border-gray-100 dark:border-slate-700 shadow-sm">
                              <p className="text-sm font-black text-gray-900 dark:text-white mb-2">{selectedInquiry.subject}</p>
                              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{selectedInquiry.message}</p>
                            </div>
                         </div>
                       </div>
                    )}
                </div>

                {/* Admin Reply Area */}
                <div className="p-6 bg-white dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700 shrink-0 space-y-4">
                  {selectedInquiry.status !== "resolved" ? (
                    <>
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your message to the student..."
                        className="w-full bg-gray-50 dark:bg-slate-900 rounded-3xl px-6 py-4 text-sm font-medium outline-none resize-none h-24 border-2 border-transparent focus:border-purple-400 dark:focus:border-purple-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-gray-900 dark:text-white"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          onClick={() => handleSendReply("replied")}
                          disabled={isSending || !replyText.trim()}
                          className="flex-1 py-4 bg-gray-900 dark:bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-600 dark:hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          <Send size={14} />
                          {isSending ? "Sending..." : "Send Message"}
                        </button>
                        <button
                          onClick={() => handleSendReply("resolved")}
                          disabled={isSending || !replyText.trim()}
                          className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          <CheckCircle2 size={14} />
                          Resolve Ticket
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-widest text-xs">
                       <CheckCircle2 size={18} />
                       Topic Resolved
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 text-gray-300 dark:text-slate-800 bg-[#fafafa] dark:bg-slate-900/30">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-200 dark:text-slate-700">
                  <MessageCircle size={40} />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-600">Select a ticket to begin</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
