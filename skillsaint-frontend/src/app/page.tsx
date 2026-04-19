import React from "react";
import HomeClient from "@/components/home/HomeClient";
import { getHeroData, getAllCourses, getExtraSiteData } from "@/lib/data";

// Always fetch fresh Moodle data — no static cache
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  // Fetch real data from Moodle
  const [heroData, courses, extraData] = await Promise.all([
    getHeroData(),
    getAllCourses(),
    getExtraSiteData()
  ]);

  return (
    <HomeClient 
      heroData={heroData} 
      courses={courses} 
      extraData={extraData} 
    />
  );
}
