/* eslint-disable */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loginAction } from "@/lib/actions";
import { getGlobalSiteData } from "@/lib/data";
import { Loader2, User, Lock as LockIcon } from "lucide-react";

// Google Icon Component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.5 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z" fill="#4285F4"/>
    <path d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z" fill="#34A853"/>
    <path d="M5.4 14.3c-.2-.7-.4-1.4-.4-2.3s.2-1.6.4-2.3V6.6H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l4-3.1z" fill="#FBBC05"/>
    <path d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l4 3.1c.9-2.8 3.5-4.9 6.6-4.9z" fill="#EA4335"/>
  </svg>
);

const LoginForm = ({ siteData }: { siteData: any }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const fd = new FormData();
    fd.append('email', formData.email);
    fd.append('password', formData.password);

    try {
      const result = await loginAction(fd);
      if (result.success) {
        const callbackUrl = searchParams.get("callbackUrl") || "/";
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error || "Une erreur est survenue");
      }
    } catch {
      setError("Connection failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
          {siteData?.auth?.login_title || "Login"}
        </h2>
        <p className="text-gray-500 text-base font-medium leading-relaxed max-w-xs mx-auto">
          {siteData?.auth?.login_subtitle || "How to i get started?"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
           <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <User className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
             </div>
             <input
               type="email"
               name="email"
               value={formData.email}
               onChange={handleChange}
               required
               placeholder="Username / Email"
               className="block w-full pl-12 pr-4 py-4.5 bg-gray-50 border-none rounded-xl text-base font-medium text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
             />
           </div>

           <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <LockIcon className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
             </div>
             <input
               type="password"
               name="password"
               value={formData.password}
               onChange={handleChange}
               required
               placeholder="Password"
               className="block w-full pl-12 pr-4 py-4.5 bg-gray-50 border-none rounded-xl text-base font-medium text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
             />
           </div>
        </div>
        
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2 text-lg mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login Now"}
        </button>

        

      
      </form>
    </div>
  );
};

export default function LoginPage() {
  const [siteData, setSiteData] = useState<any>(null);

  useEffect(() => {
    getGlobalSiteData().then(setSiteData);
  }, []);

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center h-auto min-h-screen relative overflow-y-auto">
           <Suspense fallback={<Loader2 className="w-10 h-10 text-purple-600 animate-spin" />}>
             <LoginForm siteData={siteData} />
           </Suspense>
        </div>

        {/* Right Side: Visual */}
        <div className="hidden lg:block lg:w-1/2 relative lg:h-screen lg:sticky lg:top-0 overflow-hidden">
           {/* Background Image/Gradient */}
           <div className="absolute inset-0">
             <Image 
               src={siteData?.auth?.login_bg || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029"} 
               alt="Background" 
               fill 
               className="object-cover"
               priority
               unoptimized
             />
             {/* Wavy Overlay */}
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-700/80 to-indigo-700/40 mix-blend-multiply" />
             
             {/* Abstract Waves */}
             <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.4" d="M0 400C300 350 400 450 720 400C1040 350 1140 450 1440 400V800H0V400Z" fill="white"/>
                <path opacity="0.2" d="M0 500C300 450 400 550 720 500C1040 450 1140 550 1440 500V800H0V500Z" fill="white"/>
             </svg>
           </div>

           {/* Content with normal scale */}
           <div className="absolute inset-0 flex items-center justify-center p-12 lg:p-24">
              <div className="relative w-full max-w-lg aspect-[4/5] overflow-hidden group">
                 <div className="absolute inset-8 rounded-[4rem] border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Image 
                      src={siteData?.auth?.login_image || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1974"} 
                      alt="Featured" 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      unoptimized
                    />
                 </div>
              </div>
           </div>
        </div>
    </main>
  );
}
