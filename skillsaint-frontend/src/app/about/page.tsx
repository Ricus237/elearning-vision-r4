import PageHeader from "@/components/pageHeader";
import Features from "@/components/features";
import OurAchievements from "@/components/ourAchievements";
import Testimonial from "@/components/testimonial";
import Cta from "@/components/cta";
import { siteName } from "@/utils/envExport";
import { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Star, GraduationHat, BookOpen, Clock } from "@/lib/icons";

export const metadata: Metadata = {
  title: `About Us | ${siteName}`,
  description: "Learn more about Skillsaint and our mission to provide quality online education.",
};

const AboutPage = () => {
  return (
    <main>
      <PageHeader
        description="Dedicated to empowering learners worldwide with accessible, high-quality, and faith-centered education."
        subTitle="About Us"
      >
        Transforming Lives Through Knowledge
      </PageHeader>

      {/* Story Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                 {/* Replace with a real about image later */}
                <Image 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                    fill 
                    alt="Our Story" 
                    className="object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 size-48 bg-purple-600 rounded-[2rem] p-8 flex flex-col justify-center text-white shadow-xl rotate-3 hidden sm:flex">
                <span className="text-4xl font-black">10k+</span>
                <span className="text-sm font-bold uppercase tracking-wider opacity-80 leading-tight">Satisfied Students</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              <span className="inline-block px-4 py-2 rounded-full bg-purple-50 text-purple-600 font-bold text-xs uppercase tracking-widest self-start">Our Story</span>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
                Empowering the Leaders of Tomorrow
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Skillsaint was born out of a desire to bridge the gap between traditional learning and modern digital accessibility. Our platform provides a curated environment where faith and expertise converge, offering learners more than just technical skills.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-4 p-6 rounded-3xl bg-gray-50 border border-gray-100 transition-hover duration-300 hover:border-purple-200 hover:bg-white hover:shadow-lg">
                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-purple-600">
                        <GraduationHat className="size-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-1">Expert Led</h4>
                        <p className="text-xs text-gray-400">Learn from seasoned industry and theological experts.</p>
                    </div>
                </div>
                <div className="flex gap-4 p-6 rounded-3xl bg-gray-50 border border-gray-100 transition-hover duration-300 hover:border-purple-200 hover:bg-white hover:shadow-lg">
                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-purple-600">
                        <BookOpen className="size-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-1">Flexible Path</h4>
                        <p className="text-xs text-gray-400">Study at your own pace from anywhere in the world.</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with OurAchievements */}
      <OurAchievements />

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-950 text-white overflow-hidden relative">
        <div className="container relative z-10">
            <div className="max-w-2xl mb-16">
                <span className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-4 block">Core Values</span>
                <h2 className="text-4xl lg:text-5xl font-black leading-tight">Our Mission is to Ignite Your Potential</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: "Inspiration", desc: "We strive to inspire learners to reach their highest potential in both professional skills and spiritual growth." },
                    { title: "Innovation", desc: "Using cutting-edge technology to deliver immersive and effective learning experiences." },
                    { title: "Inclusion", desc: "Creating a global community where everyone, regardless of background, can share and gain knowledge." }
                ].map((item, idx) => (
                    <div key={idx} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="size-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-8 text-white text-2xl font-black">
                            0{idx + 1}
                        </div>
                        <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                        <p className="text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className="absolute top-0 right-0 size-[600px] bg-purple-600/20 blur-[150px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
      </section>

      <Features />
      <Testimonial />
      <Cta />
    </main>
  );
};

export default AboutPage;
