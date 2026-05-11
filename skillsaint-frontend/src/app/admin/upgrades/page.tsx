/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { getPendingUpgrades, approveUpgrade, rejectUpgrade } from "@/lib/moodle";
import {
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Filter,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UpgradeRequest {
  id: number;
  userid: number;
  app_id: number;
  fullname: string;
  email: string;
  current_plan: string;
  target_plan: string;
  price_difference: number;
  status: string;
  admin_note: string;
  timecreated: number;
  timemodified: number;
}

const PLAN_COLORS: Record<string, string> = {
  standard: "bg-emerald-100 text-emerald-700",
  premium: "bg-purple-100 text-purple-700",
  executive: "bg-indigo-100 text-indigo-700",
};

export default function UpgradesPage() {
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState<number | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    const data = await getPendingUpgrades(filter);
    if (Array.isArray(data)) {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const handleAction = async () => {
    if (!noteModal) return;
    setProcessing(noteModal.id);
    if (noteModal.action === "approve") {
      await approveUpgrade(noteModal.id, adminNote);
    } else {
      await rejectUpgrade(noteModal.id, adminNote);
    }
    setNoteModal(null);
    setAdminNote("");
    setProcessing(null);
    loadRequests();
  };

  const formatDate = (ts: number) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700";
      case "approved": return "bg-emerald-100 text-emerald-700";
      case "rejected": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen p-6 md:p-10 lg:p-14">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <header className="animate-in slide-in-from-left duration-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-1 rounded-full bg-purple-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Plan Management</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-2">
                  Upgrade <span className="text-purple-600">Requests.</span>
                </h1>
                <p className="text-gray-400 font-medium max-w-lg">
                  Review and approve student plan upgrade requests.
                </p>
              </div>
              {pendingCount > 0 && (
                <div className="px-5 py-3 bg-amber-100 text-amber-700 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} />
                  {pendingCount} Pending
                </div>
              )}
            </div>
          </header>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f
                    ? "bg-gray-900 text-white shadow-xl shadow-gray-200"
                    : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                }`}
              >
                <Filter size={12} className="inline mr-2" />
                {f}
              </button>
            ))}
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-100">
              <ArrowUpCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No upgrade requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-100 flex-shrink-0">
                        {req.fullname.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 text-sm truncate">{req.fullname}</p>
                        <p className="text-[10px] text-gray-400 font-bold truncate">{req.email}</p>
                        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">{formatDate(req.timecreated)}</p>
                      </div>
                    </div>

                    {/* Plan Change */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${PLAN_COLORS[req.current_plan] || "bg-gray-100 text-gray-500"}`}>
                        {req.current_plan}
                      </span>
                      <ArrowUpCircle size={16} className="text-purple-400" />
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${PLAN_COLORS[req.target_plan] || "bg-gray-100 text-gray-500"}`}>
                        {req.target_plan}
                      </span>
                    </div>

                    {/* Price & Status */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">+${req.price_difference.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusBadge(req.status)}`}>
                          {req.status}
                        </span>
                      </div>

                      {/* Actions */}
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setNoteModal({ id: req.id, action: "approve" }); setAdminNote(""); }}
                            disabled={processing === req.id}
                            className="p-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {processing === req.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                          </button>
                          <button
                            onClick={() => { setNoteModal({ id: req.id, action: "reject" }); setAdminNote(""); }}
                            disabled={processing === req.id}
                            className="p-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin note if exists */}
                  {req.admin_note && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
                      <MessageSquare size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-gray-500 font-medium">{req.admin_note}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirm Modal */}
      <AnimatePresence>
        {noteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteModal(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
                {noteModal.action === "approve" ? "Approve Upgrade" : "Reject Upgrade"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
                Add an optional note for the student
              </p>

              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full h-24 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium text-gray-700 focus:border-purple-300 outline-none resize-none transition-all"
                placeholder="Optional note..."
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setNoteModal(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing !== null}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                    noteModal.action === "approve"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {processing !== null && <Loader2 size={14} className="animate-spin" />}
                  {noteModal.action === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
