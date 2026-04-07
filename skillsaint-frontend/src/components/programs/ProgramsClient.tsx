"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  Video, 
  Lightbulb, 
  Globe, 
  ArrowRight
} from "lucide-react";
import { Rays } from "@/components/magicui/rays";

interface ProgramsClientProps {
  data: {
    hero_title: string;
    hero_desc: string;
    core_title: string;
    core_items: string[];
  }
}

const ProgramsClient = ({ data }: ProgramsClientProps) => {
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
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-6">
            Our Curriculum
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 font-serif leading-tight">
            {data.hero_title}
          </h1>
          <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto italic">
            {data.hero_desc}
          </p>
        </motion.div>

        {/* Kingdom Foundations Core Section */}
        <section className="mb-24">
          <motion.div 
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="relative bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 lg:p-16 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 text-purple-50 -z-0">
               <BookOpen size={240} strokeWidth={0.5} />
            </div>

            <div className="relative z-10 max-w-4xl">
               <div className="flex items-center gap-3 text-purple-600 mb-6">
                  <span className="font-black uppercase tracking-widest text-sm">{data.core_title}</span>
               </div>
               
               <h2 className="text-4xl lg:text-6xl font-black text-slate-900 font-serif mb-8">
                 {data.core_title}
               </h2>
               
               <div className="flex flex-wrap gap-4 mb-12">
                  <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2">
                     <Calendar size={20} />
                     1-Year Curriculum
                  </div>
                  <div className="px-6 py-3 bg-purple-100 text-purple-700 rounded-2xl font-bold flex items-center gap-2">
                     <Lightbulb size={20} />
                     4 Quarters
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-12 mt-16">
                  {/* Lesson Format */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 text-slate-900">
                        <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center">
                           <Video size={20} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black font-serif">Lesson Format</h3>
                     </div>
                     <ul className="space-y-4">
                        {data.core_items.map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-lg text-slate-600 font-medium">
                              <div className="size-2 rounded-full bg-purple-400" />
                              {item}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Overview (Fallback to defaults or mapping later if needed) */}
                  {/* <div className="space-y-6">
                     <div className="flex items-center gap-3 text-slate-900">
                        <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center">
                           <Globe size={20} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black font-serif">Strategic Focus</h3>
                     </div>
                     <ul className="space-y-4">
                        {[
                           "Biblical & Strategic Leadership",
                           "Prophetic Strategy & Vision",
                           "Global Reformation Principles"
                        ].map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-lg text-slate-600 font-medium">
                              <div className="size-2 rounded-full bg-indigo-400" />
                              {item}
                           </li>
                        ))}
                     </ul>
                  </div> */}
               </div>

               {/* CTA Buttons */}
               <div className="flex flex-col sm:flex-row items-center gap-6 mt-16">
                  <Link href="/apply" className="group w-full sm:w-auto px-10 py-5 bg-purple-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 hover:-translate-y-1 active:translate-y-0">
                    Apply Now
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  {/* <Link href="/about" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 font-bold rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all">
                    Learn More
                  </Link> */}
               </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
};

export default ProgramsClient;
