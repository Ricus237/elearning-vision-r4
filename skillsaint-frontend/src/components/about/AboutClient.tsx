/* eslint-disable */

"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Quote, ArrowRight } from "lucide-react";
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
    <main className="min-h-screen bg-slate-50 overflow-hidden pt-10 pb-20">
      <Rays className="opacity-40" />

      <div className="container px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-6">
            About GBI
          </div>
          <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">
            {data.hero_title.split(' ').map((word, i) => (
              <span key={i} className={i >= data.hero_title.split(' ').length - 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600" : ""}>
                {word}{' '}
              </span>
            ))}
          </h1>
        </motion.div>

        {/* 1. Welcome Letter from Founder */}
        <section className="mb-20">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 lg:p-12 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-10 text-slate-50 -z-0">
              <Quote size={160} strokeWidth={1} />
            </div>
            <div className="grid lg:grid-cols-5 gap-10 items-center relative z-10">
              <div className="lg:col-span-2">
                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                  <Image
                    src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2000&auto=format&fit=crop"
                    fill
                    alt="Founder"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-3 space-y-5">
                <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">{data.founder_title}</h2>
                <div className="prose prose-slate text-sm lg:text-base text-slate-600 leading-relaxed space-y-4">
                  {data.founder_content.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                  <div className="pt-4">
                     <p className="font-black text-purple-700 text-lg italic">
                       &mdash; {data.founder_name}
                     </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. Our Goal */}
        <section className="mb-20">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="text-center max-w-3xl mx-auto p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent pointer-events-none" />
            <h2 className="text-3xl lg:text-5xl font-black mb-6 text-slate-900 relative z-10 leading-tight">{data.goal_title}</h2>
            <p className="text-xl text-slate-600 leading-relaxed italic relative z-10">
              "{data.goal_content}"
            </p>
          </motion.div>
        </section>

        {/* Simple Back button */}
        {/* <div className="mt-20 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-slate-900 hover:text-purple-600 transition-colors group">
            <ArrowRight size={20} className="rotate-180" />
            Back to Home
          </Link>
        </div> */}
      </div>
    </main>
  );
};

export default AboutClient;
