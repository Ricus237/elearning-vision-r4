import React from "react";
import Link from "next/link";


interface FooterProps {
  siteName?: string;
  description?: string;
}

const Footer = ({ siteName, description }: FooterProps) => {
  return (
    <footer className="bg-white py-12 border-t border-slate-100">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* Main Identity */}
          <div className="space-y-6">
            <Link href="/" className="text-3xl font-black tracking-tight text-slate-900 block group transition-all">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                {siteName || "Global Bible Institute"}
              </span>
            </Link>
            <p className="text-slate-500 font-medium italic max-w-xl mx-auto leading-relaxed text-lg lg:text-xl px-4 opacity-80">
              {description || "A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God"}
            </p>
          </div>

          {/* Simple Navigation */}
          <nav className="flex flex-wrap justify-center gap-x-12 gap-y-6 pt-6 mb-4">
             {[
               { name: "Home", link: "/" },
               { name: "About", link: "/about" },
               { name: "Programs", link: "/programs" },
               { name: "Contact", link: "/contact" },
             ].map((route) => (
               <Link 
                 key={route.name} 
                 href={route.link}
                 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900/40 hover:text-purple-600 transition-all hover:translate-y-[-2px]"
               >
                 {route.name}
               </Link>
             ))}
          </nav>

          {/* Minimal Copyright */}
          <div className="pt-10 border-t border-slate-50 w-full flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/60">
             <div className="flex flex-col md:flex-row items-center gap-4">
                <p>© {new Date().getFullYear()} All rights reserved.</p>
                <span className="hidden md:inline-block opacity-30">|</span>
                <p>
                  Made by <a href="https://visionca.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 transition-colors font-black">Vision/R4</a>
                </p>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
