"use client";

import React from "react";
import { motion } from "framer-motion";
import { Rays } from "@/components/magicui/rays";
import ApplyForm from "./components/ApplyForm";
import { Info, Mail, ShieldCheck } from "lucide-react";

const ApplyPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden pt-24 pb-32 font-inter-tight">
      <Rays className="opacity-40" />

      <div className="container px-6 mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-6">
            Enrollment
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 font-serif leading-tight">
            Apply Page
          </h1>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Introduction Section */}
          <motion.section 
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="bg-white rounded-[3rem] p-10 lg:p-14 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-8 text-purple-50 -z-0">
                <Info size={120} strokeWidth={1} />
             </div>
             <div className="relative z-10">
                <h2 className="text-3xl font-black font-serif text-slate-900 mb-6">Introduction</h2>
                <div className="prose prose-slate lg:prose-lg text-slate-600 leading-relaxed space-y-4">
                   <p>
                     Welcome to the enrollment process for the International Bible Institute! Choosing to study with us is a commitment to your spiritual growth and a step toward fulfilling your divine calling. 
                   </p>
                   <p>
                     Please fill out the application form below honestly and prayerfully. This process helps our faculty understand your journey, your aspirations, and how we can best support your development in Scripture, Holiness, and the Power of God.
                   </p>
                   <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 font-bold text-sm">
                      <ShieldCheck size={20} />
                      Note: Tuition(s) are not refundable.
                   </div>
                </div>
             </div>
          </motion.section>

          {/* Application Form Section */}
          <motion.section 
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="bg-white rounded-[3rem] p-10 lg:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50"
          >
            <h2 className="text-3xl lg:text-4xl font-black font-serif text-slate-900 mb-12 text-center">Application Form</h2>
            <ApplyForm />
          </motion.section>

          {/* Footer Notes */}
          <motion.div 
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="grid sm:grid-cols-2 gap-6"
          >
             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex items-center gap-6 shadow-xl">
                <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                   <Mail size={24} className="text-purple-400" />
                </div>
                <div>
                   <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-1">Confirmation</h4>
                   <p className="font-medium">Confirmation email sent after submission with next steps.</p>
                </div>
             </div>
             <div className="bg-purple-600 text-white p-8 rounded-[2.5rem] flex items-center gap-6 shadow-xl shadow-purple-200">
                <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-sm uppercase tracking-widest text-purple-200 mb-1">Access</h4>
                   <p className="font-medium">Instructions for course access provided upon verification.</p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default ApplyPage;
