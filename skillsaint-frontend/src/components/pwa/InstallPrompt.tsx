"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const InstallPrompt = () => {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  }
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if it's a mobile/tablet or small window
    const checkSize = () => {
      const isSmallScreen = window.innerWidth < 1024;
      const isStandalone = ('standalone' in window.navigator && window.navigator.standalone) || 
                         window.matchMedia("(display-mode: standalone)").matches;

      // Only show if small screen and not already installed
      if (isSmallScreen && !isStandalone) {
        // Show after a small delay for better UX
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    checkSize();
    window.addEventListener("resize", checkSize);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("resize", checkSize);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Logic for iOS or fallback
      alert("To install: tap the share button (middle button at bottom) and then 'Add to Home Screen'.");
      setShowPrompt(false);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:max-w-sm"
        >
          <div className="bg-white rounded-[2rem] shadow-2xl border border-purple-100 p-6 flex flex-col gap-4">
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-100">
                <Smartphone size={28} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-slate-900  text-lg leading-tight">Install IBI App</h4>
                <p className="text-slate-500 text-sm leading-relaxed mt-1">
                  Access your lessons faster and even offline by adding IBI to your home screen.
                </p>
              </div>
            </div>

            <button
              onClick={handleInstall}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Download size={18} />
              Install Application
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
