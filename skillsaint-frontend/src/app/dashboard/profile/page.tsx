"use client";
import { useState, useEffect } from "react";
import { Camera, Mail, MapPin, Calendar, BookOpen, Award, CheckCircle, Save, Edit3, User } from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import Image from "next/image";
import { getProfileDataAction, updateProfileDataAction } from "@/lib/actions";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "Loading...",
    email: "Loading...",
    address: "Not specified",
    bio: "Passionate learner seeking to deepen my understanding of Christian theology and biblical studies.",
  });
  const [stats, setStats] = useState({
    enrolledCoursesCount: 0,
    examsPassed: 0,
    firstaccess: Date.now() / 1000
  });

  const [isSaving, setIsSaving] = useState(false);
  const [userProfileUrl, setUserProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProfileDataAction();
        if (data) {
          setFormData({
             name: data.fullname || data.username,
             email: data.email || (data.username.includes("@") ? data.username : `${data.username}@example.com`),
             address: data.address || "Not specified",
             bio: data.bio || "Moodle user enrolled in our eLearning platform.",
          });
          setStats({
            enrolledCoursesCount: data.enrolledCoursesCount,
            examsPassed: data.examsPassed,
            firstaccess: data.firstaccess
          });
          if (data.userpictureurl && data.userpictureurl !== "") {
             setUserProfileUrl(data.userpictureurl);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfileDataAction({
        name: formData.name,
        email: formData.email,
        address: formData.address,
        bio: formData.bio
      });
      if (result && result.error) {
        alert("Error while updating profile: " + result.error);
      } else {
        setIsEditing(false);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      <StudentSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Header Section */}
            <header className="animate-in slide-in-from-left duration-700">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-1 rounded-full bg-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Identity</span>
               </div>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                      My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Profile</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-xl text-sm">
                      Personalize your identity and academic presence in the IBI community.
                    </p>
                  </div>
                  <button
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    disabled={isSaving}
                    className={`group flex items-center gap-3 px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all duration-300 ${isEditing ? "bg-emerald-600 text-white shadow-emerald-100" : "bg-gray-900 text-white shadow-gray-200"}`}
                  >
                    {isEditing ? (isSaving ? <span className="animate-pulse">Saving...</span> : <><Save size={16} /> Finish Editing</>) : <><Edit3 size={16} /> Update Info</>}
                  </button>
               </div>
            </header>

            {/* Profile Hero Card */}
            <div className="relative animate-in fade-in duration-1000 slide-in-from-bottom-5">
               <div className="h-48 md:h-64 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[3rem] shadow-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
               </div>
               
               <div className="px-10 -mt-20 relative z-10 flex flex-col md:flex-row items-end gap-8 pb-4">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-white bg-gray-50 shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.02]">
                       {userProfileUrl ? (
                         <Image width={160} height={160} src={userProfileUrl} alt={formData.name} className="w-full h-full object-cover" unoptimized />
                       ) : (
                         <div className="text-5xl font-black text-gray-200 uppercase">{formData.name.charAt(0)}</div>
                       )}
                    </div>
                    <button className="absolute bottom-2 right-2 w-12 h-12 bg-white border border-gray-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-xl hover:bg-purple-600 hover:text-white transition-all transform hover:rotate-6">
                       <Camera size={20} />
                    </button>
                  </div>

                  <div className="flex-1 pt-2">
                     <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{formData.name}</h2>
                        <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full">
                           <CheckCircle size={14} />
                        </div>
                     </div>
                     <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <div className="flex items-center gap-2">
                           <Mail size={12} className="text-purple-500" />
                           {formData.email}
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar size={12} className="text-purple-500" />
                           Enrolled {new Date(stats.firstaccess * 1000).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               
               {/* Information Forms */}
               <div className="lg:col-span-2 space-y-8 animate-in fade-in duration-1000 delay-300">
                  <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900">
                          <User size={18} />
                       </div>
                       <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <Field 
                          label="Full Display Name" 
                          name="name" 
                          value={formData.name} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                          className="md:col-span-1"
                       />
                       <Field 
                          label="Student Email" 
                          name="email" 
                          value={formData.email} 
                          type="email" 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                          className="md:col-span-1"
                          disabled
                       />
                       <Field 
                          label="Primary Address" 
                          name="address" 
                          value={formData.address} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                          className="md:col-span-2"
                       />
                       <div className="md:col-span-2 space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Personal Bio / Philosophy</label>
                          {isEditing ? (
                             <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-purple-50 focus:bg-white outline-none resize-none transition-all"
                             />
                          ) : (
                             <div className="p-8 bg-purple-50 rounded-[2rem] border-2 border-dashed border-purple-100">
                                <p className="text-sm font-medium text-purple-900 leading-relaxed italic opacity-80 decoration-purple-200">&quot;{formData.bio}&quot;</p>
                             </div>
                          )}
                       </div>
                    </div>
                  </section>
               </div>

               {/* Stats Sidebar */}
               <div className="space-y-6 animate-in fade-in duration-1000 delay-500">
                  <div className="bg-gray-900 rounded-[2.5rem] border border-gray-900 p-8 text-white shadow-2xl shadow-gray-200 overflow-hidden relative">
                     <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                           <Award size={28} className="text-purple-400" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-8">Academic Standing</h4>
                        
                        <div className="grid grid-cols-1 w-full gap-6">
                           <StatItem icon={<BookOpen size={16} />} label="Enrolled Units" value={stats.enrolledCoursesCount} />
                           <StatItem icon={<MapPin size={16} />} label="Location" value={formData.address === "Not specified" ? "Remote Student" : formData.address} />
                           <StatItem icon={<Award size={16} />} label="Assessments" value={`${stats.examsPassed} Passed`} />
                        </div>
                     </div>
                     {/* Decorative background circle */}
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[60px]" />
                  </div>

                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center">
                     <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Account Integrity</p>
                     <p className="text-xs font-semibold text-gray-500 mb-6 leading-relaxed">Your data is synced with the International Bible Institute central registry.</p>
                     <button className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:scale-105 transition-transform">Privacy Settings →</button>
                  </div>
               </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

interface FieldProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
  disabled?: boolean;
}

const Field = ({ label, name, value, type = "text", isEditing, onChange, className = "", disabled = false }: FieldProps) => (
  <div className={`space-y-4 ${className}`}>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{label}</label>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium focus:ring-4 focus:ring-purple-50 focus:bg-white outline-none transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
    ) : (
      <div className="px-6 py-4 bg-white border border-gray-50 rounded-2xl text-sm font-black text-gray-900 shadow-sm flex items-center justify-between">
         {value}
      </div>
    )}
  </div>
);

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const StatItem = ({ icon, label, value }: StatItemProps) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-purple-400">
        {icon}
     </div>
     <div className="flex-1">
        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-white">{value}</p>
     </div>
  </div>
);

export default ProfilePage;
