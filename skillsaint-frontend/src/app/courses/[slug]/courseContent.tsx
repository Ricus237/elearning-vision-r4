import { PlayOutline } from "@/lib/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";

const subjects = [
  "Introduction and Basics",
  "Core Concepts and Architecture",
  "Intermediate Techniques",
  "Advanced Workflows",
  "Best Practices & Optimization",
  "Real-World Applications",
  "Final Project & Review",
];

const data = subjects.map((subject, index) => ({
  _key: (index + 1).toString(),
  sectionTitle: subject,
  lessons: Array.from({ length: 10 }).map((_, i) => ({
    _key: `${index + 1}-${i + 1}`,
    title: `Lesson ${i + 1}: ${subject} Part ${i + 1}`,
    duration: 15 + (i % 3) * 5,
  }))
}));

const CourseContent = () => {
  return (
    <div className="rounded-3xl bg-primary p-6">
      <h4 className="font-mulish text-xl font-bold sm:text-2xl sm:leading-8">
        Course Content
      </h4>
      <div className="mt-5">
        <Accordion
          collapsible
          defaultValue={data[0]._key.toString()}
          className="space-y-3"
        >
          {data.map(({ _key, lessons, sectionTitle }) => (
            <AccordionItem key={_key} value={_key.toString()}>
              <AccordionTrigger className="items-center pt-5 pb-5 [&_svg]:size-4">
                <span className="flex w-full flex-col items-start justify-between gap-y-0.5 sm:flex-row sm:items-center">
                  <span className="tracking-[ 0.56px] text-sm leading-5 font-medium">
                    {sectionTitle}
                  </span>
                  <span className="text-sm leading-5 font-normal tracking-sm text-secondary">
                    {lessons.length} lessons{" "}
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
                {lessons.length ? (
                  <ul className="mt-2 rounded-2xl bg-primary">
                    {lessons.map(({ _key, title }) => (
                      <li
                        key={_key}
                        className="flex items-center gap-x-2 border-b border-dashed border-b-gray-200 pt-4 pb-4 text-secondary first:pt-0 last:border-0 last:pb-0"
                      >
                        <span className="flex items-center justify-center">
                          <PlayOutline className="size-4.5" />
                        </span>
                        <span className="text-sm leading-5 font-medium tracking-sm">
                          {title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="pb-5">No module available</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center justify-center">
        <h5 className="font-bold text-lg mb-2">Ready to test your knowledge?</h5>
        <p className="text-secondary text-sm mb-4 text-center max-w-sm">Complete all subjects above to unlock the final exam. The exam consists of multiple-choice questions covering all subjects.</p>
        <Button asChild size="lg" className="w-full sm:w-auto px-8 py-3">
          <Link href="/exam">
            <span>Take Final Exam</span>
            <ButtonArrow />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CourseContent;
