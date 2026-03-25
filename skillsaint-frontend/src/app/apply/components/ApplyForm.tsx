"use client";

import { useState, useTransition } from "react";
import { 
  User, 
  Heart, 
  Lightbulb, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Flame, 
  Calendar,
  Waves
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ApplyForm = () => {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Simulation submission logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const inputStyles = "w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-slate-900 bg-slate-50/50";
  const labelStyles = "text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-1 flex items-center gap-2";

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 flex flex-col items-center gap-8"
      >
        <div className="size-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-lg shadow-green-100 mb-4 animate-bounce">
           <CheckCircle2 size={48} />
        </div>
        <h3 className="text-4xl font-black font-serif text-slate-900 leading-tight">Application Received!</h3>
        <p className="text-xl text-slate-500 max-w-lg leading-relaxed italic">
          &ldquo;Your application has been successfully submitted. We will review your spiritual journey and notify you via email shortly with access instructions.&rdquo;
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-8 px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Return to Home
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-24">
      {/* Section 1: Personal Information */}
      <section className="space-y-12">
        <div className="flex items-center gap-4 text-slate-900 mb-2">
           <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <User size={24} className="text-slate-600" />
           </div>
           <h3 className="text-3xl font-black font-serif">Section 1: Personal Information</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col">
                <label className={labelStyles}>Full Name *</label>
                <input required type="text" className={inputStyles} placeholder="First and Last name" />
            </div>
            <div className="flex flex-col">
                <label className={labelStyles}>Preferred Name / Nickname</label>
                <input type="text" className={inputStyles} placeholder="What should we call you?" />
            </div>
            <div className="flex flex-col">
                <label className={labelStyles}>Date of Birth *</label>
                <input required type="date" className={inputStyles} />
            </div>
            <div className="flex flex-col">
                <label className={labelStyles}>Email Address *</label>
                <input required type="email" className={inputStyles} placeholder="your@email.com" />
            </div>
            <div className="flex flex-col">
                <label className={labelStyles}>Phone Number *</label>
                <input required type="tel" className={inputStyles} placeholder="+1 (555) 000-0000" />
            </div>
        </div>
        <div className="flex flex-col">
            <label className={labelStyles}>Mailing Address (City, State/Province, Country) *</label>
            <textarea required rows={2} className={inputStyles} placeholder="Where are you currently residing?" />
        </div>
      </section>

      {/* Section 2: Spiritual Background */}
      <section className="space-y-12">
        <div className="flex items-center gap-4 text-slate-900 mb-2">
           <div className="size-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Flame size={24} className="text-purple-600" />
           </div>
           <h3 className="text-3xl font-black font-serif">Section 2: Spiritual Background</h3>
        </div>
        
        <div className="space-y-8">
            <div className="flex flex-col">
                <label className={labelStyles}>Current relationship with God (short text) *</label>
                <textarea required rows={4} className={inputStyles} placeholder="Describe your current daily walk, prayer life, and relationship with the Holy Spirit..." />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <label className={labelStyles}>Length of time as a believer *</label>
                    <input required type="text" className={inputStyles} placeholder="e.g. 5+ years" />
                </div>
                <div className="flex flex-col">
                    <label className={labelStyles}>Baptism in Water / Spirit *</label>
                    <div className="grid grid-cols-2 gap-3">
                       <label className="flex items-center justify-center gap-2 p-4 bg-slate-50/50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-white transition-colors has-[:checked]:bg-purple-600 has-[:checked]:text-white font-bold has-[:checked]:border-purple-600">
                          <input type="radio" name="baptism-water" value="yes" className="hidden" required /> Water Yes
                       </label>
                       <label className="flex items-center justify-center gap-2 p-4 bg-slate-50/50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-white transition-colors has-[:checked]:bg-purple-600 has-[:checked]:text-white font-bold has-[:checked]:border-purple-600">
                          <input type="radio" name="baptism-spirit" value="yes" className="hidden" required /> Spirit Yes
                       </label>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <label className={labelStyles}>Experience in prayer, Bible study, ministry *</label>
                <textarea required rows={3} className={inputStyles} placeholder="Tell us about your previous service or study habits..." />
            </div>
            <div className="flex flex-col">
                <label className={labelStyles}>Church or ministry involvement (Optional)</label>
                <input type="text" className={inputStyles} placeholder="Name of your local church or community..." />
            </div>
        </div>
      </section>

      {/* Section 3: Learning Goals & Motivation */}
      <section className="space-y-12">
        <div className="flex items-center gap-4 text-slate-900 mb-2">
           <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Lightbulb size={24} className="text-indigo-600" />
           </div>
           <h3 className="text-3xl font-black font-serif">Section 3: Learning Goals & Motivation</h3>
        </div>
        
        <div className="space-y-8">
            <div className="flex flex-col">
                <label className={labelStyles}>Why do you want to enroll in IBI? *</label>
                <textarea required rows={3} className={inputStyles} placeholder="Your primary motivation for joining this institute..." />
            </div>
            
            <div className="flex flex-col">
                <label className={labelStyles}>Areas of spiritual growth to focus on *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {["Scripture", "Presence", "Gifts & Fruit", "Wisdom"].map((area) => (
                       <label key={area} className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-200 rounded-2xl cursor-pointer hover:border-purple-300 transition-all has-[:checked]:bg-purple-50 has-[:checked]:border-purple-600 has-[:checked]:text-purple-700 font-bold">
                          <input type="checkbox" name="growth-area" value={area.toLowerCase()} className="size-5 text-purple-600 rounded-lg" />
                          {area}
                       </label>
                    ))}
                </div>
            </div>

            <div className="flex flex-col">
                <label className={labelStyles}>Personal goals for the course and ministry aspirations *</label>
                <textarea required rows={3} className={inputStyles} placeholder="Where do you see yourself after finishing this program?" />
            </div>

            <div className="flex flex-col">
                <label className={labelStyles}>Specific spiritual gifts or leadership areas to develop *</label>
                <input required type="text" className={inputStyles} placeholder="e.g. Prophecy, Administration, Teaching..." />
            </div>
        </div>
      </section>

      {/* Section 4: Tuition & Enrollment Plan */}
      <section className="space-y-12">
        <div className="flex items-center gap-4 text-slate-900 mb-2">
           <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ShieldCheck size={24} className="text-slate-600" />
           </div>
           <h3 className="text-3xl font-black font-serif">Tuition & Enrollment Plan</h3>
        </div>

        <div className="grid gap-6">
            <label className="group relative flex items-start gap-6 p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white cursor-pointer hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 transition-all duration-300 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/30">
                <div className="size-6 border-2 border-slate-200 rounded-full shrink-0 flex items-center justify-center group-has-[:checked]:border-purple-600 group-has-[:checked]:bg-purple-600 transition-all">
                   <div className="size-2 bg-white rounded-full opacity-0 group-has-[:checked]:opacity-100 transition-all" />
                </div>
                <input type="radio" name="plan" value="standard" required className="hidden" />
                <div>
                    <h4 className="text-2xl font-black font-serif text-slate-900 mb-2">Standard Plan</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">
                       Up to 3 courses (or 30 lessons total) of your choice. Perfect for focused learning.
                    </p>
                </div>
            </label>

            <label className="group relative flex items-start gap-6 p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white cursor-pointer hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 transition-all duration-300 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/30">
                <div className="size-6 border-2 border-slate-200 rounded-full shrink-0 flex items-center justify-center group-has-[:checked]:border-purple-600 group-has-[:checked]:bg-purple-600 transition-all">
                   <div className="size-2 bg-white rounded-full opacity-0 group-has-[:checked]:opacity-100 transition-all" />
                </div>
                <input type="radio" name="plan" value="premium" required className="hidden" />
                <div>
                    <h4 className="text-2xl font-black font-serif text-slate-900 mb-2">Premium Plan</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">
                       6 courses of your choice. Expanded access to academic and spiritual resources.
                    </p>
                </div>
            </label>

            <label className="group relative flex items-start gap-6 p-10 border-2 border-purple-600 rounded-[3rem] bg-purple-600 text-white cursor-pointer shadow-2xl shadow-purple-200 transform hover:-translate-y-1 transition-all duration-500">
                <div className="absolute -top-4 right-10 px-6 py-2 bg-white text-purple-700 font-black text-xs uppercase tracking-widest rounded-full shadow-lg">
                   Most Recommended
                </div>
                <div className="size-6 border-2 border-white/50 rounded-full shrink-0 flex items-center justify-center group-has-[:checked]:bg-white transition-all mt-1">
                   <div className="size-3 bg-purple-600 rounded-full opacity-0 group-has-[:checked]:opacity-100 transition-all" />
                </div>
                <input type="radio" name="plan" value="executive" required className="hidden" defaultChecked />
                <div>
                    <h4 className="text-3xl font-black font-serif mb-3">Executive Plan</h4>
                    <p className="text-purple-50 text-lg font-medium leading-relaxed">
                       Full one-year Kingdom Foundations program. The complete experience designed for global leadership formation.
                    </p>
                </div>
            </label>
        </div>

        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-700 font-bold">
           <ShieldCheck size={24} />
           <span>Reminder: Tuition fees are non-refundable.</span>
        </div>
      </section>

      {/* Submit Button */}
      <div className="pt-12 flex flex-col items-center gap-6">
         <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto px-16 py-6 bg-slate-900 text-white font-black text-xl rounded-[2rem] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:scale-100"
         >
            {isPending ? (
               <>
                  <Waves className="animate-pulse" />
                  Processing...
               </>
            ) : (
               <>
                  Submit Your Application
                  <Send size={24} className="group-hover:translate-x-1 transition-transform" />
               </>
            )}
         </button>
         <p className="text-slate-400 font-medium italic text-center text-sm px-4">
             Note: Confirmation email sent after submission, instructions for access to courses.
         </p>
      </div>
    </form>
  );
};

export default ApplyForm;
