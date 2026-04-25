"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, Copy, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const method = searchParams?.get("method"); // "paypal"
  const sessionId = searchParams?.get("session_id"); // Stripe
  const courseId = searchParams?.get("courseId");
  const isApplication = searchParams?.get("isApplication") === "true";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const defaultPassword = "GBI2026@";


  useEffect(() => {
    async function finalize() {
      const rawEmail = localStorage.getItem('pending_application_email');
      const email = rawEmail ? rawEmail.trim().toLowerCase() : "";
      setUserEmail(email);
      
      if (email && isApplication) {
        // Call API route directly instead of importing server-side code
        let res;
        try {
          const response = await fetch("/api/moodle/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          res = await response.json();
        } catch {
          res = { status: "error", message: "Network error" };
        }
        if (res && res.status === 'success') {
          setStatus("success");
          // Store email for activation check
          document.cookie = `user_email=${email}; path=/; max-age=3600`;
          // L'utilisateur vient d'être créé/certifié dans Moodle, on sauvegarde son ID pour le Dashboard
          if (res.user_id) {
            document.cookie = `moodle_user_id=${res.user_id}; path=/; max-age=2592000`; // 30 jours
          }
        } else {
          setStatus("error");
          setErrorMsg(`Database Error: ${res?.message || "Verify your connection"}`);
        }
      } else {
        setStatus("success");
      }
    }
    
    finalize();
  }, [sessionId, method, isApplication]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Finalizing your enrollment...</h2>
        <p className="text-slate-600">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Verification Failed</h2>
        <p className="text-red-600 mb-8">{errorMsg}</p>
        <Link href={courseId ? `/checkout?courseId=${courseId}` : "/checkout"}>
          <div className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
            Try Again
          </div>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
      className="max-w-xl w-full text-center relative z-10 bg-white/80 backdrop-blur-xl p-10 sm:p-14 rounded-[3rem] shadow-2xl shadow-purple-900/5 border border-purple-100"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
        className="size-28 rounded-full bg-green-100/80 text-green-600 flex items-center justify-center shadow-lg shadow-green-100 mb-8 mx-auto"
      >
        <CheckCircle2 size={56} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-6"
      >
        {method === "paypal" ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.54h7.947c1.513 0 2.754.365 3.72 1.082 1.25.928 1.888 2.344 1.888 4.212 0 2.856-1.542 5.33-4.585 5.33h-1.457c-.45 0-.832.312-.911.753l-.033.187-.532 3.007c-.053.298-.314.516-.617.516h-3.926zm12.39-12.016c0-3.328-2.618-4.792-5.746-4.792H5.576L2.61 20.668h3.844l1.292-7.24a.64.64 0 0 1 .632-.527h2.247c3.964 0 7.291-1.74 7.291-3.58z" />
          </svg>
        ) : (
          <span className="text-xs font-black tracking-wider">STRIPE</span>
        )}
        Payment Confirmed
      </motion.div>

      <h1 className="text-4xl sm:text-5xl font-black  text-slate-900 leading-tight mb-6">
        {isApplication ? "Application Received!" : "You're enrolled!"}
      </h1>

      <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed font-medium">
        {isApplication 
          ? "Your program application and payment were successful. You can now access your chosen courses in your dashboard."
          : "Your payment was successful and your course access is now active. Head to your dashboard to start learning."
        }
      </p>

      {/* ── Credentials Block ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-10 p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 text-left"
      >
        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck size={12} />
          Your Login Credentials
        </p>
        
        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 group">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
              <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{userEmail || "your-email@example.com"}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(userEmail);
                setCopiedField("email");
                setTimeout(() => setCopiedField(null), 2000);
              }}
              className="p-2 hover:bg-purple-50 rounded-xl transition-colors text-purple-600"
            >
              {copiedField === "email" ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-purple-100 group">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Temporary Password</p>
              <p className="text-sm font-bold text-slate-900">{defaultPassword}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(defaultPassword);
                setCopiedField("password");
                setTimeout(() => setCopiedField(null), 2000);
              }}
              className="p-2 hover:bg-purple-50 rounded-xl transition-colors text-purple-600"
            >
              {copiedField === "password" ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
        
        <p className="mt-4 text-[10px] font-medium text-purple-500 italic">
          * Please change your password immediately after your first login.
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/dashboard">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors shadow-xl shadow-purple-200 cursor-pointer"
          >
            Start Learning →
          </motion.div>
        </Link>
        {/* <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Home size={20} />
            Home
          </motion.div>
        </Link> */}
      </div>
    </motion.div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden relative pt-24 pb-24">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
