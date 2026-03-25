"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Sun
} from "lucide-react";

import { Rays } from "@/components/magicui/rays";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Dynamic Header */}
      <motion.header
        style={{ backgroundColor: `rgba(255, 255, 255, ${isScrolled ? 0.9 : 0})` }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
          isScrolled ? "py-4 shadow-sm border-b border-slate-200" : "py-6"
        }`}
      >
        <div className="container px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="size-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-105 transition-transform">
              <BookOpen size={24} />
            </div>
            <span className={`text-xl font-black tracking-tight font-serif ${isScrolled ? "text-slate-900" : "text-slate-900"}`}>
              International Bible Institute
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-medium">
            <Link href="/programs" className="text-slate-600 hover:text-purple-600 transition-colors">Programs</Link>
            <Link href="/about" className="text-slate-600 hover:text-purple-600 transition-colors">About</Link>
            <Link href="/apply" className="px-6 py-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-0.5 active:translate-y-0">
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
      <section className="relative pt-40 pb-32 overflow-hidden bg-slate-50">
        <Rays className="opacity-60 scale-110" />

        <div className="container px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full  font-bold text-xs uppercase tracking-widest mb-8"
            >
              {/* <Zap size={14} className="fill-purple-600" />
              Empowering Spiritual Leaders */}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] font-serif mb-8 tracking-tight"
            >
              International <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Bible Institute</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl lg:text-2xl text-slate-600 leading-relaxed mb-12 max-w-3xl mx-auto font-medium italic"
                >
                  A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Link href="/apply" className="group w-full sm:w-auto px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0">
                Enroll Now and Begin Your Journey 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Highlights Grid */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-24 text-left"
            >
              <motion.div variants={fadeIn} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2">
                <div className="size-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 font-serif">Curriculum Overview</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">Discover our Kingdom Foundations program, subjects, and study schedule.</p>
                <Link href="/programs" className="inline-flex items-center gap-2 font-bold text-purple-600 group/btn">
                  Learn More <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              <motion.div variants={fadeIn} className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2">
                <div className="size-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 font-serif">Application Form</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">Ready to join? Start your application process here and join our global community.</p>
                <Link href="/apply" className="inline-flex items-center gap-2 font-bold text-indigo-600 group/btn">
                  Start Application <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 relative overflow-hidden bg-white">
        <Rays className="opacity-40 -top-full scale-125 rotate-180" />

        <div className="container px-6 relative z-10">
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
                <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-6">Our Mission</div>
                <h2 className="text-4xl font-black mb-8 text-slate-900 font-serif leading-tight">To form mature believers and leaders</h2>
                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                  Through deep immersion in the Word of God, daily life in His presence, the transforming work of the Spirit, and the applied wisdom of God in every sphere of life.
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
                <div className="inline-block px-4 py-2 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-sm">Our Vision</div>
                <h2 className="text-4xl font-black mb-8 font-serif leading-tight">To cultivate believers marked by holiness</h2>
                <p className="text-xl text-purple-50 leading-relaxed font-medium">
                  Rooted in Scripture, marked by holiness, empowered by the Spirit, and guided by divine wisdom who reflects Christ in character, clarity, and conviction.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="container px-6 text-center">
          <p className="text-slate-400 font-medium">© {new Date().getFullYear()} International Bible Institute. All rights reserved.</p>
        </div>
      </footer>

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
                <Link href="/apply" onClick={() => setMobileMenuOpen(false)} className="py-4 bg-purple-600 text-white rounded-2xl text-center">Apply Now</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom PWA Install Prompt for Mobiles/Tablets */}
      <InstallPrompt />
    </div>
  );
}
