import PageHeader from "@/components/pageHeader";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import Cta from "@/components/cta";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";
import { ArrowRight, Star, GraduationHat, BookOpen, Clock, SearchIcon } from "@/lib/icons";

export const metadata: Metadata = {
  title: `Contact Us | ${siteName}`,
  description: "Get in touch with International Bible Institute support or partnership teams.",
};

const ContactPage = () => {
  return (
    <main>
      <PageHeader
        description="Have questions? We're here to help you on your educational journey."
        subTitle="Contact Us"
      >
        Get in Touch
      </PageHeader>

      <section className="py-20 lg:py-32 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              <div className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 mb-8">Contact Information</h3>
                
                <div className="space-y-10">
                    <div className="flex gap-5">
                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                            <Star className="size-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Email Us</p>
                            <a href="mailto:[EMAIL_ADDRESS]" className="text-lg font-bold text-gray-900 hover:text-purple-600 transition-colors">[EMAIL_ADDRESS]</a>
                        </div>
                    </div>

                    <div className="flex gap-5">
                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                            <Clock className="size-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Call Us</p>
                            <p className="text-lg font-bold text-gray-900">+1 (555) 000-0000</p>
                            <p className="text-sm text-gray-400">Mon - Fri, 9am - 5pm EST</p>
                        </div>
                    </div>

                    <div className="flex gap-5">
                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600 shrink-0">
                            <BookOpen className="size-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Our Office</p>
                            <p className="text-lg font-bold text-gray-900 line-clamp-2">123 Education Way, Learning Suite 404, Tech City</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Social Links placeholder */}
              <div className="p-10 rounded-[2.5rem] bg-purple-600 text-white">
                <h4 className="text-xl font-bold mb-4">Follow Our Journey</h4>
                <p className="text-white/70 text-sm mb-6">Stay updated with the latest courses and educational insights.</p>
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="size-10 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer flex items-center justify-center transition-colors">
                            <div className="size-4 bg-white rounded-full opacity-50" />
                        </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Contact Form Area */}
            <div className="lg:col-span-2">
              <div className="p-10 lg:p-16 rounded-[3rem] bg-white border border-gray-100 shadow-xl shadow-gray-100/50">
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">Send us a Message</h2>
                <p className="text-gray-500 mb-12">Fill out the form below and our team will get back to you within 24 hours.</p>

                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <Input placeholder="John Doe" className="h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white px-6" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                      <Input type="email" placeholder="john@example.com" className="h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white px-6" />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                      <Input placeholder="+1 (555) 000-0000" className="h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white px-6" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Subject</label>
                      <Input placeholder="Course Inquiry" className="h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white px-6" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Your Message</label>
                    <Textarea 
                      placeholder="How can we help you today?" 
                      className="min-h-40 rounded-3xl bg-gray-50 border-gray-100 focus:bg-white p-6"
                    />
                  </div>

                  <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-bold group">
                    Send Message
                    <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Cta />
    </main>
  );
};

export default ContactPage;
