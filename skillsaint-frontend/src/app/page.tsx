import React from "react";
import HomeClient from "@/components/home/HomeClient";
import { getHeroData, getAllCourses, getExtraSiteData } from "@/lib/data";

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
