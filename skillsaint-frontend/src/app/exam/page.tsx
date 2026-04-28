/* eslint-disable */

"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  CheckCircle, XCircle, Loader2, ArrowLeft, ArrowRight,
  AlertTriangle, Clock, Trophy, Grid3X3, ChevronLeft, ChevronRight
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { getQuizQuestionsAction, saveExamResultAction } from "@/lib/actions";

interface QuestionType {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

/* ── Question Navigator (sidebar / mobile drawer) ── */
const QuestionNav = ({
  questions, current, answers, onSelect, onClose, isMobile
}: {
  questions: QuestionType[];
  current: number;
  answers: Record<number, number>;
  onSelect: (i: number) => void;
  onClose?: () => void;
  isMobile?: boolean;
}) => {
  const answered = Object.keys(answers).length;
  return (
    <div className={isMobile
      ? "fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      : "hidden lg:flex flex-col w-72 shrink-0"
    }>
      <div className={`bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 ${isMobile ? "w-full max-w-md max-h-[70vh] overflow-y-auto" : "sticky top-8"}`}>
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Navigator</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><XCircle size={20} className="text-gray-400" /></button>
          </div>
        )}
        {!isMobile && <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Question Navigator</h3>}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {questions.map((_, i) => {
            const isAnswered = answers[i] !== undefined;
            const isCurrent = i === current;
            return (
              <button
                key={i}
                onClick={() => { onSelect(i); onClose?.(); }}
                className={`w-full aspect-square rounded-xl text-xs font-black transition-all ${
                  isCurrent
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-200 scale-110"
                    : isAnswered
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-400">Answered</span>
            <span className="text-emerald-600">{answered}/{questions.length}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Results Screen ── */
const ResultsScreen = ({
  questions, answers, quizName, onReturn
}: {
  questions: QuestionType[];
  answers: Record<number, number>;
  quizName: string;
  onReturn: () => void;
}) => {
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 70;
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-50 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-start py-12 px-4">
        {/* Score Card */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200 border border-gray-100 p-10 md:p-16 max-w-2xl w-full text-center mb-10 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-50 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60" />
          <div className="relative z-10">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ${passed ? "bg-emerald-500 shadow-emerald-200" : "bg-red-500 shadow-red-200"}`}>
              {passed ? <Trophy size={44} className="text-white" /> : <XCircle size={44} className="text-white" />}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2">
              {passed ? "Congratulations!" : "Exam Completed"}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">{quizName}</p>

            <div className="flex items-center justify-center gap-8 mb-8">
              <div>
                <p className="text-5xl font-black text-gray-900">{pct}%</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Score</p>
              </div>
              <div className="h-16 w-px bg-gray-100" />
              <div>
                <p className="text-5xl font-black text-gray-900">{score}<span className="text-xl text-gray-300">/{questions.length}</span></p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Correct</p>
              </div>
            </div>

            <p className={`text-sm font-bold px-6 py-3 rounded-2xl inline-block mb-8 ${passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {passed ? "You have successfully passed this assessment." : "You did not reach the 70% passing threshold. Please review and try again."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setShowReview(!showReview)} className="flex-1 py-5 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all">
                {showReview ? "Hide Review" : "Review Answers"}
              </button>
              <button onClick={onReturn} className="flex-[2] py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-purple-600 transition-all">
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Review Section */}
        {showReview && (
          <div className="max-w-2xl w-full space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Detailed Review</h3>
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correct;
              return (
                <div key={q.id} className={`bg-white rounded-2xl border-2 p-6 ${isCorrect ? "border-emerald-100" : "border-red-100"}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: q.question }} />
                  </div>
                  <div className="space-y-2 ml-10">
                    {q.options.map((opt, oi) => {
                      const isUserChoice = userAnswer === oi;
                      const isCorrectChoice = q.correct === oi;
                      let cls = "bg-gray-50 border-gray-100 text-gray-400";
                      if (isCorrectChoice) cls = "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold";
                      else if (isUserChoice && !isCorrect) cls = "bg-red-50 border-red-200 text-red-600 line-through";
                      return (
                        <div key={oi} className={`px-4 py-2.5 rounded-xl border text-xs ${cls} flex items-center gap-2`}>
                          {isCorrectChoice && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                          {isUserChoice && !isCorrect && <XCircle size={14} className="text-red-400 shrink-0" />}
                          <span dangerouslySetInnerHTML={{ __html: opt }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Exam Content ── */
const ExamContent = () => {
  const searchParams = useSearchParams();
  const quizIdStr = searchParams.get("quizId");
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizName, setQuizName] = useState("Exam");
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [initialTime, setInitialTime] = useState<number | null>(null);

  const clearExamSession = () => {
    if (quizIdStr) {
      localStorage.removeItem(`gbi_exam_end_${quizIdStr}`);
      document.cookie = "gbi_exam_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const handleFinalSubmit = async (finalAnswers: Record<number, number>) => {
    if (isSubmitted) return;

    // Calculate results
    let correct = 0;
    questions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correct) correct++;
    });

    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;

    // Get User ID from cookies
    const userIdMatch = document.cookie.match(/moodle_user_id=([^;]+)/);
    const userId = userIdMatch ? parseInt(userIdMatch[1]) : 0;

    if (userId && quizIdStr) {
      try {
        await saveExamResultAction({
          userid: userId,
          quizid: parseInt(quizIdStr),
          score: score,
          total_questions: questions.length,
          correct_count: correct
        });
      } catch (err) {
        console.error("Error saving exam result:", err);
      }
    }

    clearExamSession();
    setIsSubmitted(true);
  };

  useEffect(() => {
    async function loadQuiz() {
      if (!quizIdStr) {
        setError("Aucun identifiant d'examen fourni.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const result = await getQuizQuestionsAction(parseInt(quizIdStr));
      if (result.success && result.questions) {
        const mapped = result.questions.map((q: { id: number; questiontext: string; answers: Array<{ text: string }>; correct: number }) => ({
          id: q.id,
          question: q.questiontext,
          options: q.answers.map((a) => a.text),
          correct: q.correct,
        }));
        
        if (mapped.length > 0) {
          setQuestions(mapped);
          setQuizName(result.quizName || "Assessment");
          
          if (result.timeLimit && result.timeLimit > 0) {
            // Check for persistent end time
            const storageKey = `gbi_exam_end_${quizIdStr}`;
            const existingEnd = localStorage.getItem(storageKey);
            let endTime: number;

            if (existingEnd) {
              endTime = parseInt(existingEnd);
            } else {
              endTime = Date.now() + result.timeLimit * 1000;
              localStorage.setItem(storageKey, endTime.toString());
            }

            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            setInitialTime(result.timeLimit);

            // If time is already up on load, and we had an existing session, submit it.
            if (remaining === 0 && existingEnd) {
              // Note: We use a small delay or ensure state is updated
              let correctCount = 0;
              mapped.forEach((q, idx) => {
                if (selectedAnswers[idx] === q.correct) correctCount++;
              });
              const finalScore = (correctCount / mapped.length) * 100;
              
              const userIdMatch = document.cookie.match(/moodle_user_id=([^;]+)/);
              const userId = userIdMatch ? parseInt(userIdMatch[1]) : 0;
              
              if (userId) {
                await saveExamResultAction({
                  userid: userId,
                  quizid: parseInt(quizIdStr),
                  score: finalScore,
                  total_questions: mapped.length,
                  correct_count: correctCount
                });
              }
              clearExamSession();
              setIsSubmitted(true);
            }
          }
        } else {
          clearExamSession();
          setError("Cet examen ne contient aucune question.");
        }
      } else if (result.error) {
        clearExamSession();
        setError(result.error);
      }
      setIsLoading(false);
    }
    loadQuiz();
  }, [quizIdStr]);

  // Lockdown & Protection Effect
  useEffect(() => {
    if (!quizIdStr || isSubmitted || isLoading) return;

    // Set lockdown cookie
    document.cookie = `gbi_exam_active=${quizIdStr}; path=/; max-age=7200`;

    // Prevent accidental reload/navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quizIdStr, isSubmitted, isLoading]);

  // Countdown Timer Effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(selectedAnswers);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, selectedAnswers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleSelect = (optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
  };
  const handleNext = () => { if (currentQuestion < questions.length - 1) setCurrentQuestion(p => p + 1); };
  const handlePrev = () => { if (currentQuestion > 0) setCurrentQuestion(p => p - 1); };

  /* ── Return button (always visible) ── */
  const ReturnButton = ({ warning = false }: { warning?: boolean }) => (
    <div className="fixed top-6 left-6 md:top-10 md:left-10 z-[1050]">
      <button
        onClick={() => warning ? setShowExitWarning(true) : router.push("/dashboard/exams")}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all bg-white px-5 py-3 rounded-[1.25rem] shadow-sm border border-gray-100 hover:shadow-md hover:-translate-x-1"
      >
        <ArrowLeft size={18} />
        <span className="hidden md:inline uppercase tracking-widest text-[10px] mt-0.5">{warning ? "Cancel Session" : "Return"}</span>
      </button>
    </div>
  );

  /* ── Loading ── */
  if (isLoading) {
    return (
      <>
        <ReturnButton />
        <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center p-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium tracking-wide">Fetching your examination...</p>
        </div>
      </>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <>
        <ReturnButton />
        <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-lg w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Examination Error</h2>
            <p className="text-gray-500 font-medium mb-8">{error}</p>
            <button 
              onClick={() => {
                clearExamSession();
                router.push("/dashboard/exams");
              }}
              className="w-full py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl shadow-gray-200"
            >
              Return to Assessments
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Results ── */
  if (isSubmitted) {
    return <ResultsScreen questions={questions} answers={selectedAnswers} quizName={quizName} onReturn={() => router.push("/dashboard/exams")} />;
  }

  /* ── Active Exam ── */
  const question = questions[currentQuestion];

  return (
    <>
      <ReturnButton warning />

      <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 ml-12 md:ml-0">
            <h1 className="text-sm md:text-lg font-black text-gray-900 truncate max-w-[200px] md:max-w-none">{quizName}</h1>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-colors ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                <Clock size={14} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button onClick={() => setShowMobileNav(true)} className="lg:hidden p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
              <Grid3X3 size={18} className="text-gray-500" />
            </button>
            <span className="text-xs font-black bg-purple-100 text-purple-800 px-4 py-2 rounded-full uppercase tracking-widest">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="shrink-0 h-1 bg-gray-100">
          <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-black bg-gray-900 text-white w-7 h-7 flex items-center justify-center rounded-lg">{currentQuestion + 1}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question</span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold mb-10 text-gray-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: question.question }} />

                <div className="space-y-4">
                  {question.options.map((option: string, idx: number) => {
                    const isSelected = selectedAnswers[currentQuestion] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        className={`w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 group/opt ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 shadow-lg shadow-purple-100"
                            : "border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/30"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? "border-purple-600 bg-purple-600" : "border-gray-300 group-hover/opt:border-purple-300"
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                          </div>
                          <span className={`text-base ${isSelected ? "text-purple-900 font-bold" : "text-gray-700"}`} dangerouslySetInnerHTML={{ __html: option }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
                  <button
                    onClick={handlePrev}
                    disabled={currentQuestion === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {currentQuestion === questions.length - 1 ? (
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-purple-600 transition-all shadow-lg shadow-gray-200"
                    >
                      Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-purple-600 transition-all shadow-lg shadow-gray-200"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Question Navigator */}
          <div className="hidden lg:block pr-8 py-8">
            <QuestionNav questions={questions} current={currentQuestion} answers={selectedAnswers} onSelect={setCurrentQuestion} />
          </div>
        </div>
      </div>

      {/* Mobile Navigator Drawer */}
      {showMobileNav && (
        <QuestionNav questions={questions} current={currentQuestion} answers={selectedAnswers} onSelect={setCurrentQuestion} onClose={() => setShowMobileNav(false)} isMobile />
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[1100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 max-w-md w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Submit Exam?</h3>
            <p className="text-gray-500 font-medium mb-2">
              You have answered <strong className="text-gray-900">{answeredCount}</strong> out of <strong className="text-gray-900">{questions.length}</strong> questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-amber-600 text-sm font-bold mb-6">
                ⚠ {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? "s" : ""} unanswered!
              </p>
            )}
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl transition-colors text-sm">
                Continue Exam
              </button>
              <button onClick={() => { setShowSubmitConfirm(false); handleFinalSubmit(selectedAnswers); }} className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-purple-200 text-sm">
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[1100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Warning!</h3>
            <p className="text-gray-500 font-medium mb-8">
              Are you sure you want to quit? Your progress will not be saved.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowExitWarning(false)} className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">
                Resume
              </button>
              <button 
                onClick={() => {
                  clearExamSession();
                  router.push("/dashboard/exams");
                }} 
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-red-200"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ExamPage = () => (
  <Suspense fallback={
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
    </div>
  }>
    <ExamContent />
  </Suspense>
);

export default ExamPage;
