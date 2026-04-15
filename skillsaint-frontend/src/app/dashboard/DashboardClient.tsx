"use client";

import {
  CheckCircle2,
  Lock,
  PlayCircle,
  X,
  ShieldCheck,
  Search,
  BookOpen,
  Sparkles,
  Plus,
} from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { activateAccount } from "@/lib/data";

interface EnrolledCourse {
  id: number;
  fullname: string;
  image_url?: string;
  summary?: string;
}

interface DashboardData {
  courses: EnrolledCourse[];
  plan: string;
  exams?: Array<{ id: number; name: string; courseid: number; timeLimit: number }>;
}

interface PlanQuotas {
  standard: number;
  premium: number;
  executive: number;
}

const PLAN_QUOTA: Record<string, number> = {
  standard: 3,
  premium: 6,
  executive: Infinity,
  none: 0,
};

const getAuthenticatedUrl = (url?: string, token?: string) => {
  if (!url) return "/images/course/course-1.png";
  if (url.startsWith("data:") || url.includes("token=")) return url;
  if (!url.includes("pluginfile.php")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}token=${token}`;
};

// ─── Course Card ────────────────────────────────────────────────────────────
interface CourseCardProps {
  course: EnrolledCourse;
  isEnrolled: boolean;
  canAdd: boolean;
  moodleToken: string;
  onClick: () => void;
}

const CourseCard = ({ course, isEnrolled, canAdd, moodleToken, onClick }: CourseCardProps) => {
  const imgSrc = getAuthenticatedUrl(course.image_url, moodleToken);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={isEnrolled ? onClick : undefined}
      className={`group relative bg-white border-2 rounded-[3rem] p-4 pb-8 transition-all duration-500 overflow-hidden
        ${isEnrolled
          ? "border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-2 cursor-pointer"
          : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
        }
      `}
    >
      {/* Enrolled glow */}
      {isEnrolled && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 rounded-[3rem] pointer-events-none" />
      )}

      {/* Image */}
      <div className="relative h-44 w-full rounded-[2.5rem] overflow-hidden mb-6">
        <Image
          src={imgSrc}
          alt={course.fullname}
          fill
          className={`object-cover transition-transform duration-700 ${isEnrolled ? "group-hover:scale-110" : "opacity-70"}`}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Status badge on image */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          {isEnrolled ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
              <CheckCircle2 size={10} />
              Enrolled
            </span>
          ) : canAdd ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest">
              <Plus size={10} />
              Available
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/50 backdrop-blur-md rounded-full text-[9px] font-black text-white/80 uppercase tracking-widest">
              <Lock size={10} />
              Quota Full
            </span>
          )}
        </div>
      </div>

      <div className="px-4 relative z-10">
        <h3
          className={`text-lg font-black tracking-tight leading-tight mb-2 transition-colors ${
            isEnrolled ? "text-gray-900 group-hover:text-purple-600" : "text-gray-500"
          }`}
        >
          {course.fullname}
        </h3>
        {course.summary && (
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed mb-4 line-clamp-2">
            {course.summary.replace(/<[^>]*>/g, "")}
          </p>
        )}

        {isEnrolled ? (
          <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest">
            <PlayCircle size={14} />
            Continue Learning
          </div>
        ) : canAdd ? (
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <BookOpen size={14} />
            Contactez-nous pour ajouter
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <Lock size={14} />
            Upgradez votre forfait
          </div>
        )}
      </div>

      {/* Hover glow */}
      {isEnrolled && (
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-100/40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const DashboardClient = ({
  initialData,
  userEmail,
  isActivated: serverIsActivated,
  moodleToken,
  allCourses = [],
  planQuotas,
}: {
  initialData: DashboardData;
  userEmail: string;
  isActivated: boolean;
  moodleToken: string;
  allCourses?: EnrolledCourse[];
  planQuotas?: PlanQuotas;
}) => {
  const router = useRouter();
  const [showActivationWall, setShowActivationWall] = useState(!serverIsActivated);
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "enrolled" | "available">("all");

  const enrolledCourses = useMemo(() => initialData?.courses || [], [initialData]);
  const userPlan = initialData?.plan || "none";

  // Determine quota from server-side planQuotas or defaults
  const quotaMap: Record<string, number> = {
    standard: planQuotas?.standard ?? PLAN_QUOTA.standard,
    premium: planQuotas?.premium ?? PLAN_QUOTA.premium,
    executive: Infinity,
    none: 0,
  };
  const userQuota = quotaMap[userPlan] ?? 0;
  const enrolledCount = enrolledCourses.length;
  const slotsLeft = userQuota === Infinity ? Infinity : Math.max(0, userQuota - enrolledCount);
  const canAddMore = slotsLeft > 0;

  // Build a Set of enrolled IDs for O(1) look-up
  const enrolledIds = useMemo(() => new Set(enrolledCourses.map((c) => c.id)), [enrolledCourses]);

  // Merge: enrolled courses come first, then the rest from the catalog
  const catalogCourses = useMemo(() => {
    const map = new Map<number, EnrolledCourse>();
    // First add ALL catalog courses
    allCourses.forEach((c) => map.set(c.id, c));
    // Override/add enrolled courses (they may have richer data)
    enrolledCourses.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [allCourses, enrolledCourses]);

  // Search + filter
  const filteredCourses = useMemo(() => {
    let list = catalogCourses;

    if (activeFilter === "enrolled") list = list.filter((c) => enrolledIds.has(c.id));
    if (activeFilter === "available") list = list.filter((c) => !enrolledIds.has(c.id));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullname.toLowerCase().includes(q) ||
          (c.summary || "").toLowerCase().includes(q)
      );
    }

    // Enrolled courses first
    return [...list].sort((a, b) => {
      const aE = enrolledIds.has(a.id) ? 0 : 1;
      const bE = enrolledIds.has(b.id) ? 0 : 1;
      return aE - bE;
    });
  }, [catalogCourses, search, activeFilter, enrolledIds]);

  useEffect(() => {
    const localBypass = localStorage.getItem("ibi_dev_activated");
    if (localBypass === "true") setShowActivationWall(false);
  }, []);

  const handleActivate = async () => {
    if (!activationCode) return;
    setIsActivating(true);
    setActivationError("");

    if (activationCode === "0000") {
      localStorage.setItem("ibi_dev_activated", "true");
      setShowActivationWall(false);
      await activateAccount(userEmail, activationCode);
      window.location.reload();
      return;
    }

    try {
      const result = await activateAccount(userEmail, activationCode);
      if (result.status === "success") {
        setShowActivationWall(false);
        window.location.reload();
      } else {
        setActivationError(result.message || "Code invalide");
      }
    } catch {
      setActivationError("Erreur d'activation");
    } finally {
      setIsActivating(false);
    }
  };

  const handleCourseClick = (course: EnrolledCourse) => {
    router.push(`/dashboard/courses/${course.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row relative selection:bg-purple-100 selection:text-purple-900">
      <StudentSidebar />

      <main className="flex-1 min-h-screen">
        <div className="p-6 md:p-10 lg:p-14 pt-8 md:pt-10">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* ── Header ── */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 animate-in slide-in-from-left duration-700">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">
                    Student Portal
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none mb-4">
                  My Courses,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                    Scholar.
                  </span>
                </h1>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8">
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Enrolled</p>
                  <p className="text-4xl font-black text-gray-900">{enrolledCount}</p>
                </div>
               
                {userQuota !== Infinity && (
                  <>
                    <div className="h-10 w-px bg-gray-200 hidden sm:block" />
                    <div className="text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Slots Left</p>
                      <p className={`text-4xl font-black ${slotsLeft > 0 ? "text-emerald-600" : "text-red-400"}`}>
                        {slotsLeft}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </header>

            {/* ── Quota banner if restricted ── */}
            {(userPlan === "standard" || userPlan === "premium") && (
              <div className="animate-in fade-in duration-700">
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-8 py-5 rounded-3xl border-2 ${
                  slotsLeft > 0
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-amber-50 border-amber-100 text-amber-700"
                }`}>
                  <Sparkles size={20} className="shrink-0 mt-0.5" />
                  <div>
                    {slotsLeft > 0 ? (
                      <p className="text-sm font-bold">
                        Your <strong>{userPlan}</strong> plan allows you to add{" "}
                        <strong>{slotsLeft} more course{slotsLeft !== 1 ? "s" : ""}</strong>. Contact our team to enroll in additional courses.
                      </p>
                    ) : (
                      <p className="text-sm font-bold">
                        You have reached the limit of your <strong>{userPlan}</strong> plan ({userQuota} courses).{" "}
                        <a href="/apply" className="underline underline-offset-2 font-black">
                          Upgrade to Premium or Executive
                        </a>{" "}
                        to unlock more courses.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Search + Filter bar ── */}
            <div className="animate-in fade-in duration-700 delay-150 space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses by title or description…"
                  className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[2rem] text-sm font-medium text-gray-800 placeholder:text-gray-400 transition-all focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "enrolled", "available"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeFilter === f
                        ? "bg-gray-900 text-white shadow-lg"
                        : "bg-white border border-gray-100 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {f === "all" && `All (${catalogCourses.length})`}
                    {f === "enrolled" && `My Courses (${enrolledCount})`}
                    {f === "available" && `Catalog (${catalogCourses.length - enrolledCount})`}
                  </button>
                ))}

                {search && (
                  <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {filteredCourses.length} result{filteredCourses.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* ── Course Grid ── */}
            <section className="animate-in fade-in duration-1000 delay-200 pb-24">
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredCourses.map((course) => {
                      const isEnrolled = enrolledIds.has(course.id);
                      return (
                        <CourseCard
                          key={course.id}
                          course={course}
                          isEnrolled={isEnrolled}
                          canAdd={!isEnrolled && canAddMore}
                          moodleToken={moodleToken}
                          onClick={() => handleCourseClick(course)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-24 bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                  <Search className="text-gray-200 mb-6" size={56} />
                  <h4 className="text-xl font-black text-gray-400 uppercase tracking-widest">
                    No Courses Found
                  </h4>
                  <p className="text-sm text-gray-400 mt-2 max-w-sm px-6">
                    Try a different keyword or clear the filters.
                  </p>
                  <button
                    onClick={() => { setSearch(""); setActiveFilter("all"); }}
                    className="mt-6 px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-purple-600 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ── Activation Wall ── */}
      <AnimatePresence>
        {showActivationWall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-[20px] flex items-center justify-center p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden my-auto"
            >
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />

              <div className="relative z-10">
                <div className="w-24 h-24 bg-gray-900 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-gray-200">
                  <ShieldCheck size={40} />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-6">
                  Account <br />
                  <span className="text-purple-600">Verification</span>
                </h2>
                <p className="text-gray-400 font-medium mb-10 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                  To protect our community and your academic records, please enter the unique code provided by your Global Bible Institute administrator.
                </p>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="group relative">
                    <input
                      type="text"
                      placeholder="IBI-XXXX-XXXX-XXXX"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-center text-lg font-black tracking-[0.3em] uppercase transition-all focus:bg-white focus:border-purple-600 outline-none"
                    />
                    <div className="absolute inset-0 rounded-[2rem] border-2 border-gray-900 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                  </div>

                  {activationError && (
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{activationError}</p>
                  )}

                  <button
                    onClick={handleActivate}
                    disabled={isActivating}
                    className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gray-200 transition-all hover:bg-purple-600 hover:shadow-purple-100 active:scale-95 disabled:opacity-50"
                  >
                    {isActivating ? "Verifying..." : "Validate Access"}
                  </button>
                </div>

                <p className="mt-12 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Problems? contact admin@ibi-edu.com
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DashboardClient;
