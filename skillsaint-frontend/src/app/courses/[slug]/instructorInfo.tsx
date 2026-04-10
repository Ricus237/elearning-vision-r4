import {
  BookOpen,
  GraduationHat,
  InstagramSmIcon,
  LinkedinSmIcon,
  Star,
  TwitterSmIcon,
} from "@/lib/icons";
import Image from "next/image";

interface InstructorInfoProps {
  instructor: {
    name: string;
    avatar?: string;
    title?: string;
    bio?: string;
  };
  totalStudents?: number;
  totalCourses?: number;
}

const InstructorInfo = ({ instructor, totalStudents = 0, totalCourses = 1 }: InstructorInfoProps) => {
  const avatarUrl = instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=7d52f4&color=fff&size=256`;
  
  return (
    <div className="pt-8">
      <h4 className="font-mulish text-xl font-black md:text-3xl tracking-tight mb-6">
        About The Instructor
      </h4>
      <div className="mt-5 flex flex-col gap-x-8 rounded-[2.5rem] bg-white border border-gray-100 p-8 shadow-sm sm:flex-row sm:items-center group hover:border-purple-200 transition-all duration-500">
        <div className="shrink-0 rounded-3xl overflow-hidden sm:w-55.25 aspect-[4/5]">
          <Image
            width={221}
            height={285}
            sizes="100vw"
            src={avatarUrl}
            alt={instructor.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="space-y-6 py-5 flex-1">
          <div>
            <h6 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              {instructor.name}
            </h6>
            <p className="text-xs font-black text-purple-600 uppercase tracking-widest">
              {instructor.title || "Academic Faculty"}
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-gray-50 py-4">
            <li className="flex items-center gap-2">
              <span className="flex items-center justify-center text-yellow-400">
                <Star className="size-4 fill-yellow-400" />
              </span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {"5.0"} Rating
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4.5 w-4.5 items-center justify-center text-purple-600">
                <GraduationHat className="size-4" />
              </span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {totalStudents > 1000 ? `${(totalStudents/1000).toFixed(1)}k` : totalStudents} Scholars
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-4.5 w-4.5 items-center justify-center text-purple-600">
                <BookOpen className="size-4" />
              </span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {totalCourses} Accredited Courses
              </span>
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-gray-500 font-medium">
            {instructor.bio || "Member of the International Bible Institute faculty, dedicated to spiritual excellence and academic integrity in Christian education."}
          </p>
          <ul className="flex items-center gap-x-4">
             <li className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer">
                <TwitterSmIcon />
             </li>
             <li className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer">
                <LinkedinSmIcon />
             </li>
             <li className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer">
                <InstagramSmIcon />
             </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstructorInfo;
