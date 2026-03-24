import SectionTitle from "@/components/sectionTitle";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import {
  BookOpen,
  Clock,
  FileAlt,
  GraduationHat,
  LifeRing,
  SingleStrong,
} from "@/lib/icons";
import Image from "next/image";
import Link from "next/link";
import CourseContent from "./courseContent";
import InstructorInfo from "./instructorInfo";
import Cta from "@/components/cta";
import CoursseReview from "./coursseReview";
import AddReview from "./addReview";
import BackButton from "./backButton";

import { getCourseById, getCourseContents, getCourseQuizzes, isUserEnrolled } from "@/lib/moodle";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Trigger TS re-check

const CourseDetails = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const courseId = parseInt(slug);
  const course = await getCourseById(courseId);
  const contents = await getCourseContents(courseId);
  const quizzes = await getCourseQuizzes(courseId);

  const cookieStore = await cookies();
  const username = cookieStore.get("moodle_user")?.value;
  const userIdStr = cookieStore.get("moodle_user_id")?.value;
  
  const isEnrolled = userIdStr ? await isUserEnrolled(parseInt(userIdStr), courseId) : false;

  if (!course) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Course not found</h2>
          <Link href="/courses" className="mt-4 text-purple-500 hover:underline">Return to courses</Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="bg-gray-50 pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pb-28">
        <div className="container">
          <div className="xl:px-24">
            <BackButton />
            <div className="mt-10 flex flex-col items-start justify-between gap-x-5 gap-y-8 lg:flex-row">
              <div className={`w-full shrink space-y-12 ${!isEnrolled ? "lg:max-w-150" : ""}`}>
                <div>
                  <SectionTitle
                    subTitle="Courses Details"
                    description={course.shortDescription}
                    descriptionClass="max-w-full"
                  >
                    {course.title}
                  </SectionTitle>
                  <div className="flex items-center justify-between pt-8">
                    <div className="flex items-center gap-2">
                      <Image
                        width={32}
                        height={32}
                        src={"/images/instructor/avatar.png"}
                        alt="img"
                        className="size-8 rounded-full object-cover"
                      />
                      <span className="leading-6 tracking-base text-secondary">
                        {course.instructor.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SingleStrong />
                      <span className="leading-6 text-secondary capitalize">
                        {course.level}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <Image
                    width={586}
                    height={343}
                    sizes="100vw"
                    src={course.thumbnail}
                    alt="img"
                    className="w-full rounded-2xl"
                  />
                </div>

                <div>
                  <h4 className="font-mulish text-xl font-bold sm:text-2xl sm:leading-8">
                    Overview
                  </h4>
                  <div className="mt-5 space-y-4 text-sm leading-5 tracking-sm text-secondary">
                    <p>{course.shortDescription}</p>
                  </div>
                </div>
                <CourseContent contents={contents} quizzes={quizzes} slug={slug} isEnrolled={isEnrolled} />
                {!isEnrolled && (
                  <>
                    <InstructorInfo />
                    <CoursseReview />
                    <AddReview />
                  </>
                )}
              </div>

              {!isEnrolled && (
                <div className="sticky top-24 w-full lg:max-w-93.25">
                  <div className="rounded-3xl bg-primary px-6 pt-7 pb-8 shadow-card">
                    <p className="text-sm leading-5 tracking-sm text-secondary">
                      Course Pricing
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <h3 className="text-[clamp(1.5rem,1.3533rem+0.6522vw,1.875rem)] leading-9.5 font-medium">
                        {course.price > 0 ? `$${course.price}` : "Free"}
                      </h3>
                    </div>
                    <div className="mt-6">
                      <p className="leading-6 font-medium tracking-base">
                        This Course includes:
                      </p>
                      <ul className="space-y-3 pt-4">
                        <li className="flex items-center gap-1.5 text-secondary">
                          <span className="flex h-4.5 w-4.5 items-center justify-center">
                            <BookOpen className="size-4.5" />
                          </span>
                          <span className="text-sm leading-5 tracking-sm">
                            {course.lessonsCount} Lessons
                          </span>
                        </li>
                        <li className="flex items-center gap-1.5 text-secondary">
                          <span className="flex h-4.5 w-4.5 items-center justify-center">
                            <Clock className="size-4.5" />
                          </span>
                          <span className="text-sm leading-5 tracking-sm">
                            {(() => {
                              const duration = course.duration || 0;
                              const hours = Math.floor(duration / 60);
                              const mins = duration % 60;
                              return hours > 0 ? `${hours} hours ${mins > 0 ? `${mins}m` : ''}` : `${mins} minutes`;
                            })()}
                          </span>
                        </li>
                        <li className="flex items-center gap-1.5 text-secondary">
                          <span className="flex h-4.5 w-4.5 items-center justify-center">
                            <GraduationHat className="size-4.5" />
                          </span>
                          <span className="text-sm leading-5 tracking-sm">
                            {course.totalLearners} learners
                          </span>
                        </li>
                      </ul>
                    </div>

                    <form action={async () => {
                      'use server';
                      const cookiesStore = await cookies();
                      const user = cookiesStore.get("moodle_user")?.value;
                      if (!user) {
                        redirect(`/register?courseId=${courseId}`);
                      }
                      redirect(`/checkout?courseId=${courseId}`);
                    }}>
                      <Button
                        type="submit"
                        size="lg"
                        className="mt-8 w-full py-1.5 pr-1.5 pl-6"
                      >
                        <span className="w-full text-center">
                          {username ? "Enroll Now" : "Register to Enroll"}
                        </span>
                        <ButtonArrow />
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Cta className="pb-16 sm:pb-20 lg:pb-28" />
    </main>
  );
};

export default CourseDetails;
