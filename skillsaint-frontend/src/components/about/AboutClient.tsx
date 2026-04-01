"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Target, Eye, Quote, ArrowRight, Sun } from "lucide-react";
import { Rays } from "@/components/magicui/rays";
import Link from "next/link";

interface AboutClientProps {
  data: {
    hero_title: string;
    founder_title: string;
    founder_content: string;
    founder_name: string;
    goal_title: string;
    goal_content: string;
  }
}

const AboutClient = ({ data }: AboutClientProps) => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden pt-24 pb-32">
      <Rays className="opacity-40" />

      <div className="container px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-6">
            About IBI
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 font-serif leading-tight">
            {data.hero_title}
          </h1>
        </motion.div>

        {/* 1. Welcome Letter from Founder */}
        <section className="mb-32">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 lg:p-16 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-12 text-slate-50 -z-0">
              <Quote size={200} strokeWidth={1} />
            </div>
            <div className="grid lg:grid-cols-5 gap-12 items-center relative z-10">
              <div className="lg:col-span-2">
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                  <Image
                    src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2000&auto=format&fit=crop"
                    fill
                    alt="Founder"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-3 space-y-6">
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 font-serif">{data.founder_title}</h2>
                <div className="prose prose-slate lg:prose-lg text-slate-600 leading-relaxed space-y-4">
                  {data.founder_content.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                  <p className="font-bold text-purple-700 text-xl font-serif mt-8 italic">
                    &mdash; {data.founder_name}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. Our Goal */}
        <section className="mb-32">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="text-center max-w-4xl mx-auto p-12 bg-white rounded-[3rem] border border-slate-100 shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent pointer-events-none" />
            <h2 className="text-4xl font-black mb-8 text-slate-900 font-serif relative z-10">{data.goal_title}</h2>
            <p className="text-2xl text-slate-600 leading-relaxed italic relative z-10">
              {data.goal_content}
            </p>
          </motion.div>
        </section>

        {/* Simple Back button */}
        <div className="mt-20 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-slate-900 hover:text-purple-600 transition-colors group">
            <ArrowRight size={20} className="rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AboutClient;
