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

  const enrollLink = isProgram ? "/dashboard" : (isLoggedIn 
    ? `/checkout?courseId=${course._id.replace('course-', '')}` 
    : `/register?courseId=${course._id.replace('course-', '')}`);

  return (
    <div className="group relative flex flex-col h-full rounded-[2.5rem] bg-white p-3 shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:-translate-y-2 active:scale-[0.98]">
      {/* Image Section */}
      <div className="relative overflow-hidden rounded-[2rem] aspect-[16/10] z-0 bg-gray-100">
        <Image
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          src={course.thumbnail && !course.thumbnail.includes('unsplash') ? course.thumbnail : "https://images.unsplash.com/photo-1504052434569-70ad58165d8f?q=80&w=800&auto=format&fit=crop"}
          alt={course.title}
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          unoptimized={course.thumbnail?.includes('Base64') || course.thumbnail?.startsWith('data:')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
          {!isProgram && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/20">
              <Star className="size-3.5 text-yellow-500 fill-yellow-500" />
              <span className="text-[11px] font-bold text-gray-900 leading-none">5.0</span>
            </div>
          )}
          
          {categoryName && (
            <div className="px-4 py-2 rounded-full bg-slate-900/90 text-white text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur-md shadow-xl border border-white/20">
              {categoryName}
            </div>
          )}

          {!isProgram && (
            <div className="px-3 py-1.5 rounded-full bg-purple-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-purple-400/30">
              {course.level || "Beginner"}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 px-4 pt-6 pb-2">
        {/* Course Meta */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
            <BookOpen className="size-3.5" />
            <span className="text-[11px] font-semibold">{course.lessonsCount} Lessons</span>
          </div>
          {!isProgram && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
              <Clock className="size-3.5" />
              <span className="text-[11px] font-semibold">{calculateMinutes(course.duration || 0)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/courses/${course.slug.current}`}
          className="block mb-6 grow"
        >
          <h3 className="text-xl font-extrabold text-gray-900 leading-[1.3] group-hover:text-purple-600 transition-colors line-clamp-2 tracking-tight">
            {course.title}
          </h3>
        </Link>
        
        {/* Pricing & Footer - Modified for Program variant */}
        <div className={`pt-6 border-t border-gray-100/80 flex items-center ${isProgram ? 'justify-end' : 'justify-between'} mt-auto`}>
          {!isProgram && (
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mb-0.5 ml-0.5">Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">
                  {course.price === 0 ? "Free" : `$${(course.discountPrice || course.price).toFixed(0)}`}
                </span>
                {course.discountPrice && course.price > 0 && (
                  <del className="text-sm text-gray-300 font-bold tracking-tight">${course.price.toFixed(0)}</del>
                )}
              </div>
            </div>
          )}
          
          <Link 
            href={isEnrolled ? `/dashboard` : enrollLink} 
            className={`group/btn relative px-6 h-14 rounded-2xl ${isEnrolled ? 'bg-purple-600' : 'bg-gray-900'} text-white shadow-lg shadow-gray-200 hover:shadow-purple-300 transition-all duration-300 flex items-center justify-center overflow-hidden gap-2`}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            <span className="font-bold text-sm relative z-10 px-1">
              {isProgram 
                ? (isEnrolled ? "Accéder" : "Inscrivez-vous") 
                : "Détails"}
            </span>
            <ArrowRight className="size-5 transition-transform duration-500 group-hover/btn:translate-x-1 relative z-10" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
