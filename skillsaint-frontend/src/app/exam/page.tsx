"use client";
import { useState, useEffect, Suspense } from "react";
import Button from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { examQuestions } from "@/data/curriculum";
import { useSearchParams } from "next/navigation";
import { getQuizQuestionsAction } from "@/lib/actions";

// Use the first course's exam questions as default fallback
const defaultExamQuestions = examQuestions[0]?.questions || [
  {
    id: 1,
    question: "According to Christian doctrine, what are the three persons of the Trinity?",
    options: [
      "The Father, the Son, and the Holy Ghost",
      "The Creator, the Judge, and the Redeemer",
      "The Almighty, the Savior, and the Comforter",
      "All of the above are theological descriptions",
    ],
    correct: 0,
    difficulty: "easy",
  },
];

interface QuestionType {
  id: number;
  question: string;
  options: string[];
  correct: number;
  difficulty: string;
  isReal?: boolean;
  html?: string;
}

const ExamContent = () => {
  const searchParams = useSearchParams();
  const quizIdStr = searchParams.get("quizId");
  
  const [questions, setQuestions] = useState<QuestionType[]>(defaultExamQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(!!quizIdStr);
  const [error, setError] = useState<string | null>(null);
  const [quizName, setQuizName] = useState("Course Final Examination");

  useEffect(() => {
    async function loadQuiz() {
      if (!quizIdStr) return;
      
      setIsLoading(true);
      const result = await getQuizQuestionsAction(parseInt(quizIdStr));
      
      if (result.success && result.questions) {
        // Map Moodle questions to our simple format
        const mappedQuestions = result.questions.map((q: { html?: string; slot: number }) => {
          // Moodle HTML extraction is complex, we'll try to strip tags for now
          // In a real app, we'd render the HTML safely
          const cleanQuestion = q.html?.replace(/<[^>]*>?/gm, '').split('Question')[0].trim() || q.slot.toString();
          
          return {
            id: q.slot,
            question: cleanQuestion,
            options: ["Option 1", "Option 2", "Option 3", "Option 4"], // Options are hidden in HTML in Moodle WS
            correct: 0,
            difficulty: "medium",
            isReal: true,
            html: q.html // Keep original html for reference
          };
        });
        
        if (mappedQuestions.length > 0) {
          setQuestions(mappedQuestions);
          setQuizName(result.quizName);
        }
      } else if (result.error) {
        setError(result.error);
      }
      setIsLoading(false);
    }
    
    loadQuiz();
  }, [quizIdStr]);

  const handleSelect = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      // For real Moodle questions, we'd need to submit them to Moodle to get the score
      // For now we simulate if it's a real question from Moodle
      if (q.isReal) {
        if (selectedAnswers[idx] !== undefined) score++; // Award point for answering
      } else {
        if (selectedAnswers[idx] === q.correct) {
          score++;
        }
      }
    });
    return score;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium tracking-wide">Fetching your examination from Moodle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-card max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Examination Error</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button asChild className="w-full">
            <Link href="/courses">Return to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const score = calculateScore();
    const passingScore = Math.ceil(questions.length * 0.7);
    const passed = score >= passingScore;
    
    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-card max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className={`w-20 h-20 ${passed ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <h2 className="text-3xl font-bold mb-4">{passed ? "Congratulations!" : "Exam Completed"}</h2>
          <p className="text-gray-600 mb-8 text-lg">
            You scored <span className="font-bold text-gray-900">{score}</span> out of <span className="font-bold text-gray-900">{questions.length}</span>.
            {passed ? " You have successfully completed this course examination." : " Unfortunately, you did not achieve the passing score. Please review and try again!"}
          </p>
          <Button asChild size="lg" className="w-full py-4 text-lg">
            <Link href="/courses">
              Return to Courses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{quizName}</h1>
          <span className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-1.5 rounded-full">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-8 md:p-12">
          {question.isReal ? (
            <div 
              className="prose prose-purple max-w-none mb-8 text-xl font-medium"
              dangerouslySetInnerHTML={{ __html: question.html || '' }}
            />
          ) : (
            <h2 className="text-xl md:text-2xl font-semibold mb-8 text-gray-900">
              {question.question}
            </h2>
          )}

          {!question.isReal && (
            <div className="space-y-4">
              {question.options.map((option: string, idx: number) => {
                const isSelected = selectedAnswers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-100 bg-white hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-purple-600" : "border-gray-300"
                      }`}>
                        {isSelected && <div className="w-3 h-3 rounded-full bg-purple-600" />}
                      </div>
                      <span className={`text-lg ${isSelected ? "text-purple-900 font-medium" : "text-gray-700"}`}>
                        {option}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {question.isReal && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
               <p className="text-sm text-yellow-700 font-medium">
                  Note: Multiple-choice questions fetched from Moodle are rendered directly. Use the radio buttons inside the question above to select your answer.
               </p>
            </div>
          )}

          <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button onClick={handleSubmit} className="px-8">
                Submit Exam
              </Button>
            ) : (
              <Button onClick={handleNext} className="px-8">
                Next <span className="ml-2">→</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ExamContent />
  </Suspense>
);

export default ExamPage;
