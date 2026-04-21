"use client";

import { BookOpen, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";


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
  // Use proxy for images to bypass CORS and fix loading
  // Also detect if it's Moodle's generic default image to use our gradient instead
  const isDefaultImg = thumbnail && (
    thumbnail.includes('defaultcourse') || 
    thumbnail.includes('placeholder') || 
    thumbnail.includes('generated') || 
    thumbnail.endsWith('.svg')
  );

  const finalImgSrc = thumbnail && thumbnail.trim() !== "" && !isDefaultImg
    ? `/api/moodle-image?url=${encodeURIComponent(thumbnail)}`
    : null;

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

  return (
    <div className="group flex flex-col h-full rounded-[2rem] bg-white border border-slate-100/50 shadow-sm hover:shadow-2xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
      {/* Cover Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {finalImgSrc ? (
          <Image
            src={finalImgSrc}
            alt={title}
            width={600}
            height={337}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient(title)} flex items-center justify-center p-6 text-center`}>
            <span className="text-white font-black text-lg leading-tight uppercase tracking-tighter opacity-40">
              {title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40" />

        {/* Category badge */}
        {categoryName && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md shadow-sm">
            <Tag className="size-2.5 text-purple-600" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">
              {categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-3">
          {lessonsCount !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              <BookOpen className="size-3" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-nowrap">{lessonsCount} Modules</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight group-hover:text-purple-700 transition-colors mb-2 line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>

        {description && description !== "No description provided" && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4 font-medium">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 cursor-pointer">Explorer</span>
          <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all scale-90 group-hover:scale-100">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCourseCard;
