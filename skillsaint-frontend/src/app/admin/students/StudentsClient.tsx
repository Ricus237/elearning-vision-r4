"use client";
import { useState, useTransition } from "react";
import { Search, UserX, Trash2, Eye, ChevronLeft, Users, ShieldCheck, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

export type Student = {

  id: number;
  name: string;
  email: string;
  suspended: number;
  plan: string;
  payment_status: string;
  is_activated: number;
  activation_code: string;
  enrolled_count: number;
  registered_at: number;
};

async function callMoodleAdmin(wsfunction: string, params: Record<string, unknown> = {}) {

  const res = await fetch("/api/moodle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: wsfunction, params })
  });
  return res.json();
}

export default function StudentsClient({ initialStudents }: { initialStudents: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "paid" | "pending">("all");
  const [selected, setSelected] = useState<Student | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const filtered = students.filter(s => {
    if (filter === "active") return !s.suspended;
    if (filter === "suspended") return s.suspended;
    if (filter === "paid") return s.payment_status === "paid";
    if (filter === "pending") return s.payment_status === "pending";
    return true;
  });

  const handleDelete = (student: Student) => {
    if (!confirm(`Delete user "${student.name}" (${student.email}) permanently? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await callMoodleAdmin("core_user_delete_users", { "userids[0]": student.id });
      if (res?.exception) {
        setActionMsg(`Error: ${res.message}`);
      } else {
        setStudents(prev => prev.filter(s => s.id !== student.id));
        if (selected?.id === student.id) setSelected(null);
        setActionMsg(`User "${student.name}" deleted successfully.`);
      }
      setTimeout(() => setActionMsg(null), 4000);
    });
  };

  const handleSuspend = (student: Student) => {
    const action = student.suspended ? "unsuspend" : "suspend";
    if (!confirm(`Are you sure you want to ${action} "${student.name}"?`)) return;
    startTransition(async () => {
      const res = await callMoodleAdmin("core_user_update_users", {
        "users[0][id]": student.id,
        "users[0][suspended]": student.suspended ? 0 : 1,
      });
      if (res?.exception) {
        setActionMsg(`Error: ${res.message}`);
      } else {
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, suspended: s.suspended ? 0 : 1 } : s));
        if (selected?.id === student.id) setSelected(prev => prev ? { ...prev, suspended: prev.suspended ? 0 : 1 } : null);
        setActionMsg(`User "${student.name}" ${action}ed.`);
      }
      setTimeout(() => setActionMsg(null), 4000);
    });
  };

  const totalActive = students.filter(s => !s.suspended).length;
  const totalSuspended = students.filter(s => s.suspended).length;
  const totalPaid = students.filter(s => s.payment_status === "paid").length;

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      <AdminSidebar />
      <main className="flex-1 min-h-screen">
        <div className="h-full pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-7xl mx-auto">

            {/* Action toast - Premium Style */}
            {actionMsg && (
              <div className="mb-8 bg-emerald-50 border-2 border-emerald-100 text-emerald-600 rounded-[2rem] px-8 py-5 text-sm font-black uppercase tracking-widest animate-in slide-in-from-top duration-500 shadow-xl shadow-emerald-500/5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  {actionMsg}
                </div>
              </div>
            )}

            {selected ? (
              /* ── DETAIL VIEW (PREMIUM BADGE STYLE) ── */
              <div className="animate-in fade-in zoom-in-95 duration-700">
                <button 
                  onClick={() => setSelected(null)} 
                  className="group flex items-center gap-3 text-gray-400 hover:text-purple-600 mb-10 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                  Return to Records
                </button>

                <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden mb-10 flex flex-col md:flex-row relative">
                  <div className="md:w-1/3 bg-gray-50/50 p-12 flex flex-col items-center justify-center border-r border-gray-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-indigo-600" />
                    <div className="relative mb-6">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-purple-600 font-black text-5xl border-4 border-white">
                        {selected.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white shadow-lg ${selected.suspended ? "bg-red-500" : "bg-emerald-500"} flex items-center justify-center`}>
                        {selected.suspended ? <ShieldAlert className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight text-center mb-2 leading-none uppercase">{selected.name}</h2>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">{selected.email}</p>
                  </div>

                  <div className="flex-1 p-12">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-10">
                        <div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Academic Status</p>
                          <span className={`inline-flex px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${selected.suspended ? "bg-red-50 text-red-500 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                            {selected.suspended ? "Restricted Access" : "Full Global Access"}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => handleSuspend(selected)} disabled={isPending} className="flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl shadow-gray-200">
                            <UserX className="w-4 h-4" /> {selected.suspended ? "Grant Access" : "Revoke Access"}
                          </button>
                          <button onClick={() => handleDelete(selected)} disabled={isPending} className="flex items-center gap-3 px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" /> Hard Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-auto">
                        <BadgeDetail label="Global Rank" value={selected.plan === "N/A" ? "Standard" : selected.plan} icon={<ShieldCheck className="w-4 h-4" />} color="text-purple-600" />
                        <BadgeDetail label="Enrollments" value={`${selected.enrolled_count} Active`} icon={<Users className="w-4 h-4" />} color="text-blue-600" />
                        <BadgeDetail label="Verified At" value={new Date(selected.registered_at * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" })} icon={<Clock className="w-4 h-4" />} color="text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── LIST VIEW ── */
              <div className="animate-in fade-in duration-1000">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-1 rounded-full bg-purple-600" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Global Records</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                      IBI Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Identity</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-md text-sm">
                      Official directory management for active theological members.
                    </p>
                  </div>

                  <div className="relative group min-w-[300px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-purple-600 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="SEARCH RECORDS..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-purple-600/20 focus:ring-4 focus:ring-purple-600/5 transition-all font-black text-[10px] tracking-widest placeholder:text-gray-300"
                    />
                  </div>
                </header>

                {/* Stats Summary Area */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <LittleStat label="Total Members" value={students.length} color="bg-blue-50 text-blue-600" />
                  <LittleStat label="Active" value={totalActive} color="bg-emerald-50 text-emerald-600" />
                  <LittleStat label="Restricted" value={totalSuspended} color="bg-red-50 text-red-500" />
                  <LittleStat label="Enrollments" value={totalPaid} color="bg-purple-50 text-purple-600" />
                </div>

                {/* Filter Sub-header */}
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-50">
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Real-time Directory Feed</p>
                   </div>
                   <div className="flex gap-2">
                     {(["all", "active", "suspended", "paid", "pending"] as const).map((f) => (
                       <button
                         key={f}
                         onClick={() => setFilter(f)}
                         className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                           filter === f 
                             ? "bg-gray-900 text-white shadow-xl shadow-gray-200" 
                             : "text-gray-400 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                         }`}
                       >
                         {f}
                       </button>
                     ))}
                   </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
                  {filtered.length === 0 ? (
                    <div className="col-span-full py-32 bg-gray-50/50 rounded-[4rem] text-center">
                      <div className="w-20 h-20 rounded-[2rem] bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <Users className="w-10 h-10" />
                      </div>
                      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No records found for this segment.</p>
                    </div>
                  ) : (
                    filtered.filter(s => search === "" || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())).map(s => (
                      <div 
                        key={s.id} 
                        className="group relative bg-white rounded-[3rem] p-8 shadow-sm border border-gray-50 hover:border-purple-100 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden animate-in fade-in duration-700 slide-in-from-bottom-5"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-bl-[5rem] group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative mb-8 pt-4">
                          <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 border-4 border-white shadow-sm flex items-center justify-center text-purple-600 font-black text-3xl group-hover:scale-110 group-hover:bg-white group-hover:shadow-2xl transition-all duration-500 border border-gray-50">
                            {s.name.charAt(0)}
                          </div>
                        </div>

                        <div className="mb-6 relative z-10">
                          <h3 className="text-lg font-black text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors mb-2 uppercase tracking-tight">
                            {s.name || "Master Student"}
                          </h3>
                          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] truncate max-w-[180px]">
                            {s.email}
                          </p>
                        </div>

                        <div className="w-full flex justify-center gap-2 mb-8 relative z-10">
                           <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             s.plan === "executive" ? "bg-purple-50 text-purple-600 border-purple-100" :
                             s.plan === "premium" ? "bg-blue-50 text-blue-600 border-blue-100" :
                             "bg-gray-50 text-gray-400 border-gray-100"}`}>
                             {s.plan === "N/A" ? "Standard Member" : s.plan}
                           </span>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 mb-8 pt-6 border-t border-gray-50 relative z-10">
                          <div>
                            <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-1">Courses</p>
                            <p className="font-black text-gray-900 text-xl">{s.enrolled_count}</p>
                          </div>
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${s.suspended ? "text-red-300" : "text-emerald-300"}`}>Status</p>
                            <p className={`font-black text-xl flex items-center justify-center gap-1 ${s.suspended ? "text-red-500" : "text-emerald-500"}`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${s.suspended ? "bg-red-500" : "bg-emerald-500"}`} />
                               {s.suspended ? "OFF" : "ON"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-auto relative z-10 w-full">
                          <button 
                            onClick={() => setSelected(s)} 
                            className="flex-1 h-12 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-[9px] hover:bg-black transition-all shadow-lg shadow-gray-100 flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> Profile
                          </button>
                          <button 
                            onClick={() => handleSuspend(s)} 
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                              s.suspended 
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white" 
                                : "bg-red-50 text-red-400 hover:bg-red-500 hover:text-white"
                            }`}
                            title={s.suspended ? "Unsuspend" : "Suspend"}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LittleStat({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-5 group hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-500">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${color}`}>
        <Users className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function BadgeDetail({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 group hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500">
      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:rotate-12 transition-transform ${color}`}>
        {icon}
      </div>
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{value}</p>
    </div>
  );
}
