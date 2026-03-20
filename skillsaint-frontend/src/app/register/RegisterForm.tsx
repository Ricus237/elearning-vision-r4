"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getCourseById } from "@/lib/moodle";
import { CourseType } from "@/types/CourseType";
import { registerAction } from "@/lib/actions";

const RegisterForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams?.get("courseId");
  
  const [course, setCourse] = useState<CourseType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    isBeliever: "No",
    howLongBeliever: "",
    religion: "",
    conversionYear: "",
  });

  useEffect(() => {
    if (courseId) {
      getCourseById(parseInt(courseId)).then(setCourse);
    }
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value);
    });

    const result = await registerAction(fd);

    if (result.success) {
       // On attend un petit peu pour laisser les cookies se propager
       setTimeout(() => {
        if (courseId) {
          router.push(`/checkout?courseId=${courseId}`);
        } else {
          router.push("/");
        }
        // Force un refresh complet pour mettre à jour le header
        window.location.reload();
       }, 500);
    } else {
      setError(result.error || "Une erreur est survenue lors de l'inscription.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {course && (
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-secondary">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Selected Course: {course.title}</h3>
            <p className="text-sm mt-1">{course.shortDescription}</p>
          </div>
          <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-500 block mb-1">Fee</span>
            <span className="text-2xl font-bold text-gray-900">${(course.discountPrice || course.price || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Account Info Section */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="size-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
          Account Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text" name="firstName" required
              value={formData.firstName} onChange={handleChange}
              placeholder="John"
              className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text" name="lastName" required
              value={formData.lastName} onChange={handleChange}
              placeholder="Doe"
              className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email" name="email" required
            value={formData.email} onChange={handleChange}
            placeholder="john@example.com"
            className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
          <input
            type="password" name="password" required
            value={formData.password} onChange={handleChange}
            placeholder="********"
            className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="size-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
          Profile Details
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text" name="address"
            value={formData.address} onChange={handleChange}
            placeholder="123 Street Name"
            className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Are you a believer? *</label>
            <select
              name="isBeliever" value={formData.isBeliever} onChange={handleChange}
              className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          
          {formData.isBeliever === "Yes" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Since when? (Baptism/Faith)</label>
              <input
                type="text" name="howLongBeliever"
                value={formData.howLongBeliever} onChange={handleChange}
                placeholder="e.g. 2010"
                className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Religion *</label>
            <select
              name="religion" value={formData.religion} onChange={handleChange} required
              className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">Select...</option>
              <option value="Christianity">Christianity</option>
              <option value="Catholicism">Catholicism</option>
              <option value="Protestantism">Protestantism</option>
              <option value="Evangelical">Evangelical</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year of conversion</label>
            <input
              type="number" name="conversionYear"
              value={formData.conversionYear} onChange={handleChange}
              placeholder="e.g. 2015"
              className="w-full rounded-xl border-gray-200 border px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            />
          </div>
        </div>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
        >
          {loading ? "Chargement..." : "Sign Up & Complete Registration"}
          {!loading && (
             <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
             </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
