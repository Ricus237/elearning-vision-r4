import React from "react";
import AboutClient from "@/components/about/AboutClient";
import { getAboutData } from "@/lib/data";

export default async function AboutPage() {
  const data = await getAboutData();

  return (
    <AboutClient data={data} />
  );
}
