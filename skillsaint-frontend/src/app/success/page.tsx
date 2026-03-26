"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden relative pt-24 pb-24">
      {mounted && (
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

          <h1 className="text-4xl sm:text-5xl font-black font-serif text-slate-900 leading-tight mb-6">
            Payment Successful!
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
            Your information has been successfully received and your payment is confirmed. We will notify you by email shortly with your access instructions to the courses.
          </p>

          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-10 py-5 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors shadow-xl shadow-purple-200"
            >
              <Home size={24} />
              Return to Home
            </motion.div>
          </Link>
        </motion.div>
      )}
    </main>
  );
}
