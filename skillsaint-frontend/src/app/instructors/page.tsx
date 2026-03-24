import PageHeader from "@/components/pageHeader";
import { getInstructors } from "@/lib/moodle";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, ArrowRight, GraduationHat } from "@/lib/icons";

export const metadata: Metadata = {
  title: `Our Instructors | ${siteName}`,
  description: "Meet our dedicated instructors and subject matter experts.",
};

const InstructorsPage = async () => {
  const instructors = await getInstructors();

  return (
    <main>
      <PageHeader
        description="Learn from industry leaders and dedicated educators committed to your success."
        subTitle="Instructors"
      >
        Meet Our Experts
      </PageHeader>

      <section className="py-20 lg:py-32 bg-gray-50/50">
        <div className="container">
          {instructors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {instructors.map((instructor) => (
                    <div key={instructor.id} className="group relative bg-white rounded-[2.5rem] p-4 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
                        <div className="relative size-40 rounded-[2rem] overflow-hidden mb-6 mt-2">
                             <Image 
                                src={instructor.avatar} 
                                fill 
                                alt={instructor.name} 
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        
                        <div className="px-4 pb-4">
                            <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">{instructor.name}</h3>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Senior Instructor</p>
                            
                            <div className="flex items-center justify-center gap-6 py-4 border-t border-gray-50 mt-2">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                                        <Star className="size-4 fill-amber-500" />
                                        <span className="text-sm font-black text-gray-900">{instructor.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 text-purple-600 mb-1">
                                        <BookOpen className="size-4" />
                                        <span className="text-sm font-black text-gray-900">{instructor.coursesCount}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Courses</span>
                                </div>
                            </div>
                        </div>

                        {/* Hover action footer */}
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                             <Link 
                                href={`/courses?instructor=${encodeURIComponent(instructor.name)}`}
                                className="w-full h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200"
                            >
                                View Courses
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                 <div className="size-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <GraduationHat className="size-10 text-gray-200" />
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-4">No instructors found</h2>
                 <p className="text-secondary max-w-sm mx-auto">We are currently updating our instructor roster. Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA or Newsletter placeholder */}
      <section className="py-20 bg-purple-600">
          <div className="container">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-white/10 backdrop-blur-md rounded-[3rem] p-10 lg:p-16 border border-white/20 text-white">
                    <div className="max-w-xl text-center lg:text-left">
                        <h2 className="text-3xl lg:text-4xl font-black mb-4">Want to Join Our Team?</h2>
                        <p className="text-white/80 text-lg">Share your expertise with thousands of students and help us build the next generation of leaders.</p>
                    </div>
                    <Link href="/contact" className="h-16 px-10 rounded-2xl bg-white text-purple-600 flex items-center justify-center font-black uppercase tracking-widest shadow-xl shadow-purple-900/10 hover:bg-gray-50 transition-all">
                        Apply to Teach
                    </Link>
              </div>
          </div>
      </section>
    </main>
  );
};

export default InstructorsPage;
