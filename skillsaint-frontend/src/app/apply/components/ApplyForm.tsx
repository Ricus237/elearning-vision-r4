/* eslint-disable */

"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Flame, Lightbulb, ShieldCheck,
  CreditCard, Lock, AlertCircle, Loader2,
  ArrowLeft, ArrowRight
  // BookOpen, // ← Kept for potential future re-use (Course step)
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { CourseType } from "@/types/CourseType";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { saveApplication } from "@/lib/data";

// ─── Types ─────────────────────────────────────────────────────────────────
type Plan = {
  id: string;
  label: string;
  price: number;
  courseQuota: number;
  activeColor?: string;
  recommended?: boolean;
};

type ApplyFormProps = {
  currentStep: number;
  plans: Plan[];
  courses: CourseType[];
  selectedPlan: string;
  onPlanChange: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  collectedData: Record<string, string>;
  setCollectedData: (data: Record<string, string>) => void;
  securityNote: string;
};

// ─── Field styles ───────────────────────────────────────────────────────────
const INPUT =
  "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all font-medium text-slate-900 bg-slate-50/50 text-sm";
const LABEL = "text-sm font-semibold text-slate-700 mb-1.5 block";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

// ─── Section Header ─────────────────────────────────────────────────────────
function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="size-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-200">
        {icon}
      </div>
      <div>
        <h2 className="font-black text-slate-900 text-2xl leading-tight">{title}</h2>
        <p className="text-slate-400 text-sm font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Navigation Buttons ─────────────────────────────────────────────────────
function StepNav({
  onBack,
  onNext,
  isFirst,
  isLast,
  isLoading,
  nextLabel,
}: {
  onBack: () => void;
  onNext?: () => void;
  isFirst: boolean;
  isLast?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className={`flex items-center gap-3 pt-6 mt-6 border-t border-slate-100 ${isFirst ? "justify-end" : "justify-between"}`}>
      {!isFirst && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-purple-200 hover:text-purple-700 transition-all"
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
      {!isLast && onNext && (
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-7 py-3 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          {nextLabel || "Continue"} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Main ApplyForm Component ───────────────────────────────────────────────
const ApplyForm = ({
  currentStep,
  plans,
  courses,
  selectedPlan,
  onPlanChange,
  onNext,
  onBack,
  collectedData,
  setCollectedData,
  securityNote,
}: ApplyFormProps) => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Errors
  const [stepError, setStepError] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(0);

  // Initialize customAmount when plan changes
  useState(() => {
    setCustomAmount(plans.find(p => p.id === selectedPlan)?.price || 0);
  });

  // Selected courses — commented out (course step disabled)
  // const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;

  // ─── Validate & Advance ───────────────────────────────────────────────────
  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError("");

    const form = formRef.current;
    if (!form) return;

    // Collect form values
    const data = new FormData(form);
    const obj: Record<string, string> = {};
    data.forEach((value, key) => { obj[key] = value.toString(); });

    // Validate required fields in current form
    const requiredFields = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input[required], textarea[required], select[required]");

    let hasError = false;
    requiredFields.forEach((field) => {
      if (!field.value || field.value.trim() === "") {
        field.classList.add("ring-2", "ring-red-300", "border-red-400");
        hasError = true;
      } else {
        field.classList.remove("ring-2", "ring-red-300", "border-red-400");
      }
    });

    if (hasError) {
      setStepError("Please fill out all required fields before continuing.");
      return;
    }

    // Merge and persist data
    const merged = { ...collectedData, ...obj };
    setCollectedData(merged);

    // Save draft to backend at each step to ensure no data loss
    const normalizedEmail = (merged.email || "").trim().toLowerCase();
    if (normalizedEmail) {
      localStorage.setItem("pending_application_email", normalizedEmail);
      
      // Save in background to Moodle at every step
      saveApplication(
        { ...merged, email: normalizedEmail },
        selectedPlan,
        [] // empty courses for now
      );
    }

    onNext();
  };

  const handleBack = () => {
    const form = formRef.current;
    if (form) {
      const data = new FormData(form);
      const obj: Record<string, string> = {};
      data.forEach((value, key) => {
        obj[key] = value.toString();
      });
      setCollectedData({ ...collectedData, ...obj });
    }
    onBack();
  };

  // ─── Stripe Payment ───────────────────────────────────────────────────────
  const handleStripePayment = async () => {
    setIsProcessing(true);
    setStepError("");
    try {
      const match = document.cookie.match(/moodle_user_id=([^;]+)/);
      const userId = match ? match[1] : "";

      const res = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isApplication: true,
          plan: selectedPlan,
          courses: [], // [] while course step is disabled
          amount: customAmount || currentPlan.price,
          currency: "USD",
          userId,
          email: collectedData.email, // Passing email for new user activation
          courseTitle: currentPlan.label,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStepError(data.error || "Failed to start Stripe checkout.");
        setIsProcessing(false);
      }
    } catch {
      setStepError("Network error. Please try again.");
      setIsProcessing(false);
    }
  };

  // ─── PayPal Payment ───────────────────────────────────────────────────────
  const createPayPalOrder = useCallback(async () => {
    const match = document.cookie.match(/moodle_user_id=([^;]+)/);
    const userId = match ? match[1] : "";

    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isApplication: true,
        plan: selectedPlan,
        courses: [], // [] while course step is disabled — re-enable with selectedCourses
        amount: customAmount || currentPlan.price,
        currency: "USD",
        userId,
        email: collectedData.email,
        courseTitle: currentPlan.label,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.orderID;
  }, [selectedPlan, currentPlan]);

  const onPayPalApprove = useCallback(async (data: { orderID: string }) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID, isApplication: true }),
      });
      const result = await res.json();
      if (result.success) router.push(`/success?method=paypal&orderID=${data.orderID}`);
      else setStepError(result.error || "Payment capture failed.");
    } catch {
      setStepError("Network error during capture.");
    } finally {
      setIsProcessing(false);
    }
  }, [router]);

  // ─── Error Banner ─────────────────────────────────────────────────────────
  const ErrorBanner = () =>
    stepError ? (
      <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm animate-in fade-in slide-in-from-top-2">
        <AlertCircle size={18} className="shrink-0" />
        {stepError}
      </div>
    ) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Personal Information
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStep === 1) {
    return (
      <form ref={formRef} onSubmit={handleStepSubmit} noValidate>
        <StepHeader
          icon={<User size={22} />}
          title="Personal Information"
          subtitle="Tell us a bit about yourself"
        />
        <ErrorBanner />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Full Name <span className="text-red-500">*</span></label>
              <input required name="name" type="text" className={INPUT} placeholder="First and Last name" defaultValue={collectedData.name} />
            </div>
            <div>
              <label className={LABEL}>Preferred Name</label>
              <input name="nickname" type="text" className={INPUT} placeholder="What should we call you?" defaultValue={collectedData.nickname} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Date of Birth <span className="text-red-500">*</span></label>
              <input required name="dob" type="date" className={INPUT} defaultValue={collectedData.dob} />
            </div>
            <div>
              <label className={LABEL}>Email <span className="text-red-500">*</span></label>
              <input required name="email" type="email" className={INPUT} placeholder="your@email.com" defaultValue={collectedData.email} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Phone <span className="text-red-500">*</span></label>
            <input required name="phone" type="tel" className={INPUT} placeholder="+1 (555) 000-0000" defaultValue={collectedData.phone} />
          </div>
          <div>
            <label className={LABEL}>Mailing Address <span className="text-red-500">*</span></label>
            <textarea required name="address" rows={2} className={INPUT} placeholder="City, State/Province, Country" defaultValue={collectedData.address} />
          </div>
        </div>
        <StepNav onBack={handleBack} onNext={onNext} isFirst={true} nextLabel="Continue" />
      </form>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Spiritual Background
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStep === 2) {
    return (
      <form ref={formRef} onSubmit={handleStepSubmit} noValidate>
        <StepHeader
          icon={<Flame size={22} />}
          title="Spiritual Background"
          subtitle="Share your walk with God"
        />
        <ErrorBanner />
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Current relationship with God <span className="text-red-500">*</span></label>
            <textarea required name="relationship_description" rows={3} className={INPUT} placeholder="Describe your daily walk and prayer life..." defaultValue={collectedData.relationship_description} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Time as a believer <span className="text-red-500">*</span></label>
              <input required name="believer_duration" type="text" className={INPUT} placeholder="e.g. 5+ years" defaultValue={collectedData.believer_duration} />
            </div>
            <div>
              <label className={LABEL}>Baptism <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2 mt-1">
              <label className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-sm font-bold transition-all has-[:checked]:bg-purple-600 has-[:checked]:text-white has-[:checked]:border-purple-600 shadow-sm">
                  <input type="checkbox" name="baptism-water" className="hidden" defaultChecked={collectedData['baptism-water'] === 'on'} /> Water
                </label>
                <label className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-sm font-bold transition-all has-[:checked]:bg-purple-600 has-[:checked]:text-white has-[:checked]:border-purple-600 shadow-sm">
                  <input type="checkbox" name="baptism-spirit" className="hidden" defaultChecked={collectedData['baptism-spirit'] === 'on'} /> Spirit
                </label>
              </div>
            </div>
          </div>
          <div>
            <label className={LABEL}>Ministry experience <span className="text-red-500">*</span></label>
            <textarea required name="ministry_experience" rows={2} className={INPUT} placeholder="Prayer, Bible study, ministry roles..." defaultValue={collectedData.ministry_experience} />
          </div>
          <div>
            <label className={LABEL}>Church involvement</label>
            <input name="church_name" type="text" className={INPUT} placeholder="Name of your local church or community" defaultValue={collectedData.church_name} />
          </div>
        </div>
        <StepNav onBack={handleBack} onNext={onNext} isFirst={false} nextLabel="Continue" />
      </form>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Goals & Motivation
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStep === 3) {
    return (
      <form ref={formRef} onSubmit={handleStepSubmit} noValidate>
        <StepHeader
          icon={<Lightbulb size={22} />}
          title="Goals & Motivation"
          subtitle="Tell us your vision and calling"
        />
        <ErrorBanner />
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Why enroll in GBI? <span className="text-red-500">*</span></label>
            <textarea required name="enrollment_motivation" rows={3} className={INPUT} placeholder="Your primary motivation..." defaultValue={collectedData.enrollment_motivation} />
          </div>
          <div>
            <label className={LABEL}>Areas of spiritual growth <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {["Scripture", "Presence", "Gifts & Fruit", "Wisdom"].map((area) => (
                <label key={area} className="flex items-center gap-2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-[13px] font-bold has-[:checked]:bg-purple-50 has-[:checked]:border-purple-500 has-[:checked]:text-purple-700 transition-all shadow-sm">
                  <input 
                    type="checkbox" 
                    name={`growth-area-${area}`} 
                    value="on" 
                    className="size-4 accent-purple-600" 
                    defaultChecked={collectedData[`growth-area-${area}`] === 'on'} 
                  /> {area}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Ministry aspirations <span className="text-red-500">*</span></label>
            <textarea required name="ministry_aspirations" rows={2} className={INPUT} placeholder="Where do you see yourself after this program?" defaultValue={collectedData.ministry_aspirations} />
          </div>
          <div>
            <label className={LABEL}>Gifts or leadership areas to develop <span className="text-red-500">*</span></label>
            <input required name="leadership_goals" type="text" className={INPUT} placeholder="e.g. Prophecy, Teaching, Administration" defaultValue={collectedData.leadership_goals} />
          </div>
        </div>
        <StepNav onBack={handleBack} onNext={onNext} isFirst={false} nextLabel="Choose Plan" />
      </form>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Enrollment Plan
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStep === 4) {
    return (
      <div>
        <StepHeader
          icon={<ShieldCheck size={22} />}
          title="Choose Your Plan"
          subtitle="Select an enrollment plan that suits your journey"
        />
        {stepError && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {stepError}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${
                selectedPlan === plan.id
                  ? plan.activeColor + " bg-white shadow-md"
                  : "border-slate-100 bg-slate-50/30 hover:border-purple-100"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={selectedPlan === plan.id}
                onChange={() => onPlanChange(plan.id)}
                className="hidden"
              />
              {selectedPlan === plan.id && <BorderBeam size={200} duration={8} />}

              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedPlan === plan.id ? "border-purple-600 bg-purple-600" : "border-slate-300"
                  }`}
                >
                  {selectedPlan === plan.id && <div className="size-2.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{plan.label}</span>
                    {plan.recommended && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                    {plan.courseQuota === Infinity ? "Full Program — All Courses" : `Up to ${plan.courseQuota} courses`}
                  </p>
                </div>
              </div>

              <div className="relative z-10 text-right">
                <div className="text-2xl font-black text-slate-900">${plan.price}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">one-time</div>
              </div>
            </label>
          ))}
        </div>

        {/* ── Commented-out Course Selector ─────────────────────────────────
        // This block enables per-course selection (Step 5 in original flow).
        // Restore this when the "Choose Courses" step is re-enabled.
        //
        // <CourseSelector
        //   plans={plans}
        //   courses={courses}
        //   selectedPlan={selectedPlan}
        //   selectedCourses={selectedCourses}
        //   onToggleCourse={toggleCourse}
        //   onPlanChange={onPlanChange}
        // />
        ─────────────────────────────────────────────────────────────────── */}

        <div className={`flex items-center justify-between pt-6 border-t border-slate-100`}>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-purple-200 hover:text-purple-700 transition-all"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={() => {
              const normalizedEmail = (collectedData.email || "").trim().toLowerCase();
              if (normalizedEmail) {
                saveApplication(
                  { ...collectedData, email: normalizedEmail },
                  selectedPlan,
                  []
                );
              }
              onNext();
            }}
            className="flex items-center gap-2 px-7 py-3 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-xl transition-all active:scale-95 shadow-lg"
          >
            Review & Pay <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5 — Payment
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStep === 5) {
    return (
      <div className="space-y-8">
        <StepHeader
          icon={<CreditCard size={22} />}
          title="Review & Payment"
          subtitle="Confirm your selection and complete enrollment"
        />

        {stepError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm">
            <AlertCircle size={18} /> {stepError}
          </div>
        )}

        {/* Order Summary */}
        <div className="relative p-6 bg-purple-600 text-white rounded-[2rem] shadow-xl shadow-purple-200 overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-purple-200 mb-2">
              <ShieldCheck size={16} />
              <span className="font-bold uppercase text-[10px] tracking-widest">Your Order</span>
            </div>
            <h3 className="text-2xl font-black">{currentPlan.label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">${currentPlan.price}</span>
              <span className="text-purple-200 font-bold text-xs uppercase tracking-widest">one-time</span>
            </div>
            <p className="text-purple-200 text-sm font-bold">
              {currentPlan.courseQuota === Infinity ? "Full access to all GBI courses" : `Access to ${currentPlan.courseQuota} courses of your choice`}
            </p>

            {/* Personal summary */}
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
              <div>
                <p className="text-purple-300 text-[10px] font-bold uppercase">Name</p>
                <p className="text-white font-black text-sm">{collectedData.name || "—"}</p>
              </div>
              <div>
                <p className="text-purple-300 text-[10px] font-bold uppercase">Email</p>
                <p className="text-white font-bold text-sm break-all">{collectedData.email || "—"}</p>
              </div>
            </div>

            {/* ── Commented-out: Selected courses summary ──────────────────────
            // Restore when the course step is re-enabled.
            //
            // {selectedCourses.length > 0 && (
            //   <div className="mt-3 flex flex-wrap gap-2">
            //     {selectedCourses.map(id => {
            //       const course = courses.find(c => c._id === id);
            //       return (
            //         <span key={id} className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold flex items-center gap-1 border border-white/10">
            //           <CheckCircle2 size={10} /> {course?.title.substring(0, 22)}...
            //         </span>
            //       );
            //     })}
            //   </div>
            // )}
            ──────────────────────────────────────────────────────────────── */}
          </div>
          <div className="absolute top-0 right-0 p-8 text-white/5 opacity-20 pointer-events-none">
            <ShieldCheck size={160} />
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Verser un montant spécifique</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase">Balance: ${currentPlan.price}</span>
          </div>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">$</span>
            <input
              type="number"
              min={10}
              max={currentPlan.price}
              value={customAmount || ""}
              onChange={(e) => setCustomAmount(Math.min(currentPlan.price, Math.max(0, Number(e.target.value))))}
              className="w-full h-16 pl-12 pr-6 bg-white border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-900 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
              placeholder="0.00"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase text-center">Indiquez le montant que vous souhaitez payer aujourd'hui.</p>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-4">
          <h3 className="text-center font-black text-slate-800 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            <CreditCard size={18} className="text-purple-600" /> Choose payment method
          </h3>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                paymentMethod === "card" ? "border-purple-600 bg-purple-50" : "border-slate-100 hover:border-purple-100"
              }`}
            >
              <Lock size={24} className={paymentMethod === "card" ? "text-purple-600" : "text-slate-300"} />
              <span className={`font-black uppercase text-xs tracking-widest ${paymentMethod === "card" ? "text-purple-900" : "text-slate-500"}`}>
                Card (Stripe)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("paypal")}
              className={`flex-1 p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                paymentMethod === "paypal" ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-blue-100"
              }`}
            >
              <div className={paymentMethod === "paypal" ? "text-blue-600" : "text-slate-300"}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.54h7.947c1.513 0 2.754.365 3.72 1.082 1.25.928 1.888 2.344 1.888 4.212 0 2.856-1.542 5.33-4.585 5.33h-1.457c-.45 0-.832.312-.911.753l-.033.187-.532 3.007c-.053.298-.314.516-.617.516h-3.926zm12.39-12.016c0-3.328-2.618-4.792-5.746-4.792H5.576L2.61 20.668h3.844l1.292-7.24a.64.64 0 0 1 .632-.527h2.247c3.964 0 7.291-1.74 7.291-3.58z" />
                </svg>
              </div>
              <span className={`font-black uppercase text-xs tracking-widest ${paymentMethod === "paypal" ? "text-blue-900" : "text-slate-500"}`}>
                PayPal
              </span>
            </button>
          </div>

          {/* Dynamic Action Zone */}
          <div className="p-2 border-2 border-slate-100 rounded-[2rem] bg-white min-h-[90px] flex items-center justify-center overflow-hidden">
            {paymentMethod === "card" && (
              <button
                onClick={handleStripePayment}
                disabled={isProcessing}
                className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                Pay Securely · ${currentPlan.price}
              </button>
            )}
            {paymentMethod === "paypal" && (
              <div className="w-full max-w-sm">
                {PAYPAL_CLIENT_ID ? (
                  <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
                    <PayPalButtons
                      style={{ layout: "horizontal", height: 52, color: "blue", shape: "rect", label: "pay" }}
                      createOrder={createPayPalOrder}
                      onApprove={onPayPalApprove}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <div className="text-xs text-red-500 font-bold bg-red-50 p-4 rounded-xl border border-red-100">
                    PayPal Client ID is missing. Please check your .env.local file.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 text-slate-500">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold leading-snug uppercase tracking-tight">{securityNote}</p>
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} /> Change plan
        </button>
      </div>
    );
  }

  return null;
};

// ─── Course Selector — Commented Out ────────────────────────────────────────
// This component can be re-enabled when the "Choose Courses" step is restored.
// To restore: add Step 5 (Courses) back in ApplyClient WIZARD_STEPS, and pass
// selectedCourses + onToggleCourse props through the chain.
//
// export function CourseSelector({
//   plans, courses, selectedPlan, selectedCourses, onToggleCourse, onPlanChange,
// }: {
//   plans: Plan[];
//   courses: CourseType[];
//   selectedPlan: string;
//   selectedCourses: string[];
//   onToggleCourse: (id: string) => void;
//   onPlanChange: (id: string) => void;
// }) {
//   const currentPlan = plans.find((p) => p.id === selectedPlan)!;
//   const quota = currentPlan.courseQuota;
//   const used = selectedCourses.length;
//
//   return (
//     <div className="space-y-4">
//       <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm">
//         <div className="flex items-center justify-between mb-4">
//           <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
//             <BookOpen size={13} /> Choose Courses
//           </p>
//           <span className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${used >= quota ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-700"}`}>
//             {quota === Infinity ? "Unlimited" : `${used} / ${quota}`}
//           </span>
//         </div>
//         <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
//           {courses.map((course) => {
//             const isSelected = selectedCourses.includes(course._id);
//             const isDisabled = !isSelected && quota !== Infinity && used >= quota;
//             return (
//               <button key={course._id} type="button" disabled={isDisabled} onClick={() => onToggleCourse(course._id)}
//                 className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
//                   isSelected ? "border-purple-300 bg-purple-50/50 shadow-sm" : isDisabled ? "border-slate-50 bg-slate-50/30 opacity-40 cursor-not-allowed" : "border-slate-50 bg-slate-50/30 hover:border-purple-100 cursor-pointer"
//                 }`}
//               >
//                 <div className={`mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-purple-600 bg-purple-600" : "border-slate-300"}`}>
//                   {isSelected && <CheckCircle2 size={12} className="text-white" />}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className={`text-[13px] font-black leading-snug truncate ${isSelected ? "text-purple-900" : isDisabled ? "text-slate-400" : "text-slate-800"}`}>
//                     {course.title}
//                   </p>
//                   <p className="text-[10px] text-slate-400 font-bold tracking-tight mt-1">
//                     {course.level} · {course.lessonsCount} lessons
//                   </p>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }
// ────────────────────────────────────────────────────────────────────────────

export default ApplyForm;
