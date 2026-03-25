"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Target, Eye, Quote, ArrowRight, Sun } from "lucide-react";
import { Rays } from "@/components/magicui/rays";
import Link from "next/link";

const AboutPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden pt-24 pb-32">
      {/* Background Effect */}
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
            Our Identity & Vision
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
                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 font-serif">Welcome Letter from Founder</h2>
                <div className="prose prose-slate lg:prose-lg text-slate-600 leading-relaxed space-y-4">
                  <p>
                    Welcome to the International Bible Institute. We believe that true leadership is born out of a deep and transformative relationship with God. Our institute was founded with a burning desire to see a generation of believers mature in their faith, equipped with the undeniable truth of Scripture.
                  </p>
                  <p>
                    Here, you are not just a student; you are a future leader, called to impact every sphere of society with the wisdom of God. We are committed to providing you with an environment where you can immerse yourself in His presence and be empowered by His Spirit.
                  </p>
                  <p className="font-bold text-purple-700 text-xl font-serif mt-8 italic">
                    &mdash; In Christ, Our Founder
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2 & 3. Mission & Vision Statements */}
        <div className="grid lg:grid-cols-2 gap-8 mb-32">
          {/* Mission */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="group relative p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden hover:-translate-y-2 transition-transform duration-500"
          >
            <div className="absolute top-0 right-0 p-8 text-purple-50 group-hover:scale-110 transition-transform duration-500">
              <Target size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="size-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-purple-200">
                <Heart size={32} />
              </div>
              <h2 className="text-3xl font-black mb-6 text-slate-900 font-serif">Mission Statement</h2>
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                To form mature believers and leaders through deep immersion in the Word of God, daily life in His presence, the transforming work of the Spirit, and the applied wisdom of God in every sphere of life.
              </p>
            </div>
          </motion.div>

          {/* Vision */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="group relative p-12 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-300 overflow-hidden hover:-translate-y-2 transition-transform duration-500"
          >
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:scale-110 transition-transform duration-500">
              <Eye size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="size-16 rounded-2xl bg-purple-500 flex items-center justify-center text-white mb-8 shadow-lg shadow-purple-500/20">
                <Target size={32} />
              </div>
              <h2 className="text-3xl font-black mb-6 font-serif">Vision Statement</h2>
              <p className="text-xl text-purple-100/90 leading-relaxed font-medium">
                To cultivate believers and leaders rooted in Scripture, marked by holiness, empowered by the Spirit, and guided by divine wisdom who reflects Christ in character, clarity, and conviction.
              </p>
            </div>
          </motion.div>
        </div>

        {/* 4. Our Goal */}
        <section className="mb-32">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="text-center max-w-4xl mx-auto p-12 bg-white rounded-[3rem] border border-slate-100 shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent pointer-events-none" />
            <h2 className="text-4xl font-black mb-8 text-slate-900 font-serif relative z-10">Our Goal</h2>
            <p className="text-2xl text-slate-600 leading-relaxed italic relative z-10">
              Raising a generation of leaders who do not just carry a title, but reflect the power and character of God in every sphere of life
            </p>
          </motion.div>
        </section>

        {/* 5. Testimonial (Optional) */}
        <section className="text-center">
          <motion.div
            variants={fadeIn}
            initial="initial"
            whileInView="whileInView"
            className="py-20 border-t border-slate-200"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest mb-12">
              Testimonials
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col items-start text-left gap-6 transition-all duration-300"
              >
                <div className="flex gap-1 text-purple-600">
                  {[...Array(5)].map((_, i) => <Sun key={i} size={16} className="fill-purple-600" />)}
                </div>
                <p className="text-slate-600 italic leading-relaxed">
                  &ldquo;My time at IBI has completely reshaped my understanding of ministry. It's not just about information, it's about transformation.&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center font-black text-purple-600 font-serif">
                    AM
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">Andrew Miller</span>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Kingdom Foundations</span>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial 2 */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-xl flex flex-col items-start text-left gap-6 transition-all duration-300"
              >
                <div className="flex gap-1 text-purple-400">
                  {[...Array(5)].map((_, i) => <Sun key={i} size={16} className="fill-purple-400" />)}
                </div>
                <p className="text-slate-300 italic leading-relaxed">
                  &ldquo;The depth of scripture combined with the practical application of God's wisdom is exactly what I needed for my professional leadership role.&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="size-12 rounded-full bg-purple-500 flex items-center justify-center font-black text-white font-serif shadow-lg shadow-purple-500/20">
                    SJ
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Sarah Jenkins</span>
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Executive Program</span>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial 3 */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col items-start text-left gap-6 transition-all duration-300"
              >
                <div className="flex gap-1 text-purple-600">
                  {[...Array(5)].map((_, i) => <Sun key={i} size={16} className="fill-purple-600" />)}
                </div>
                <p className="text-slate-600 italic leading-relaxed">
                  &ldquo;Finally, an institute that balances theological depth with the fire of the Holy Spirit. Absolute game-changer for my walk.&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 font-serif">
                    DW
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">David Wilson</span>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Ministry Leader</span>
                  </div>
                </div>
              </motion.div>
            </div>
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

export default AboutPage;
