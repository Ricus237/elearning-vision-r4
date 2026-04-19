"use client";
import { useEffect, useState } from "react";
import { MenuType } from ".";
import Link from "next/link";
import {
  MenuIcon,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const MobileNavigation = ({ data }: { data: MenuType[] }) => {
  const pathName = usePathname();
  const [navbarShow, setNavbarShow] = useState(false);

  useEffect(() => {
    setNavbarShow(false);
  }, [pathName]);

  return (
    <div className="xl:hidden">
      <button 
        onClick={() => setNavbarShow(true)} 
        className="p-2.5 text-slate-900 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-colors"
      >
        <MenuIcon size={28} />
      </button>

      <AnimatePresence>
        {navbarShow && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setNavbarShow(false)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white p-12 flex flex-col gap-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="self-end p-2 text-slate-900" 
                onClick={() => setNavbarShow(false)}
              >
                <X size={32} />
              </button>
              
              <div className="flex flex-col gap-8 text-2xl font-black text-slate-900">
                {data.map(({ href, id, label }) => (
                  <Link 
                    key={id}
                    href={href} 
                    onClick={() => setNavbarShow(false)}
                    className={cn(
                      "transition-colors",
                      pathName === href ? "text-purple-600 font-black" : "hover:text-purple-600 font-black"
                    )}
                  >
                    {label}
                  </Link>
                ))}
                
                <div className="flex flex-col gap-4 mt-6">
                  <Link 
                    href="/dashboard" 
                    onClick={() => setNavbarShow(false)} 
                    className="py-5 border-2 border-slate-100 text-slate-900 rounded-[2rem] text-center text-lg font-black tracking-tight"
                  >
                    Student Login
                  </Link>
                  <Link 
                    href="/apply" 
                    onClick={() => setNavbarShow(false)} 
                    className="py-5 bg-purple-600 text-white rounded-[2rem] text-center text-lg font-black tracking-tight shadow-xl shadow-purple-100"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileNavigation;
