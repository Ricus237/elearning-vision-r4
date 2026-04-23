"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  MessageSquare,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Rays } from "@/components/magicui/rays";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { sendContactAction } from "@/lib/actions";

interface ContactClientProps {
  siteData: any;
}

export default function ContactClient({ siteData }: ContactClientProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.1 }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await sendContactAction(formData);
      if (result.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Une erreur est survenue.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Impossible d'envoyer le message pour le moment.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-100 selection:text-purple-900 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
        <Rays className="opacity-60 scale-100" />
        
        <div className="container px-6 mx-auto relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-8 bg-purple-50 text-purple-600"
            >
              <Zap size={14} className="fill-purple-600" />
              Get in Touch
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight"
            >
              How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">help you?</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl font-medium"
            >
              Have questions about our programs or need support? Our team is here to assist you on your educational journey.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 bg-slate-50 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left: Contact Info */}
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="lg:col-span-4 space-y-6"
            >
              <motion.div variants={fadeIn} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 transition-all duration-500">
                <div className="size-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
                  <Mail size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Email Us</h3>
                <p className="text-slate-500 text-sm mb-4">Direct support for all your inquiries.</p>
                <a href="mailto:contact@visionca.com" className="text-lg font-bold text-purple-600 hover:underline">contact@visionca.com</a>
              </motion.div>

              <motion.div variants={fadeIn} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500">
                <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                  <Globe size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Global Support</h3>
                <p className="text-slate-500 text-sm mb-4">Available for international students.</p>
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Clock size={16} className="text-slate-400" />
                    <span>Mon - Fri, 9am - 6pm</span>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="p-8 rounded-[2.5rem] bg-purple-600 text-white shadow-2xl shadow-purple-200">
                <h3 className="text-xl font-bold mb-4">Student Portal</h3>
                <p className="text-purple-100 text-sm mb-6">Already a student? Access your courses and community directly.</p>
                <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-2xl h-14 font-bold">
                    Go to Dashboard
                </Button>
              </motion.div>
            </motion.div>

            {/* Right: Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-8"
            >
              <div className="p-10 lg:p-16 rounded-[3rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden h-full min-h-[600px] flex flex-col">
                <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-50">
                    <MessageSquare size={160} strokeWidth={1} />
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Send a Message</h2>
                  <p className="text-slate-500 mb-12 font-medium">We'll get back to you as soon as possible.</p>

                  <AnimatePresence mode="wait">
                    {status === "success" ? (
                      <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-purple-50 rounded-[2rem] border border-purple-100"
                      >
                        <div className="size-20 rounded-full bg-purple-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-purple-200">
                          <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Message Sent!</h3>
                        <p className="text-slate-600 font-medium mb-8 max-w-sm">Thank you for reaching out. Our team will get back to you as soon as possible.</p>
                        <Button 
                          onClick={() => setStatus("idle")}
                          variant="outline" 
                          className="rounded-2xl border-purple-200 text-purple-600 hover:bg-purple-100 font-bold"
                        >
                          Send another message
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.form 
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit} 
                        className="space-y-8"
                      >
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                            <Input 
                              required
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Your Name" 
                              className="h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white px-6 text-base font-medium" 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <Input 
                              required
                              type="email" 
                              value={formData.email}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              placeholder="hello@example.com" 
                              className="h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white px-6 text-base font-medium" 
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                          <Input 
                            required
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="What is this regarding?" 
                            className="h-16 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white px-6 text-base font-medium" 
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
                          <Textarea 
                            required
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us how we can help..." 
                            className="min-h-[200px] rounded-[2rem] bg-slate-50 border-slate-100 focus:bg-white p-8 text-base font-medium leading-relaxed"
                          />
                        </div>

                        {status === "error" && (
                          <p className="text-red-500 text-sm font-bold ml-1">{errorMessage}</p>
                        )}

                        <Button 
                          disabled={status === "loading"}
                          className="w-full h-18 py-6 rounded-[1.5rem] text-lg font-black bg-slate-900 hover:bg-purple-600 transition-all duration-500 group shadow-xl shadow-slate-200 hover:shadow-purple-200 hover:-translate-y-1 disabled:opacity-70 disabled:hover:-translate-y-0"
                        >
                          {status === "loading" ? (
                            <Loader2 className="animate-spin size-6" />
                          ) : (
                            <>
                              Send Message
                              <ArrowRight className="ml-3 size-5 transition-transform group-hover:translate-x-2" />
                            </>
                          )}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
