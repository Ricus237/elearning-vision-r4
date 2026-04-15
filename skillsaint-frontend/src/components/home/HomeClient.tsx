"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  Heart, 
  Zap, 
  FileText,
  GraduationCap,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

import { Rays } from "@/components/magicui/rays";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { CourseType } from "@/types/CourseType";


interface HomeClientProps {
  heroData: {
    title: string;
    description: string;
  };
  courses: CourseType[];
  extraData: {
    hero_badge: string;
    mission: { title: string; content: string };
    vision: { title: string; content: string };
    home_hero_image: string;
    highlights: {
      curriculum_title: string;
      curriculum_desc: string;
      apply_title: string;
      apply_desc: string;
      footer_description: string;
      home_floating: {
        badge_1: string;
        subtitle_1: string;
        badge_2: string;
      };
    };
  };
}


export default function HomeClient({ heroData, extraData }: HomeClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useScroll();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2 }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-100 selection:text-purple-900 font-sans">
      {/* Dynamic Header */}
      <motion.header
        style={{ backgroundColor: `rgba(255, 255, 255, ${isScrolled ? 0.9 : 0})` }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
          isScrolled ? "py-4 shadow-sm border-b border-slate-200" : "py-6"
        }`}
      >
        <div className="container px-6 mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-105 transition-transform">
              <BookOpen size={24} />
            </div>
            <span className={`text-xl font-black tracking-tight font-serif ${isScrolled ? "text-slate-900" : "text-slate-900"}`}>
              {heroData.title}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-medium">
            <Link href="/programs" className="text-slate-600 hover:text-purple-600 transition-colors">Programs</Link>
            <Link href="/about" className="text-slate-600 hover:text-purple-600 transition-colors">About</Link>
            <Link href="/dashboard" className="px-5 py-2.5 text-purple-600 font-bold hover:text-purple-700 transition-all">
              Login
            </Link>
            <Link href="/apply" className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-0.5">
              Apply Now
            </Link>
          </nav>

          <button 
            className="md:hidden p-2 text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-50">
        <Rays className="opacity-60 scale-100" />

        <div className="container px-6 mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Text Content */}
            <div className="text-left z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-8 bg-purple-50 text-purple-600"
              >
                <Zap size={14} className="fill-purple-600" />
                {extraData.hero_badge || "Empowering Spiritual Leaders"}
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] font-serif mb-6 tracking-tight"
              >
                {heroData.title.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i >= heroData.title.split(' ').length - 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600" : ""}>
                    {word}{' '}
                  </span>
                ))}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg lg:text-xl text-slate-600 leading-relaxed mb-10 max-w-xl font-medium italic"
              >
                {heroData.description}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-5"
              >
                <Link href="/apply" className="group w-full sm:w-auto px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0">
                  Enroll Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/programs" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all">
                  Explore Programs
                </Link>
              </motion.div>
            </div>

            {/* Right: Featured Image */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative group">
                {/* Decorative Elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[4rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                
                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-purple-200/50 border-8 border-white">
                    <Image 
                       src={extraData.home_hero_image} 
                       alt="Global Bible Institute Study"
                       width={1000}
                       height={520}
                       className="w-full h-[520px] object-cover hover:scale-105 transition-transform duration-700"
                    />
                   
                   {/* Floating Stats/Badge */}
                   <div className="absolute bottom-10 left-10 p-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                      <div className="size-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                        <Heart size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{extraData.highlights.home_floating.subtitle_1}</p>
                        <p className="text-sm font-bold text-slate-900">{extraData.highlights.home_floating.badge_1}</p>
                      </div>
                   </div>
                </div>

                {/* Floating card 2 */}
                <div className="absolute -top-6 -right-6 p-6 bg-white rounded-3xl shadow-xl border border-slate-50 hidden xl:flex items-center gap-4 animate-float">
                    <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">{extraData.highlights.home_floating.badge_2}</p>
                </div>
              </div>
            </motion.div>

            {/* Highlights Grid (Now full width below columns) */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20 lg:mt-32 text-left lg:col-span-2"
            >
              <motion.div variants={fadeIn} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2">
                <div className="size-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 font-serif">
                  {extraData.highlights?.curriculum_title || "Curriculum Overview"}
                </h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  {extraData.highlights?.curriculum_desc || "Discover our Kingdom Foundations program, subjects, and study schedule."}
                </p>
                <Link href="/programs" className="inline-flex items-center gap-2 font-bold text-purple-600 group/btn">
                  Learn More <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2">
                <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 font-serif">
                  {extraData.highlights?.apply_title || "Application Form"}
                </h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  {extraData.highlights?.apply_desc || "Ready to join? Start your application process here and join our global community."}
                </p>
                <Link href="/apply" className="inline-flex items-center gap-2 font-bold text-indigo-600 group/btn">
                  Start Application <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container px-6 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl text-left">
              <motion.div 
                variants={fadeIn}
                initial="initial"
                whileInView="whileInView"
                className="inline-block px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-6"
              >
                Top Rated Programs
              </motion.div>
              <motion.h2 
                variants={fadeIn}
                initial="initial"
                whileInView="whileInView"
                className="text-4xl lg:text-5xl font-black text-slate-900 font-serif leading-tight mb-4"
              >
                Explore <span className="text-purple-600">Our Courses</span>
              </motion.h2>
              <motion.p 
                variants={fadeIn}
                initial="initial"
                whileInView="whileInView"
                className="text-lg text-slate-500 font-medium max-w-xl"
              >
                Dive into our curriculum designed to equip spiritual leaders with biblical truth and divine wisdom.
              </motion.p>
            </div>
            
            <motion.div
              variants={fadeIn}
              initial="initial"
              whileInView="whileInView"
            >
              <Link href="/programs" className="inline-flex items-center gap-2 group font-bold text-slate-900 py-3 border-b-2 border-slate-900 hover:text-purple-600 hover:border-purple-600 transition-all">
                View All Courses <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {courses.slice(0, 3).map((course, idx) => (
              <motion.div key={course._id} variants={fadeIn} transition={{ delay: idx * 0.1 }}>
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section> */}

      {/* Mission & Vision Section */}
      <section className="py-20 relative overflow-hidden bg-white">
        <Rays className="opacity-40 -top-full scale-125 rotate-180" />

        <div className="container px-6 mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            {/* Mission */}
            <motion.div 
              variants={fadeIn}
              initial="initial"
              whileInView="whileInView"
              className="relative p-12 lg:p-16 rounded-[3rem] bg-white/60 border border-slate-100 backdrop-blur-xl overflow-hidden flex flex-col justify-center shadow-sm"
            >
              <div className="absolute top-0 right-0 p-8 text-slate-200/50">
                <Heart size={120} strokeWidth={1} />
              </div>
              <div className="relative">
                <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-6">{extraData.mission.title}</div>
                <h2 className="text-4xl font-black mb-8 text-slate-900 font-serif leading-tight">{extraData.mission.title}</h2>
                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                  {extraData.mission.content}
                </p>
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div 
              variants={fadeIn}
              initial="initial"
              whileInView="whileInView"
              className="relative p-12 lg:p-16 rounded-[3rem] bg-purple-600 text-white overflow-hidden flex flex-col justify-center shadow-2xl shadow-purple-100"
            >
              <div className="absolute top-0 right-0 p-8 text-white/10">
                <ShieldCheck size={120} strokeWidth={1} />
              </div>
              <div className="relative">
                <div className="inline-block px-4 py-2 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-sm">{extraData.vision.title}</div>
                <h2 className="text-4xl font-black mb-8 font-serif leading-tight">{extraData.vision.title}</h2>
                <p className="text-xl text-purple-50 leading-relaxed font-medium">
                  {extraData.vision.content}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white p-12 flex flex-col gap-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button className="self-end p-2" onClick={() => setMobileMenuOpen(false)}><X size={32} /></button>
              <div className="flex flex-col gap-6 text-2xl font-bold font-serif">
                <Link href="/programs" onClick={() => setMobileMenuOpen(false)}>Programs</Link>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-4 border-2 border-slate-100 text-slate-900 rounded-2xl text-center text-lg">
                    Student Login
                  </Link>
                  <Link href="/apply" onClick={() => setMobileMenuOpen(false)} className="py-4 bg-purple-600 text-white rounded-2xl text-center text-lg">
                    Apply Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallPrompt />
    </div>
  );
}
