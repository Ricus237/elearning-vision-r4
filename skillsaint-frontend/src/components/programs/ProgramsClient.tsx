"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  Video, 
  Lightbulb, 
  ArrowRight,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { Rays } from "@/components/magicui/rays";
import { CourseType } from "@/types/CourseType";
import { CategoryType } from "@/types/CategoryType";
import ProgramCourseCard from "@/components/programs/ProgramCourseCard";

interface ProgramsClientProps {
  data: {
    hero_title: string;
    hero_desc: string;
    hero_image: string;
    core_title: string;
    core_items: string[];
    floating: {
      badge_1: string;
      subtitle_1: string;
      badge_2: string;
    }
  };
  courses: CourseType[];
  categories: CategoryType[];
  enrolledCourseIds?: string[];
}

const ProgramsClient = ({ data, courses, categories }: ProgramsClientProps) => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden pb-24 font-inter-tight">
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden bg-slate-50">
        <Rays className="opacity-40 scale-100" />

        <div className="container px-6 mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Text Content */}
            <div className="text-left z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-6 bg-purple-100 text-purple-700"
              >
                Our Curriculum
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-3xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight"
              >
                {data.hero_title.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i >= data.hero_title.split(' ').length - 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600" : ""}>
                    {word}{' '}
                  </span>
                ))}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-base lg:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl font-medium italic"
              >
                {data.hero_desc}
              </motion.p>
            </div>

            {/* Right: Featured Image with Split Layout effects */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative group">
                {/* Decorative Elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[4rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-200/50 border-8 border-white">
                    <Image 
                       src={data.hero_image} 
                       alt="University study session"
                       width={800}
                       height={450}
                       className="w-full h-[450px] object-cover hover:scale-105 transition-transform duration-700 font-sans"
                    />
                   
                   {/* Floating Badge 1 */}
                   <div className="absolute bottom-10 left-10 p-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                      <div className="size-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                        <Heart size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{data.floating.subtitle_1}</p>
                        <p className="text-sm font-bold text-slate-900">{data.floating.badge_1}</p>
                      </div>
                   </div>
                </div>

                {/* Floating Badge 2 */}
                <div className="absolute -top-6 -right-6 p-6 bg-white rounded-3xl shadow-xl border border-slate-50 hidden xl:flex items-center gap-4 animate-float">
                    <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <ShieldCheck size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">{data.floating.badge_2}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container px-6 mx-auto">
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
               
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-8 leading-tight">
                  {data.core_title}
                </h2>
                
                <div className="flex flex-wrap gap-4 mb-12">
                   <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-slate-200">
                      <Calendar size={22} className="text-purple-400" />
                      <span className="text-sm uppercase tracking-widest">1-Year Curriculum</span>
                   </div>
                   <div className="px-6 py-4 bg-purple-100 text-purple-700 rounded-2xl font-bold flex items-center gap-3">
                      <Lightbulb size={22} />
                      <span className="text-sm uppercase tracking-widest">4 Intensive Quarters</span>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 mt-16 pb-8">
                   {/* Lesson Format */}
                   <div className="space-y-8 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100/50">
                      <div className="flex items-center gap-4 text-slate-900">
                         <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                            <Video size={24} className="text-purple-600" />
                         </div>
                         <h3 className="text-2xl font-black tracking-tight">Lesson Format</h3>
                      </div>
                      <ul className="space-y-5">
                         {data.core_items.map((item, i) => (
                            <li key={i} className="flex items-start gap-4 text-lg text-slate-600 font-medium">
                               <div className="size-6 mt-0.5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                                  {i + 1}
                               </div>
                               <span className="leading-tight">{item}</span>
                            </li>
                         ))}
                      </ul>
                   </div>
                </div>

               {/* CTA Buttons */}
               <div className="flex flex-col sm:flex-row items-center gap-6 mt-16">
                  <Link href="/apply" className="group w-full sm:w-auto px-10 py-5 bg-purple-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 hover:-translate-y-1 active:translate-y-0">
                    Apply Now
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>
            </div>
          </motion.div>
        </section>

        {/* All Courses Grouped by Category */}
        <section className="mb-24">
          <div className="mb-16">
            <motion.h2 
              variants={fadeIn}
              initial="initial"
              whileInView="whileInView"
              className="text-3xl lg:text-4xl font-black text-slate-900  mb-4"
            >
              Explore <span className="text-purple-600">All Our Courses</span>
            </motion.h2>
            <motion.p 
              variants={fadeIn}
              initial="initial"
              whileInView="whileInView"
              className="text-slate-500 font-medium max-w-2xl"
            >
              Discover our complete library of academic and spiritual programs designed to equip leaders worldwide.
            </motion.p>
          </div>

          {courses.length === 0 && (
             <div className="p-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest mb-2">No Courses Found</p>
                <p className="text-slate-500">We couldn&apos;t find any courses. Make sure they are public and visible.</p>
             </div>
          )}

          <div className="space-y-24">
            {categories
              .filter(cat => courses.some(c => c.categoryId === parseInt(cat.slug.current)))
              .map((category) => (
                <div key={category._id} className="relative">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="h-px grow bg-slate-200" />
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 shrink-0">
                      {category.title}
                    </h3>
                    <div className="h-px grow bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {courses
                      .filter(c => c.categoryId === parseInt(category.slug.current))
                      .map((course) => (
                        <motion.div 
                          key={course._id}
                          variants={fadeIn}
                          initial="initial"
                          whileInView="whileInView"
                        >
                          <ProgramCourseCard 
                            title={course.title}
                            description={course.shortDescription || ""}
                            thumbnail={course.thumbnail}
                            categoryName={category.title}
                            lessonsCount={course.lessonsCount}
                          />
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            
            {/* Fallback for courses without a matched category */}
            {courses.length > 0 && !categories.some(cat => courses.some(c => c.categoryId === parseInt(cat.slug.current))) && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {courses.map((course) => (
                   <motion.div 
                     key={course._id}
                     variants={fadeIn}
                     initial="initial"
                     whileInView="whileInView"
                   >
                     <ProgramCourseCard
                        title={course.title}
                        description={course.shortDescription || ""}
                        thumbnail={course.thumbnail}
                        categoryName={categories.find(cat => parseInt(cat.slug.current) === course.categoryId)?.title}
                        lessonsCount={course.lessonsCount}
                     />
                   </motion.div>
                 ))}
               </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProgramsClient;
