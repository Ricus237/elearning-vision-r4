/* eslint-disable */
"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Trophy, Users, Calendar, Search, Filter, 
  ChevronRight, Loader2, Download,
  CheckCircle2, XCircle, AlertCircle, Clock
} from "lucide-react";
import Link from "next/link";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { getAllExamResultsAction } from "@/lib/actions";

export default function ExamResultsClient() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuiz, setFilterQuiz] = useState("all");

  useEffect(() => {
    async function fetchResults() {
      const data = await getAllExamResultsAction();
      if (Array.isArray(data)) {
        setResults(data);
      }
      setIsLoading(false);
    }
    fetchResults();
  }, []);

  const filteredResults = results.filter(r => {
    const matchesSearch = 
      r.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.useremail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuiz = filterQuiz === "all" || r.quizname === filterQuiz;
    return matchesSearch && matchesQuiz;
  });

  const quizzes = Array.from(new Set(results.map(r => r.quizname)));

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <div className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 mt-14 md:mt-0">
            <div>
              <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-xs uppercase tracking-widest">
                <Trophy size={14} />
                <span>Assessment Analytics</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">Exam Results</h1>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total Attempts</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{results.length}</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Success Rate</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {results.length > 0 ? Math.round((results.filter(r => r.score >= 80).length / results.length) * 100) : 0}%
              </h3>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Clock size={24} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Average Score</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) : 0}%
              </h3>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search student name or email..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-sm font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={18} className="text-slate-400" />
              <select 
                className="w-full md:w-64 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 text-sm font-bold text-slate-700 dark:text-slate-300"
                value={filterQuiz}
                onChange={e => setFilterQuiz(e.target.value)}
              >
                <option value="all">All Quizzes</option>
                {quizzes.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                <p className="text-slate-500 font-bold text-sm animate-pulse">Loading attempt history...</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam & Course</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Attempt</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredResults.map((result) => {
                      const isPass = result.score >= 80;
                      return (
                        <tr key={result.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">{result.username}</span>
                              <span className="text-xs font-bold text-slate-400">{result.useremail}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{result.quizname}</span>
                              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{result.coursename}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className={`text-lg font-black ${isPass ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {Math.round(result.score)}%
                              </div>
                              <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                {isPass ? 'Success' : 'Failed'}
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400">
                              {result.correct_count} / {result.total_questions} correct
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                              #{result.attempt_number}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                              <Calendar size={14} className="text-slate-300" />
                              {formatDate(result.timecreated)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No results found</h3>
                <p className="text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
