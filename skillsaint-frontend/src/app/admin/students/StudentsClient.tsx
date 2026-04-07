"use client";
import { useState, useTransition } from "react";
import { Search, UserX, Trash2, Eye, Mail, ChevronLeft, Users, ShieldCheck, ShieldAlert, CheckCircle, Clock, XCircle } from "lucide-react";
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
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    if (filter === "active") return matchSearch && !s.suspended;
    if (filter === "suspended") return matchSearch && s.suspended;
    if (filter === "paid") return matchSearch && s.payment_status === "paid";
    if (filter === "pending") return matchSearch && s.payment_status === "pending";
    return matchSearch;
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* Action toast */}
          {actionMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
              {actionMsg}
            </div>
          )}

          {selected ? (
            /* ── DETAIL VIEW ── */
            <div>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium text-sm">
                <ChevronLeft className="w-4 h-4" /> Back to Students
              </button>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="h-20 bg-gradient-to-r from-purple-500 to-indigo-600" />
                <div className="px-8 pb-8 -mt-8 flex flex-col sm:flex-row items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-2xl">
                    {selected.name.charAt(0)}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-gray-900">{selected.name}</h2>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${selected.suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {selected.suspended ? "Suspended" : "Active"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">{selected.email}</p>
                    <p className="text-gray-400 text-xs mt-1">Plan: <strong>{selected.plan}</strong> · Courses: <strong>{selected.enrolled_count}</strong> · Joined: <strong>{new Date(selected.registered_at * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong></p>
                  </div>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <a href={`mailto:${selected.email}`} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors">
                      <Mail className="w-4 h-4" /> Contact
                    </a>
                    <button onClick={() => handleSuspend(selected)} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-xl font-medium text-sm hover:bg-yellow-100 transition-colors disabled:opacity-50">
                      <UserX className="w-4 h-4" /> {selected.suspended ? "Unsuspend" : "Suspend"}
                    </button>
                    <button onClick={() => handleDelete(selected)} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Enrolled Courses", value: selected.enrolled_count },
                  { label: "Payment", value: selected.payment_status },
                  { label: "Activated", value: selected.is_activated ? "Yes" : "No" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div>
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
                <p className="text-gray-500 mt-1">View, manage, and monitor all registered users.</p>
              </header>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total", value: students.length, icon: <Users className="w-5 h-5" />, color: "bg-blue-50 text-blue-600" },
                  { label: "Active", value: totalActive, icon: <ShieldCheck className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
                  { label: "Suspended", value: totalSuspended, icon: <ShieldAlert className="w-5 h-5" />, color: "bg-red-50 text-red-600" },
                  { label: "Paid", value: totalPaid, icon: <CheckCircle className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value as "all" | "active" | "suspended" | "paid" | "pending")}

                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200">
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No students found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                          <th className="p-4 font-medium">Student</th>
                          <th className="p-4 font-medium">Plan</th>
                          <th className="p-4 font-medium">Courses</th>
                          <th className="p-4 font-medium">Payment</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium">Joined</th>
                          <th className="p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{s.name || "—"}</p>
                                  <p className="text-xs text-gray-400">{s.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                s.plan === "executive" ? "bg-purple-100 text-purple-700" :
                                s.plan === "premium" ? "bg-blue-100 text-blue-700" :
                                s.plan === "N/A" ? "bg-gray-100 text-gray-400" :
                                "bg-green-100 text-green-700"}`}>
                                {s.plan === "N/A" ? "—" : s.plan}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-gray-900 text-center">{s.enrolled_count}</td>
                            <td className="p-4">
                              {s.payment_status === "paid" ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" />Paid</span>
                              ) : s.payment_status === "pending" ? (
                                <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-semibold"><Clock className="w-3.5 h-3.5" />Pending</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400 text-xs"><XCircle className="w-3.5 h-3.5" />—</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${s.suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {s.suspended ? "Suspended" : "Active"}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 text-xs">{new Date(s.registered_at * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <button onClick={() => setSelected(s)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="View Details">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleSuspend(s)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors disabled:opacity-40" title={s.suspended ? "Unsuspend" : "Suspend"}>
                                  <UserX className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(s)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40" title="Delete User">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
