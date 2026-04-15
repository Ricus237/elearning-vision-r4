"use client";

import { BookOpen, Tag } from "lucide-react";

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
  // Use the thumbnail if available, else fall back to Moodle's default course image
  const imgSrc = thumbnail && thumbnail.trim() !== ""
    ? thumbnail
    : DEFAULT_COURSE_IMG;

  return (
    <div className="group flex flex-col h-full rounded-3xl bg-white shadow-md border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_COURSE_IMG;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category badge overlaid on image */}
        {categoryName && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md">
            <Tag className="size-3 text-purple-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
              {categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Lessons count */}
        {lessonsCount !== undefined && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <BookOpen className="size-3.5" />
            <span className="text-[11px] font-semibold">{lessonsCount} leçon{lessonsCount > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 tracking-tight group-hover:text-purple-700 transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && description !== "No description provided" && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgramCourseCard;
