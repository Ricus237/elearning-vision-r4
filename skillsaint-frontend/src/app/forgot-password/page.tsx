"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { forgotPasswordAction } from "@/lib/actions";
import { getGlobalSiteData } from "@/lib/data";
import { Loader2, Mail, ArrowLeft, CheckCircle2, Lock as LockIcon } from "lucide-react";

const ForgotPasswordForm = ({ siteData }: { siteData: any }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    const fd = new FormData();
    fd.append('email', email);

    try {
      const result = await forgotPasswordAction(fd) as { success: boolean, message?: string, error?: string };
      if (result.success) {
        setSuccess(result.message || "Instructions sent!");
      } else {
        setError(result.error || "An error occurred");
      }
    } catch {
      setError("Connection failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto text-center px-6 py-12">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Check your Email</h2>
        <p className="text-gray-500 text-base font-medium mb-10 leading-relaxed max-w-xs mx-auto">
          {success}
        </p>
        <Link 
          href="/login" 
          className="inline-flex items-center gap-3 text-base font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-8 py-5 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          {siteData?.auth?.forgot_title || "Reset Password"}
        </h2>
        <p className="text-gray-500 text-base font-medium leading-relaxed max-w-xs mx-auto">
          {siteData?.auth?.forgot_subtitle || "Enter your email to receive recovery instructions."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email Address"
            className="block w-full pl-12 pr-4 py-5 bg-gray-50 border-none rounded-xl text-base font-medium text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Code"}
        </button>

        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Wait, I remember my password
          </Link>
        </div>
      </form>
    </div>
  );
};

export default function ForgotPasswordPage() {
  const [siteData, setSiteData] = useState<any>(null);

  useEffect(() => {
    getGlobalSiteData().then(setSiteData);
  }, []);

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center h-auto min-h-screen relative overflow-y-auto">
           <Suspense fallback={<Loader2 className="w-10 h-10 text-purple-600 animate-spin" />}>
             <ForgotPasswordForm siteData={siteData} />
           </Suspense>
        </div>

        {/* Right Side: Visual */}
        <div className="hidden lg:block lg:w-1/2 relative lg:h-screen lg:sticky lg:top-0 overflow-hidden bg-indigo-600">
           <Image 
             src={siteData?.auth?.login_bg || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029"} 
             alt="Background" 
             fill 
             className="object-cover"
             unoptimized
           />
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/80 to-purple-800/60 backdrop-blur-[2px]" />
           
           <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-[40px] rounded-full flex items-center justify-center mb-10 border border-white/20 shadow-2xl">
                 <LockIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-4xl font-black mb-6 tracking-tight">Secure Recovery</h3>
              <p className="max-w-xs text-white/80 text-base font-medium leading-relaxed">
                Your account security is our priority. Follow the steps to regain access to your space.
              </p>
           </div>
        </div>
    </main>
  );
}
