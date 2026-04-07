import { PlayOutline, BookOpen, GraduationHat, ArrowRight } from "@/lib/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";

interface Lesson {
  _key: string;
  title: string;
  duration: number;
  type: string;
  url?: string;
  instance: number;
}

interface Section {
  _key: string;
  sectionTitle: string;
  lessons: Lesson[];
}

interface MoodleModule {
  id: number;
  name: string;
  modname: string;
  url?: string;
  instance: number;
}

interface MoodleSection {
  id: number;
  name: string;
  modules?: MoodleModule[];
}

interface MoodleQuiz {
  id: number;
  name: string;
}

interface CourseContentProps {
  contents?: MoodleSection[];
  quizzes?: MoodleQuiz[];

  slug: string;
  isEnrolled: boolean;
}

const getModuleIcon = (type: string, isEnrolled: boolean) => {
  if (!isEnrolled) return <PlayOutline className="size-4.5 opacity-40" />; 
  
  switch (type) {
    case 'video': return <PlayOutline className="size-4.5" />;
    case 'quiz': return <GraduationHat className="size-4.5" />;
    case 'url': return <ArrowRight className="size-4.5" />;
    default: return <BookOpen className="size-4.5" />;
  }
};

const CourseContent = ({ contents = [], quizzes = [], slug, isEnrolled }: CourseContentProps) => {
  // Map Moodle contents to our Section/Lesson structure
  const sections: Section[] = contents.map((section: MoodleSection) => ({
    _key: section.id.toString(),
    sectionTitle: section.name,
    lessons: (section.modules || [])
      .filter((mod: MoodleModule) => mod.modname === 'resource' || mod.modname === 'lesson' || mod.modname === 'video' || mod.modname === 'url' || mod.modname === 'page' || mod.modname === 'quiz')
      .map((mod: MoodleModule) => ({
        _key: mod.id.toString(),
        title: mod.name,
        duration: 10,
        type: mod.modname,
        url: mod.url,
        instance: mod.instance
      }))
  })).filter(s => s.lessons.length > 0 || s.sectionTitle !== "General");

  const displaySections = sections.length > 0 ? sections : [];
  const mainQuiz = quizzes?.[0];

  return (
    <div className="rounded-3xl bg-primary p-6">
      <h4 className="font-mulish text-xl font-bold sm:text-2xl sm:leading-8">
        Course Content
      </h4>
      <div className="mt-5">
        {displaySections.length > 0 ? (
          <Accordion
            collapsible
            defaultValue={displaySections[0]?._key.toString()}
            className="space-y-3"
          >
            {displaySections.map(({ _key, lessons, sectionTitle }) => (
              <AccordionItem key={_key} value={_key.toString()}>
                <AccordionTrigger className="items-center pt-5 pb-5 [&_svg]:size-4">
                  <span className="flex w-full flex-col items-start justify-between gap-y-0.5 sm:flex-row sm:items-center">
                    <span className="tracking-[ 0.56px] text-sm leading-5 font-medium">
                      {sectionTitle}
                    </span>
                    <span className="text-sm leading-5 font-normal tracking-sm text-secondary">
                      {lessons.length} elements{" "}
                      <span className="text-gray-300">•</span>{" "}
                      {(() => {
                        const totalMinutes =
                          lessons?.reduce((total, lesson) => {
                            return total + (lesson.duration || 0);
                          }, 0) || 0;

                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                      })()}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-5">
                  <ul className="mt-2 rounded-2xl bg-primary">
                    {lessons.map(({ _key, title, type, url, instance }) => (
                      <li
                        key={_key}
                        className={`flex items-center gap-x-2 border-b border-dashed border-b-gray-200 pt-4 pb-4 text-secondary first:pt-0 last:border-0 last:pb-0 ${!isEnrolled ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <span className="flex items-center justify-center text-purple-600">
                          {getModuleIcon(type, isEnrolled)}
                        </span>
                        {(() => {
                          if (!isEnrolled) {
                             return <span className="text-sm leading-5 font-medium tracking-sm select-none">{title}</span>;
                          }

                          if (type === 'quiz') {
                            return (
                              <Link 
                                href={`/exam?quizId=${instance}`}
                                className="text-sm leading-5 font-medium tracking-sm hover:text-purple-600 transition-colors"
                              >
                                {title}
                              </Link>
                            );
                          }
                          const isInternal = type === 'page' || type === 'lesson' || type === 'resource';
                          if (isInternal) {
                            return (
                              <Link 
                                href={`/courses/${slug}/modules/${_key}`}
                                className="text-sm leading-5 font-medium tracking-sm hover:text-purple-600 transition-colors"
                              >
                                {title}
                              </Link>
                            );
                          }
                          if (url) {
                            return (
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm leading-5 font-medium tracking-sm hover:text-purple-600 transition-colors"
                              >
                                {title}
                              </a>
                            );
                          }
                          return (
                            <span className="text-sm leading-5 font-medium tracking-sm">
                              {title}
                            </span>
                          );
                        })()}
                        <span className="ml-auto text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-500 text-nowrap">
                          {isEnrolled ? type : "Locked"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-secondary">No content available yet for this course.</p>
          </div>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center justify-center">
        <h5 className="font-bold text-lg mb-2">Ready to test your knowledge?</h5>
        <p className="text-secondary text-sm mb-4 text-center max-w-sm">
          {isEnrolled 
            ? (mainQuiz ? `Take the final exam: "${mainQuiz.name}"` : "Complete all subjects to unlock the final exam.")
            : "Enroll in this course to access the final exam and certification."
          }
        </p>
        {isEnrolled ? (
          <Button asChild size="lg" className="w-full sm:w-auto px-8 py-3">
            <Link href={mainQuiz ? `/exam?quizId=${mainQuiz.id}` : "/exam"}>
              <span>{mainQuiz ? "Take Final Exam" : "Take Practice Exam"}</span>
              <ButtonArrow />
            </Link>
          </Button>
        ) : (
          <Button disabled size="lg" className="w-full sm:w-auto px-8 py-3 opacity-50">
             <span>Take Final Exam (Locked)</span>
             <ButtonArrow />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseContent;
