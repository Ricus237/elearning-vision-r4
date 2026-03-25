import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white py-16 border-t border-slate-100">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col items-center text-center space-y-10">
          
          {/* Main Identity */}
          <div className="space-y-4">
            <Link href="/" className="text-3xl font-black font-serif tracking-tight text-slate-900 block">
              International Bible Institute
            </Link>
            <p className="text-slate-400 font-medium italic max-w-lg mx-auto leading-relaxed">
              A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God
            </p>
          </div>

          {/* Simple Navigation */}
          <nav className="flex flex-wrap justify-center gap-x-12 gap-y-4">
             {[
               { name: "Home", link: "/" },
               { name: "About", link: "/about" },
               { name: "Programs", link: "/programs" },
               { name: "Apply Now", link: "/apply" },
               { name: "Contact", link: "/contact" },
             ].map((route) => (
               <Link 
                 key={route.name} 
                 href={route.link}
                 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 hover:text-purple-600 transition-colors"
               >
                 {route.name}
               </Link>
             ))}
          </nav>

          {/* Minimal Copyright */}
          <div className="pt-10 border-t border-slate-50 w-full flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
             <p>© {new Date().getFullYear()} IBI. All rights reserved.</p>
             <div className="flex gap-8">
                <Link href="#" className="hover:text-slate-500">Privacy</Link>
                <Link href="#" className="hover:text-slate-500">Terms</Link>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
