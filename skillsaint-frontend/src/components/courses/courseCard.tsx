/* eslint-disable */

"use client";
import { ArrowRight, BookOpen, Clock, Star } from "@/lib/icons";
import Image from "next/image";
import Link from "next/link";
import { CourseType } from "@/types/CourseType";
import { calculateMinutes } from "@/lib/utils";

const CourseCard = ({ 
  course, 
  isLoggedIn, 
  variant = "default",
  categoryName,
  isEnrolled = false
}: { 
  course: CourseType, 
  isLoggedIn?: boolean,
  variant?: "default" | "program",
  categoryName?: string,
  isEnrolled?: boolean
}) => {
  const isProgram = variant === "program";
  const moodleToken = process.env.MOODLE_TOKEN || "";
  const moodleUrl = process.env.MOODLE_URL || "";

  const formatMoodleImageUrl = (course: any, token: string, moodleUrl: string) => {
    // Déterminer la meilleure URL source
    const hasOverview = course.overviewfiles && course.overviewfiles.length > 0;
    let url = course.cover_image || (hasOverview ? course.overviewfiles?.[0].fileurl : course.courseimage) || course.thumbnail;

    if (!url) return null;

    // Détection des images par défaut ou générées (souvent moches ou inaccessibles)
    const isDefault = url.includes('defaultcourse') || 
                      url.includes('placeholder') || 
                      url.includes('generated') || 
                      url.endsWith('.svg') ||
                      url.includes('unsplash');

    if (isDefault) return null;

    // Si l'URL est relative, la rendre absolue
    if (url.startsWith('/')) {
      const base = moodleUrl.endsWith('/') ? moodleUrl.slice(0, -1) : moodleUrl;
      url = `${base}${url}`;
    }

    // Router via le proxy serveur
    if (url.includes('pluginfile.php') || url.includes('moodle')) {
      return `/api/moodle-image?url=${encodeURIComponent(url)}`;
    }

    return url;
  };

  const finalImgSrc = formatMoodleImageUrl(course, moodleToken, moodleUrl)

  // Fallback gradient based on title
  const getGradient = (text: string) => {
    const gradients = [
      'from-purple-600 to-indigo-600',
      'from-blue-600 to-cyan-600',
      'from-emerald-600 to-teal-600',
      'from-orange-600 to-rose-600',
      'from-pink-600 to-purple-600'
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const enrollLink = isProgram ? "/dashboard" : (isLoggedIn 
    ? `/checkout?courseId=${course._id.replace('course-', '')}` 
    : `/register?courseId=${course._id.replace('course-', '')}`);

  return (
    <div className="group relative flex flex-col h-full rounded-[2rem] bg-white p-2 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:-translate-y-2 active:scale-[0.98]">
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-[1.75rem] aspect-[16/9] z-0 bg-gray-100">
        {finalImgSrc ? (
          <Image
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            src={finalImgSrc}
            alt={course.title}
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            unoptimized={true}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient(course.title)} flex items-center justify-center p-6 text-center`}>
            <span className="text-white font-black text-sm uppercase tracking-tighter opacity-40">
              {course.title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          {!isProgram && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/20">
              <Star className="size-3 text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] font-bold text-gray-900 leading-none">5.0</span>
            </div>
          )}
          
          {categoryName && (
            <div className="px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-[0.15em] backdrop-blur-md shadow-xl border border-white/20">
              {categoryName}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 px-3 pt-4 pb-2">
        {/* Course Meta */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
            <BookOpen className="size-3" />
            <span className="text-[10px] font-semibold">{course.lessonsCount} Modules</span>
          </div>
          {!isProgram && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
              <Clock className="size-3" />
              <span className="text-[10px] font-semibold">{calculateMinutes(course.duration || 0)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/courses/${course.slug.current}`}
          className="block mb-4 grow"
        >
          <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-purple-600 transition-colors line-clamp-2 tracking-tight min-h-[2.5rem]">
            {course.title}
          </h3>
        </Link>
        
        {/* Pricing & Footer - Modified for Program variant */}
        <div className={`pt-4 border-t border-gray-100/80 flex items-center ${isProgram ? 'justify-end' : 'justify-between'} mt-auto`}>
          {!isProgram && (
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Prix</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-gray-900">
                  {course.price === 0 ? "Offert" : `$${(course.discountPrice || course.price).toFixed(0)}`}
                </span>
                {course.discountPrice && course.price > 0 && (
                  <del className="text-sm text-gray-300 font-bold tracking-tight">${course.price.toFixed(0)}</del>
                )}
              </div>
            </div>
          )}
          
          <Link 
            href={isEnrolled ? `/dashboard` : enrollLink} 
            className={`group/btn relative px-5 h-11 rounded-xl ${isEnrolled ? 'bg-purple-600' : 'bg-gray-900'} text-white shadow-lg shadow-gray-200 hover:shadow-purple-300 transition-all duration-300 flex items-center justify-center overflow-hidden gap-1.5`}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            <span className="font-bold text-xs relative z-10 px-1">
              {isProgram 
                ? (isEnrolled ? "Accéder" : "S'inscrire") 
                : "Détails"}
            </span>
            <ArrowRight className="size-4 transition-transform duration-500 group-hover/btn:translate-x-1 relative z-10" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
