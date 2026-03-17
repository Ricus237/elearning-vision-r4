"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { coursesData } from "@/components/courses/courseData";
import { CourseType } from "@/types/CourseType";

const RegisterForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams?.get("courseId");
  
  const [course, setCourse] = useState<CourseType | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    isBeliever: "No",
    howLongBeliever: "",
  });

  useEffect(() => {
    if (courseId) {
      const foundCourse = coursesData.find((c) => c._id === courseId);
      if (foundCourse) {
        setCourse(foundCourse);
      }
    }
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseId) {
      router.push(`/checkout?courseId=${courseId}`);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {course && (
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Selected Course: {course.title}</h3>
            <p className="text-secondary text-sm mt-1">{course.shortDescription}</p>
          </div>
          <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500 block mb-1">Registration Fee</span>
            <span className="text-2xl font-bold text-gray-900">${(course.discountPrice || course.price).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            placeholder="John Doe"
            className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="123 Main St, City, Country"
            className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="isBeliever" className="block text-sm font-medium text-gray-700 mb-2">
            Are you a believer? <span className="text-red-500">*</span>
          </label>
          <select
            id="isBeliever"
            name="isBeliever"
            value={formData.isBeliever}
            onChange={handleChange}
            required
            className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm bg-white"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {formData.isBeliever === "Yes" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="howLongBeliever" className="block text-sm font-medium text-gray-700 mb-2">
              If yes, how long have you been a believer? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="howLongBeliever"
              name="howLongBeliever"
              value={formData.howLongBeliever}
              onChange={handleChange}
              required={formData.isBeliever === "Yes"}
              placeholder="e.g. 5 years, since childhood..."
              className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="pt-6">
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-300 shadow-md flex items-center justify-center gap-2 group"
        >
          <span>Complete Registration</span>
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
