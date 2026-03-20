import Hero from "@/components/hero";
import Categories from "@/components/categories";
import OurAchievements from "@/components/ourAchievements";
import Courses from "@/components/courses";
import Features from "@/components/features";
import Testimonial from "@/components/testimonial";
import Cta from "@/components/cta";
import Blogs from "@/components/blogs";
import { siteName, siteUrl } from "@/utils/envExport";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Home | ${siteName}`,
  description: "Skillsaint - Comprehensive Christian Online Learning Platform",
  keywords: ["Christian Education", "Theology Online", "Biblical Studies"],
  alternates: {
    canonical: `${siteUrl}`,
  },
  openGraph: {
    title: "Skillsaint - Online Christian Education",
    description: "Deepen your faith and knowledge of Scripture through our structured learning program.",
    type: "website",
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Skillsaint Christian Education",
      },
    ],
  },
  twitter: {
    title: "Skillsaint - Online Christian Education",
    description: "Deepen your faith and knowledge of Scripture through our structured learning program.",
    card: "summary_large_image",
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Skillsaint Christian Education",
      },
    ],
  },
};

import { getHeroData } from "@/lib/data";

const Home = async () => {
  const heroData = await getHeroData();

  return (
    <main>
      <Hero 
        title={heroData.title}
        description={heroData.description}
      />

      <Categories />
      <OurAchievements />
      <Courses />
      <Features />
      <Testimonial />
      <Cta />
      <Blogs />
    </main>
  );
};

export default Home;

