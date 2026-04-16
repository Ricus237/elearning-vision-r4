"use client";

import { BookOpen, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";

const MOODLE_URL = process.env.NEXT_PUBLIC_MOODLE_URL || "https://apogeeweb.visionca.net/moodle";
const DEFAULT_COURSE_IMG = `${MOODLE_URL}/theme/image.php/boost/core/1723710505/course/defaultcourse`;

interface ProgramCourseCardProps {
  title: string;
  description: string;
  thumbnail?: string | null;
  categoryName?: string;
  lessonsCount?: number;
}

const ProgramCourseCard = ({
  title,
  description,
  thumbnail,
  categoryName,
  lessonsCount,
}: ProgramCourseCardProps) => {
  const imgSrc = thumbnail && thumbnail.trim() !== ""
    ? thumbnail
    : DEFAULT_COURSE_IMG;

  return (
    <div className="group flex flex-col h-full rounded-[2.5rem] bg-white border border-slate-100/50 shadow-sm hover:shadow-2xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={imgSrc}
          alt={title}
          width={600}
          height={375}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />

        {/* Category badge */}
        {categoryName && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-sm">
            <Tag className="size-3 text-purple-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
              {categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-8">
        <div className="flex items-center justify-between mb-4">
          {lessonsCount !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              <BookOpen className="size-3" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{lessonsCount} Modules</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-slate-900 leading-[1.2] tracking-tight group-hover:text-purple-700 transition-colors mb-4 line-clamp-2">
          {title}
        </h3>

        {description && description !== "No description provided" && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 font-medium">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-6">
           <span className="text-xs font-black uppercase tracking-widest text-purple-600">Explore Course</span>
           <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <ArrowRight size={18} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCourseCard;
