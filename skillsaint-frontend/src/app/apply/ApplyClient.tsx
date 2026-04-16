"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rays } from "@/components/magicui/rays";
import ApplyForm from "./components/ApplyForm";
import { CourseType } from "@/types/CourseType";

interface ApplyClientProps {
  enrollmentData: {
    hero_title: string;
    hero_desc: string;
    plans: {
      standard: { price: number; quota: number };
      premium: { price: number; quota: number };
      executive: { price: number; quota: number };
    };
    security_note: string;
  };
  courses: CourseType[];
}

// ─── Wizard Steps Definition ──────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 1, label: "Identity",   short: "You" },
  { id: 2, label: "Faith",      short: "Faith" },
  { id: 3, label: "Vision",     short: "Vision" },
  { id: 4, label: "Plan",       short: "Plan" },
  // { id: 5, label: "Courses",  short: "Courses" }, // ← Commented out — may be re-enabled later
  { id: 5, label: "Payment",    short: "Pay" },
];

const ApplyClient = ({ enrollmentData, courses }: ApplyClientProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("executive");
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});

  // ─── PLANS rebuilt from CMS/Moodle data ──────────────────────────────────
  const PLANS = [
    {
      id: "standard",
      label: "Standard Enrollment",
      price: enrollmentData.plans.standard.price,
      courseQuota: enrollmentData.plans.standard.quota,
      activeColor: "border-purple-600 ring-2 ring-purple-100",
    },
    {
      id: "premium",
      label: "Premium Enrollment",
      price: enrollmentData.plans.premium.price,
      courseQuota: enrollmentData.plans.premium.quota,
      activeColor: "border-purple-600 ring-2 ring-purple-100",
    },
    {
      id: "executive",
      label: "Executive Enrollment",
      price: enrollmentData.plans.executive.price,
      courseQuota: Infinity,
      activeColor: "border-purple-600 ring-4 ring-purple-50",
      recommended: true,
    },
  ];

  const totalSteps = WIZARD_STEPS.length;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, totalSteps));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  return (
    <main
      className="min-h-screen bg-slate-50 overflow-hidden pt-12 pb-20 font-inter-tight"
      suppressHydrationWarning={true}
    >
      <Rays className="opacity-25" />

      <div className="container px-4 mx-auto max-w-3xl">

        {/* ── Hero / Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-4">
            Enrollment
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            {enrollmentData.hero_title}
          </h1>
          <p className="text-slate-500 mt-3 text-base font-medium max-w-lg mx-auto">
            {enrollmentData.hero_desc}
          </p>
        </motion.div>

        {/* ── Step Progress Bar ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Step labels */}
          <div className="flex items-center justify-between mb-3 px-1">
            {WIZARD_STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    step.id < currentStep
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : step.id === currentStep
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200 scale-110"
                      : "bg-white border-2 border-slate-200 text-slate-400"
                  }`}
                >
                  {step.id < currentStep ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block transition-colors ${
                    step.id === currentStep ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step.short}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar track */}
          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Step counter */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-widest">
              {WIZARD_STEPS[currentStep - 1].label}
            </span>
          </div>
        </motion.div>

        {/* ── Step Content Card ─────────────────────────────────────────── */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 lg:p-10"
            >
              <ApplyForm
                currentStep={currentStep}
                plans={PLANS}
                courses={courses}
                selectedPlan={selectedPlan}
                onPlanChange={setSelectedPlan}
                onNext={goNext}
                onBack={goBack}
                collectedData={collectedData}
                setCollectedData={setCollectedData}
                securityNote={enrollmentData.security_note}
              />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
};

export default ApplyClient;
