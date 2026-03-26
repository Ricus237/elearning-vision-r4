"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Heart, 
  Lightbulb, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Flame, 
  Calendar,
  Waves,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ApplyForm = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const plan = formData.get("plan") || "executive";

    // Simulation submission logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push(`/checkout?application=true&plan=${plan}`);
  };

  const inputStyles = "w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all font-medium text-slate-900 bg-slate-50/50";
  const labelStyles = "text-sm font-black uppercase tracking-widest text-slate-400 mb-3 px-1 flex items-center gap-2";


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

        <div className="grid md:grid-cols-3 gap-8">
            {/* Standard Plan */}
            <label className="group relative flex flex-col p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white cursor-pointer hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-50 transition-all duration-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/30">
                <input type="radio" name="plan" value="standard" required className="hidden peer" />
                <div className="absolute top-6 right-6 size-6 border-2 border-slate-200 rounded-full flex items-center justify-center peer-checked:border-purple-600 peer-checked:bg-purple-600 transition-all">
                   <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-all" />
                </div>
                
                <div className="mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Entry Level</span>
                    <h4 className="text-2xl font-black font-serif text-slate-900">Standard Plan</h4>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">$299</span>
                        <span className="text-slate-400 font-bold">/one-time</span>
                    </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-green-500" />
                        Up to 3 Courses
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-green-500" />
                        30 Lessons Total
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-400">
                        <X size={16} />
                        Full Program Access
                    </li>
                </ul>
            </label>

            {/* Premium Plan */}
            <label className="group relative flex flex-col p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white cursor-pointer hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-50 transition-all duration-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/30">
                <input type="radio" name="plan" value="premium" required className="hidden peer" />
                <div className="absolute top-6 right-6 size-6 border-2 border-slate-200 rounded-full flex items-center justify-center peer-checked:border-purple-600 peer-checked:bg-purple-600 transition-all">
                   <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-all" />
                </div>
                
                <div className="mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Advanced Access</span>
                    <h4 className="text-2xl font-black font-serif text-slate-900">Premium Plan</h4>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">$499</span>
                        <span className="text-slate-400 font-bold">/one-time</span>
                    </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-green-500" />
                        6 Choice Courses
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-green-500" />
                        Academic Resources
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                        <CheckCircle2 size={16} className="text-green-500" />
                        Spiritual Mentorship
                    </li>
                </ul>
            </label>

            {/* Executive Plan */}
            <label className="group relative flex flex-col p-8 border-2 border-purple-600 rounded-[2.5rem] bg-purple-600 text-white cursor-pointer shadow-2xl shadow-purple-600/20 transform hover:-translate-y-2 transition-all duration-500">
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="px-6 py-2 bg-white text-purple-700 font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg border border-purple-100">
                        Most Recommended
                    </span>
                </div>
                <input type="radio" name="plan" value="executive" required className="hidden peer" defaultChecked />
                <div className="absolute top-6 right-6 size-6 border-2 border-white/30 rounded-full flex items-center justify-center peer-checked:bg-white transition-all">
                   <CheckCircle2 size={14} className="text-purple-600 opacity-0 peer-checked:opacity-100 transition-all" />
                </div>
                
                <div className="mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-200 mb-2 block">Kingdom Leadership</span>
                    <h4 className="text-2xl font-black font-serif">Executive Plan</h4>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">$999</span>
                        <span className="text-purple-200 font-bold">/one-time</span>
                    </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm font-bold">
                        <CheckCircle2 size={16} className="text-purple-200" />
                        Full 1-Year Program
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold">
                        <CheckCircle2 size={16} className="text-purple-200" />
                        Kingdom Foundations
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold">
                        <CheckCircle2 size={16} className="text-purple-200" />
                        Global Leader Cert.
                    </li>
                    <li className="flex items-center gap-3 text-sm font-bold">
                        <CheckCircle2 size={16} className="text-purple-200" />
                        Direct Admin Access
                    </li>
                </ul>
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
