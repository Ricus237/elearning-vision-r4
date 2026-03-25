"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button";

const ExamsPage = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examAnswers, setExamAnswers] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock the user in
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "TEACHER123") {
      setIsAuthorized(true);
      setError("");
      // Request fullscreen
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen API failed", err);
      });
    } else {
      setError("Invalid permission code. Please contact your teacher.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate sending email
    setTimeout(() => {
        setIsSubmitting(false);
        alert("Exam submitted successfully. Results have been emailed to the administration.");
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        window.location.href = "/";
    }, 2000);
  };

  if (!isAuthorized) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-serif">
              Exam Portal
            </h2>
            <p className="mt-2 text-sm text-red-600 font-bold">
              Locked out. Teacher permission required.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuthorize}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="passcode" className="sr-only">Passcode</label>
                <input
                  id="passcode"
                  name="passcode"
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Enter Access Code (Hint: TEACHER123)"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Button type="submit" className="w-full flex justify-center py-3">
                Unlock Exam
              </Button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
        <div className="max-w-4xl mx-auto py-12 px-6">
            {!isFullscreen && (
                <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-8 flex justify-between items-center border border-red-200">
                    <div>
                        <span className="font-bold">Warning:</span> You left fullscreen mode. Please return to fullscreen to continue your exam.
                    </div>
                    <Button variant="outline" onClick={() => document.documentElement.requestFullscreen()} className="border-red-300 text-red-700 hover:bg-red-100">
                        Go Fullscreen
                    </Button>
                </div>
            )}
            
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black font-serif text-gray-900 mb-2">Final Examination</h1>
                <p className="text-gray-500">International Bible Institute</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 font-serif">Question 1: Essay</h3>
                    <p className="text-gray-700 mb-6">Explore the significance of the transforming work of the Spirit in the life of a modern leader.</p>
                    <textarea 
                        required 
                        rows={12} 
                        className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:outline-none" 
                        placeholder="Write your answer here..."
                        value={examAnswers}
                        onChange={(e) => setExamAnswers(e.target.value)}
                    ></textarea>
                </div>

                <div className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl text-white">
                    <div>
                        <p className="text-sm text-gray-400">Ensure you have answered all questions before submitting.</p>
                        <p className="text-xs text-gray-500 mt-1">This page will send your responses directly via email to administration.</p>
                    </div>
                    <Button type="submit" size="lg" disabled={isSubmitting} className="px-10 py-3 bg-white text-gray-900 hover:bg-gray-100">
                        {isSubmitting ? "Submitting..." : "Submit Exam"}
                    </Button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default ExamsPage;
