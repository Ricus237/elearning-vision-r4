"use client";
import { useState } from "react";
import Button from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { examQuestions } from "@/data/curriculum";

// Use the first course's exam questions
const courseExamQuestions = examQuestions[0]?.questions || [
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
  {
    id: 2,
    question: "What is the primary means of salvation in Christian theology?",
    options: [
      "Good works and moral behavior",
      "Faith in Jesus Christ and his redemptive work",
      "Adherence to religious laws",
      "Personal spiritual enlightenment",
    ],
    correct: 1,
    difficulty: "easy",
  },
];

const ExamPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelect = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < courseExamQuestions.length - 1) {
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
    courseExamQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        score++;
      }
    });
    return score;
  };

  if (isSubmitted) {
    const score = calculateScore();
    const passingScore = Math.ceil(courseExamQuestions.length * 0.7);
    const passed = score >= passingScore;
    
    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-card max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className={`w-20 h-20 ${passed ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <h2 className="text-3xl font-bold mb-4">{passed ? "Congratulations!" : "Exam Completed"}</h2>
          <p className="text-gray-600 mb-8 text-lg">
            You scored <span className="font-bold text-gray-900">{score}</span> out of <span className="font-bold text-gray-900">{courseExamQuestions.length}</span>.
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

  const question = courseExamQuestions[currentQuestion];

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Course Final Examination</h1>
          <span className="text-sm font-medium bg-purple-100 text-purple-800 px-4 py-1.5 rounded-full">
            Question {currentQuestion + 1} of {courseExamQuestions.length}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-8 md:p-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-8 text-gray-900">
            {question.question}
          </h2>

          <div className="space-y-4">
            {question.options.map((option, idx) => {
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

          <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion === courseExamQuestions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={selectedAnswers[currentQuestion] === undefined} className="px-8">
                Submit Exam
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={selectedAnswers[currentQuestion] === undefined} className="px-8">
                Next <span className="ml-2">→</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;
