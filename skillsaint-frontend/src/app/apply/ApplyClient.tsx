"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rays } from "@/components/magicui/rays";
import ApplyForm, { CourseSelector } from "./components/ApplyForm";
import { BookOpen, ShieldCheck } from "lucide-react";
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

const ApplyClient = ({ enrollmentData, courses }: ApplyClientProps) => {
  const [selectedPlan, setSelectedPlan] = useState("executive");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  // Reconstruct PLANS from Moodle data
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

  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;
  const quota = currentPlan.courseQuota;
  const used = selectedCourses.length;

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (quota !== Infinity && prev.length >= quota) return prev;
      return [...prev, id];
    });
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    const plan = PLANS.find((p) => p.id === planId)!;
    if (plan.courseQuota !== Infinity && selectedCourses.length > (plan.courseQuota as number)) {
      setSelectedCourses((prev) => prev.slice(0, plan.courseQuota as number));
    }
  };

  return (
    <main 
      className="min-h-screen bg-slate-50 overflow-hidden pt-24 pb-16 font-inter-tight"
      suppressHydrationWarning={true}
    >
      <Rays className="opacity-30" />

      <div className="container px-4 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-4">
            Enrollment
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 font-serif leading-tight">
            {enrollmentData.hero_title}
          </h1>
          <p className="text-slate-500 mt-3 text-base font-medium max-w-lg mx-auto">
            {enrollmentData.hero_desc}
          </p>
        </motion.div>

        <div className={`grid ${isReviewing ? 'grid-cols-1 max-w-4xl mx-auto' : 'lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] items-start'} gap-6 transition-all duration-500`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 lg:p-8 ${isReviewing ? 'sm:p-12' : ''}`}
          >
            {!isReviewing && (
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-xl font-serif leading-tight">Application Form</h2>
                  <p className="text-slate-400 text-xs font-medium">Fill all sections to continue</p>
                </div>
              </div>
            )}

            <ApplyForm
              plans={PLANS}
              courses={courses}
              selectedPlan={selectedPlan}
              selectedCourses={selectedCourses}
              onPlanChange={handlePlanChange}
              onToggleCourse={toggleCourse}
              isReviewing={isReviewing}
              setIsReviewing={setIsReviewing}
            />
          </motion.div>

          {!isReviewing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-28 space-y-4"
            >
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <BookOpen size={16} className="text-purple-600" />
                  <h2 className="font-black text-slate-800 text-base">Programs & Courses</h2>
                  {quota !== Infinity ? (
                    <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${used >= quota ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-700"}`}>
                      {used}/{quota} selected
                    </span>
                  ) : (
                    <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                      All courses ✓
                    </span>
                  )}
                </div>
                <CourseSelector
                  plans={PLANS}
                  courses={courses}
                  selectedPlan={selectedPlan}
                  selectedCourses={selectedCourses}
                  onToggleCourse={toggleCourse}
                  onPlanChange={handlePlanChange}
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 text-slate-500">
                <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold leading-snug uppercase tracking-tight">{enrollmentData.security_note}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ApplyClient;
