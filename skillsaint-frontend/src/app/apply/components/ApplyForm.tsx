"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Flame, Lightbulb, ChevronDown, ChevronUp,
  CheckCircle2, X, BookOpen, CreditCard, Send,
  ShieldCheck, Lock, AlertCircle, Loader2, ArrowLeft, Mail, Phone, Calendar, MapPin
} from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
// import { coursesData } from "@/components/courses/courseData";
import { CourseType } from "@/types/CourseType";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { saveApplication } from "@/lib/data";

// ─── Plan config ─────────────────────────────────────────────────────────────
// PLANS moved to props

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

// ─── Field styles ─────────────────────────────────────────────────────────────
const INPUT =
  "w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all font-medium text-slate-900 bg-slate-50/50 text-sm";
const LABEL = "text-sm font-semibold text-slate-700 mb-1.5 block";

// ─── Collapsible Section ───────────────────────
function CollapsibleSection({
  index,
  title,
  icon,
  isOpen,
  hasError,
  onToggle,
  children,
}: {
  index: number;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  hasError?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        hasError
          ? "border-red-400 bg-red-50/30"
          : isOpen
          ? "border-purple-200 bg-white"
          : "border-slate-100 bg-white hover:border-purple-100"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
              isOpen ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600"
            }`}
          >
            {icon}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Step {index}
            </span>
            <h3 className="font-black text-slate-900 text-base leading-tight">{title}</h3>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-purple-600" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>

      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-6 pt-1 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ApplyForm = ({
  plans,
  courses,
  selectedPlan,
  selectedCourses,
  onPlanChange,
  onToggleCourse,
  isReviewing,
  setIsReviewing,
}: {
  plans: any[];
  courses: CourseType[];
  selectedPlan: string;
  selectedCourses: string[];
  onPlanChange: (id: string) => void;
  onToggleCourse: (id: string) => void;
  isReviewing: boolean;
  setIsReviewing: (val: boolean) => void;
}) => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // User form data state for the summary
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Sections state
  const [openSections, setOpenSections] = useState<boolean[]>([true, false, false]);
  const [sectionErrors, setSectionErrors] = useState<boolean[]>([false, false, false]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const currentPlan = plans.find((p) => p.id === selectedPlan)!;
  const quota = currentPlan.courseQuota;

  const toggleSection = (i: number) => {
    setOpenSections((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleReviewStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const form = formRef.current;
    if (!form) return;

    // Pull form data
    const data = new FormData(form);
    const obj: Record<string, string> = {};
    data.forEach((value, key) => {
      obj[key] = value.toString();
    });
    setFormData(obj);

    // Validate
    const errors = [false, false, false];
    for (let s = 1; s <= 3; s++) {
      const section = form.querySelector(`section[data-section="${s}"]`);
      if (section) {
        const requiredFields = section.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          "input[required], textarea[required], select[required]"
        );
        requiredFields.forEach((field) => {
          if (!field.value || field.value.trim() === "") errors[s - 1] = true;
        });
      }
    }

    if (errors.some(Boolean)) {
      setSectionErrors(errors);
      setOpenSections((prev) => prev.map((v, i) => errors[i] ? true : v));
      setSubmitError("Please fill out all required fields before proceeding.");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setSectionErrors([false, false, false]);
    
    // Save to Moodle before reviewing
    const normalizedEmail = obj.email.trim().toLowerCase();
    localStorage.setItem('pending_application_email', normalizedEmail);
    await saveApplication({ ...obj, email: normalizedEmail }, selectedPlan, selectedCourses);
    
    setIsReviewing(true);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── Stripe Payment ────────────────────────────────────────────────────────
  const handleStripePayment = async () => {
    setIsProcessing(true);
    setSubmitError("");

    try {
      const match = document.cookie.match(/moodle_user_id=([^;]+)/);
      const userId = match ? match[1] : "";

      const res = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isApplication: true,
          plan: selectedPlan,
          courses: selectedCourses.join(","),
          amount: currentPlan.price,
          currency: "USD",
          userId: userId,
          courseTitle: currentPlan.label,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSubmitError(data.error || "Failed to start Stripe checkout.");
        setIsProcessing(false);
      }
    } catch (err) {
      setSubmitError("Network error. Please try again.");
      setIsProcessing(false);
    }
  };

  // ─── PayPal Payment ────────────────────────────────────────────────────────
  const createPayPalOrder = useCallback(async () => {
    const match = document.cookie.match(/moodle_user_id=([^;]+)/);
    const userId = match ? match[1] : "";

    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isApplication: true,
        plan: selectedPlan,
        courses: selectedCourses,
        amount: currentPlan.price,
        currency: "USD",
        userId: userId,
        courseTitle: currentPlan.label,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.orderID;
  }, [selectedPlan, selectedCourses, currentPlan]);

  const onPayPalApprove = useCallback(async (data: { orderID: string }) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID, isApplication: true }),
      });
      const result = await res.json();
      if (result.success) router.push("/success?method=paypal");
      else setSubmitError(result.error || "Payment capture failed.");
    } catch {
      setSubmitError("Network error during capture.");
    } finally {
      setIsProcessing(false);
    }
  }, [router]);


  if (isReviewing) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Progress Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsReviewing(false)} 
            className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-black font-serif text-slate-900">Review My Application</h2>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm">
            <AlertCircle size={20} /> {submitError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
           {/* Section 1: User details */}
           <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <User size={18} />
                <span className="font-bold uppercase text-[10px] tracking-widest">Identity</span>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Full Name</p>
                <p className="text-slate-900 font-black">{formData.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-slate-400 text-xs font-bold uppercase mb-1">Email</p>
                   <p className="text-slate-900 font-bold text-sm break-all">{formData.email}</p>
                </div>
                <div>
                   <p className="text-slate-400 text-xs font-bold uppercase mb-1">Phone</p>
                   <p className="text-slate-900 font-bold text-sm">{formData.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Address</p>
                <p className="text-slate-900 font-bold text-sm">{formData.address}</p>
              </div>
           </div>

           {/* Section 2: Selected Plan */}
           <div className="relative p-6 bg-purple-600 text-white rounded-[2rem] shadow-xl shadow-purple-200 overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-purple-100 mb-2">
                  <ShieldCheck size={18} />
                  <span className="font-bold uppercase text-[10px] tracking-widest text-purple-200">Current Order</span>
                </div>
                <h3 className="text-2xl font-black font-serif">{currentPlan.label}</h3>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black">${currentPlan.price}</span>
                   <span className="text-purple-200 font-bold text-xs uppercase tracking-widest opacity-80">one-time</span>
                </div>
                <div className="pt-2">
                   <p className="text-purple-100 text-xs font-bold uppercase mb-2">Courses selected</p>
                   <div className="flex flex-wrap gap-2">
                      {selectedCourses.length > 0 ? (
                        selectedCourses.map(id => {
                          const course = courses.find(c => c._id === id);
                          return (
                            <span key={id} className="px-2 py-1 bg-white/10 rounded flex items-center gap-1 text-[10px] font-bold border border-white/10">
                               <CheckCircle2 size={10} /> {course?.title.substring(0, 20)}...
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-purple-300 italic text-sm">No specific courses chosen yet</span>
                      )}
                   </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 text-white/5 opacity-20 pointer-events-none">
                 <ShieldCheck size={160} />
              </div>
           </div>
        </div>

        {/* Spiritual Review */}
        <div className="p-6 bg-white border border-slate-200 rounded-[2rem] space-y-4">
           <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Flame size={18} />
                <span className="font-bold uppercase text-[10px] tracking-widest">Spiritual Intent</span>
           </div>
           <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Goals & Motivation</p>
              <p className="text-slate-700 italic text-sm leading-relaxed">&ldquo;{formData.enrollment_motivation}&rdquo;</p>
           </div>
        </div>

        {/* Final Payment Chooser */}
        <div className="pt-4 border-t border-slate-100 space-y-6">
           <h3 className="text-center font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
              <CreditCard size={20} className="text-purple-600" /> Choose payment method
           </h3>

           <div className="flex flex-col sm:flex-row gap-4">
               <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'card' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-purple-100'}`}
               >
                  <Lock size={24} className={paymentMethod === 'card' ? 'text-purple-600' : 'text-slate-300'} />
                  <span className={`font-black uppercase text-xs tracking-widest ${paymentMethod === 'card' ? 'text-purple-900' : 'text-slate-500'}`}>Card (Stripe)</span>
               </button>
               <button 
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex-1 p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-100'}`}
               >
                  <div className={paymentMethod === 'paypal' ? 'text-blue-600' : 'text-slate-300'}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.54h7.947c1.513 0 2.754.365 3.72 1.082 1.25.928 1.888 2.344 1.888 4.212 0 2.856-1.542 5.33-4.585 5.33h-1.457c-.45 0-.832.312-.911.753l-.033.187-.532 3.007c-.053.298-.314.516-.617.516h-3.926zm12.39-12.016c0-3.328-2.618-4.792-5.746-4.792H5.576L2.61 20.668h3.844l1.292-7.24a.64.64 0 0 1 .632-.527h2.247c3.964 0 7.291-1.74 7.291-3.58z" /></svg>
                  </div>
                  <span className={`font-black uppercase text-xs tracking-widest ${paymentMethod === 'paypal' ? 'text-blue-900' : 'text-slate-500'}`}>PayPal</span>
               </button>
           </div>

           {/* Dynamic Action Zone */}
           <div className="p-2 border-2 border-slate-100 rounded-[2.5rem] bg-white min-h-[100px] flex items-center justify-center overflow-hidden">
              {paymentMethod === 'card' && (
                <button
                  onClick={handleStripePayment}
                  disabled={isProcessing}
                  className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  Pay Securely with Card
                </button>
              )}
              {paymentMethod === 'paypal' && (
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
                       PayPal Client ID is missing in environment variables. Please check your .env.local file.
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleReviewStep} noValidate className="space-y-6">
      
      {/* Global validation error banner */}
      {submitError && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          {submitError}
        </div>
      )}

      <div className="space-y-4">
        {/* Section 1: Personal Info */}
        <CollapsibleSection index={1} title="Personal Information" icon={<User size={18} />} isOpen={openSections[0]} hasError={sectionErrors[0]} onToggle={() => toggleSection(0)}>
          <section data-section="1" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Full Name <span className="text-red-500">*</span></label>
                <input required name="name" type="text" className={INPUT} placeholder="First and Last name" />
              </div>
              <div>
                <label className={LABEL}>Preferred Name</label>
                <input name="nickname" type="text" className={INPUT} placeholder="What should we call you?" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Date of Birth <span className="text-red-500">*</span></label>
                <input required name="dob" type="date" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email <span className="text-red-500">*</span></label>
                <input required name="email" type="email" className={INPUT} placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label className={LABEL}>Phone <span className="text-red-500">*</span></label>
              <input required name="phone" type="tel" className={INPUT} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className={LABEL}>Mailing Address <span className="text-red-500">*</span></label>
              <textarea required name="address" rows={2} className={INPUT} placeholder="City, State/Province, Country" />
            </div>
          </section>
        </CollapsibleSection>

        {/* Section 2: Spiritual Background */}
        <CollapsibleSection index={2} title="Spiritual Background" icon={<Flame size={18} />} isOpen={openSections[1]} hasError={sectionErrors[1]} onToggle={() => toggleSection(1)}>
          <section data-section="2" className="space-y-4">
            <div>
              <label className={LABEL}>Current relationship with God <span className="text-red-500">*</span></label>
              <textarea required name="relationship_description" rows={3} className={INPUT} placeholder="Describe your daily walk and prayer life..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Time as a believer <span className="text-red-500">*</span></label>
                <input required name="believer_duration" type="text" className={INPUT} placeholder="e.g. 5+ years" />
              </div>
              <div>
                <label className={LABEL}>Baptism <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-sm font-bold transition-all has-[:checked]:bg-purple-600 has-[:checked]:text-white has-[:checked]:border-purple-600 shadow-sm">
                    <input type="checkbox" name="baptism-water" className="hidden" /> Water
                  </label>
                  <label className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-sm font-bold transition-all has-[:checked]:bg-purple-600 has-[:checked]:text-white has-[:checked]:border-purple-600 shadow-sm">
                    <input type="checkbox" name="baptism-spirit" className="hidden" /> Spirit
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className={LABEL}>Ministry experience <span className="text-red-500">*</span></label>
              <textarea required name="ministry_experience" rows={2} className={INPUT} placeholder="Prayer, Bible study, ministry roles..." />
            </div>
            <div>
              <label className={LABEL}>Church involvement</label>
              <input name="church_name" type="text" className={INPUT} placeholder="Name of your local church or community" />
            </div>
          </section>
        </CollapsibleSection>

        {/* Section 3: Goals & Motivation */}
        <CollapsibleSection index={3} title="Goals & Motivation" icon={<Lightbulb size={18} />} isOpen={openSections[2]} hasError={sectionErrors[2]} onToggle={() => toggleSection(2)}>
          <section data-section="3" className="space-y-4">
            <div>
              <label className={LABEL}>Why enroll in IBI? <span className="text-red-500">*</span></label>
              <textarea required name="enrollment_motivation" rows={3} className={INPUT} placeholder="Your primary motivation..." />
            </div>
            <div>
              <label className={LABEL}>Areas of spiritual growth <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {["Scripture", "Presence", "Gifts & Fruit", "Wisdom"].map((area) => (
                  <label key={area} className="flex items-center gap-2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-[13px] font-bold has-[:checked]:bg-purple-50 has-[:checked]:border-purple-500 has-[:checked]:text-purple-700 transition-all shadow-sm">
                    <input type="checkbox" name="growth-area" value={area} className="size-4 accent-purple-600" /> {area}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Ministry aspirations <span className="text-red-500">*</span></label>
              <textarea required name="ministry_aspirations" rows={2} className={INPUT} placeholder="Where do you see yourself after this program?" />
            </div>
            <div>
              <label className={LABEL}>Gifts or leadership areas to develop <span className="text-red-500">*</span></label>
              <input required name="leadership_goals" type="text" className={INPUT} placeholder="e.g. Prophecy, Teaching, Administration" />
            </div>
          </section>
        </CollapsibleSection>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-5 bg-slate-900 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Review Application <ArrowLeft size={20} className="rotate-180" />
        </button>
        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
           Secure Enrollment step 1/2
        </p>
      </div>
    </form>
  );
};

// ─── Course Selector (Right Panel) ───────────────────────────────────────────
export function CourseSelector({
  plans,
  courses,
  selectedPlan,
  selectedCourses,
  onToggleCourse,
  onPlanChange,
}: {
  plans: any[];
  courses: CourseType[];
  selectedPlan: string;
  selectedCourses: string[];
  onToggleCourse: (id: string) => void;
  onPlanChange: (id: string) => void;
}) {
  const currentPlan = plans.find((p) => p.id === selectedPlan)!;
  const quota = currentPlan.courseQuota;
  const used = selectedCourses.length;

  return (
    <div className="space-y-4">
      {/* Plan selector */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Step 4: Enrollment Plan</p>
        <div className="space-y-3">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                selectedPlan === plan.id ? plan.activeColor + " bg-white shadow-md font-black" : "border-slate-50 bg-slate-50/30 hover:border-purple-100"
              }`}
            >
              <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => onPlanChange(plan.id)} className="hidden" />
              {selectedPlan === plan.id && <BorderBeam size={200} duration={8} />}
              <div className="flex items-center gap-3">
                <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === plan.id ? "border-purple-600 bg-purple-600" : "border-slate-300"}`}>
                  {selectedPlan === plan.id && <div className="size-2 rounded-full bg-white opacity-100" />}
                </div>
                <div>
                  <span className="text-slate-900 text-sm whitespace-nowrap">{plan.label}</span>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                    {plan.courseQuota === Infinity ? "Full Program" : `${plan.courseQuota} Courses`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg text-slate-900">${plan.price}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <BookOpen size={13} /> Step 5: Choice Courses
          </p>
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${used >= quota ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-700"}`}>
              {quota === Infinity ? "Unlimited" : `${used} / ${quota}`}
          </span>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {courses.map((course) => {
            const isSelected = selectedCourses.includes(course._id);
            const isDisabled = !isSelected && quota !== Infinity && used >= quota;

            return (
              <button key={course._id} type="button" disabled={isDisabled} onClick={() => onToggleCourse(course._id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected ? "border-purple-300 bg-purple-50/50 shadow-sm" : isDisabled ? "border-slate-50 bg-slate-50/30 opacity-40 cursor-not-allowed" : "border-slate-50 bg-slate-50/30 hover:border-purple-100 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                <div className={`mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-purple-600 bg-purple-600" : "border-slate-300"}`}>
                  {isSelected && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-black leading-snug truncate ${isSelected ? "text-purple-900" : isDisabled ? "text-slate-400" : "text-slate-800"}`}>
                    {course.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight mt-1">{course.level} · {course.lessonsCount} lessons</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// export { PLANS };
export default ApplyForm;
