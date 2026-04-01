import React from "react";
import ApplyClient from "./ApplyClient";
import { getEnrollmentData, getAllCourses } from "@/lib/data";

export default async function ApplyPage() {
  const [enrollmentData, courses] = await Promise.all([
    getEnrollmentData(),
    getAllCourses()
  ]);

  return (
    <ApplyClient enrollmentData={enrollmentData} courses={courses} />
  );
}
