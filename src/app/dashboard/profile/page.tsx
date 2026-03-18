"use client";
import { useState } from "react";
import { Camera, Mail, MapPin, Calendar, BookOpen, Award } from "lucide-react";
import Image from "next/image";
import { mockStudents, mockEnrollments, mockExamScores } from "@/data/students";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

const currentStudent = mockStudents[0];
const studentEnrollments = mockEnrollments.filter(e => e.studentId === currentStudent.id);
const studentExamScores = mockExamScores.filter(e => e.studentId === currentStudent.id);

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentStudent.name,
    email: currentStudent.email,
    address: currentStudent.address,
    bio: "Passionate learner seeking to deepen my understanding of Christian theology and biblical studies.",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    // In production, this would call an API
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-secondary mt-1">Manage your personal information.</p>
          </header>

          {/* Profile Header Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-purple-500 to-indigo-600 relative"></div>
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-12">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                    <Image
                      src={currentStudent.profileImage}
                      alt={currentStudent.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors shadow-sm">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentStudent.name}</h2>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {currentStudent.isBeliever ? `Believer • ${currentStudent.yearsBeliever}` : "Seeker"}
                    </p>
                  </div>
                  <button
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                      isEditing
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{formData.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{formData.email}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{formData.address}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Bio</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 resize-none"
                      />
                    ) : (
                      <p className="text-gray-700 text-sm leading-relaxed">{formData.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Enrolled Courses</p>
                      <p className="font-bold text-gray-900">{studentEnrollments.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Exams Passed</p>
                      <p className="font-bold text-gray-900">{studentExamScores.filter(e => e.score >= e.maxScore * 0.7).length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-bold text-gray-900">
                        {new Date(currentStudent.registeredAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
