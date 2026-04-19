"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import Navigation from "./navigation";
import MobileNavigation from "./mobileNavigation";

export type MenuType = {
  id: number;
  label: string;
  href: string;
  subMenu?: {
    id: number;
    label: string;
    href: string;
  }[];
};

const menuList: MenuType[] = [
  {
    id: 1,
    label: "Home",
    href: "/",
  },
  {
    id: 2,
    label: "About",
    href: "/about",
  },
  {
    id: 3,
    label: "Programs",
    href: "/programs",
  },
  {
    id: 4,
    label: "Login",
    href: "/dashboard",
  },
];

const Header = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const isAuthPage = pathname === "/login" || pathname === "/forgot-password";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      style={{ 
        backgroundColor: isAuthPage 
          ? "#ffffff" 
          : `rgba(255, 255, 255, ${isScrolled ? 0.9 : 0.8})` 
      }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
        (isScrolled || isAuthPage) ? "py-4 shadow-sm border-b border-slate-100" : "py-6"
      }`}
    >
      <div className="container px-6 mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-105 transition-transform">
            <BookOpen size={24} />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Global Bible Institute
          </span>
        </Link>

        <div className="hidden xl:flex items-center gap-6">
          <Navigation data={menuList} />
          <Link href="/apply" className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 hover:shadow-purple-200 hover:-translate-y-0.5 text-sm">
            Apply Now
          </Link>
        </div>

        <div className="xl:hidden flex items-center gap-4">
           <MobileNavigation data={menuList} />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
