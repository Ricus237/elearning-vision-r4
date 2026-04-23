"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Mail, MapPin, Calendar, BookOpen, Award, CheckCircle, Save, Edit3, User, Flame } from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import Image from "next/image";
import { getProfileDataAction, updateProfileDataAction, updateAvatarAction } from "@/lib/actions";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "",
    address: "",
    bio: "",
    // Demographics
    gender: "",
    dob: "",
    marital_status: "",
    country: "",
    // Spiritual
    relationship: "",
    believer_duration: "",
    baptism_water: false,
    baptism_spirit: false,
    baptism_date: "",
    ministry: "",
    church: "",
    church_role: "",
    pastor_name: "",
    growth_areas: [] as string[],
    aspirations: "",
    leadership: "",
    motivation: ""
  });
  
  const [stats, setStats] = useState({
    enrolledCoursesCount: 0,
    examsPassed: 0,
    firstaccess: Date.now() / 1000
  });

  const [isSaving, setIsSaving] = useState(false);
  const [userProfileUrl, setUserProfileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setUserProfileUrl(base64);
        try {
          const result = await updateAvatarAction(base64);
          if (result?.error) {
            console.warn('Avatar not saved to database:', result.error);
          }
        } catch (err) {
          console.error('Avatar upload error:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProfileDataAction();
        if (data) {
          interface SpiritualBg {
            gender?: string;
            dob?: string;
            marital_status?: string;
            country?: string;
            relationship?: string;
            believer_duration?: string;
            baptisms?: string[];
            baptism_date?: string;
            ministry?: string;
            church?: string;
            church_role?: string;
            pastor_name?: string;
            growth_areas?: string[];
            aspirations?: string;
            leadership?: string;
          }
          let sBg: SpiritualBg = {};
          try {
            if (data.spiritual_bg) sBg = JSON.parse(data.spiritual_bg);
          } catch(e) { console.warn("Failed to parse spiritual_bg", e); }

          setFormData({
             name: data.fullname || data.username,
             email: data.email,
             phone: data.phone || "",
             address: data.address || "",
             bio: data.bio || "",
             gender: sBg.gender || "",
             dob: sBg.dob || "",
             marital_status: sBg.marital_status || "",
             country: sBg.country || "",
             relationship: sBg.relationship || "",
             believer_duration: sBg.believer_duration || "",
             baptism_water: sBg.baptisms?.includes('water') || false,
             baptism_spirit: sBg.baptisms?.includes('spirit') || false,
             baptism_date: sBg.baptism_date || "",
             ministry: sBg.ministry || "",
             church: sBg.church || "",
             church_role: sBg.church_role || "",
             pastor_name: sBg.pastor_name || "",
             growth_areas: sBg.growth_areas || [],
             aspirations: sBg.aspirations || "",
             leadership: sBg.leadership || "",
             motivation: data.motivation || ""
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
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const spiritual_bg = JSON.stringify({
         gender: formData.gender,
         dob: formData.dob,
         marital_status: formData.marital_status,
         country: formData.country,
         relationship: formData.relationship,
         believer_duration: formData.believer_duration,
         baptisms: [
            formData.baptism_water ? 'water' : null,
            formData.baptism_spirit ? 'spirit' : null
         ].filter(Boolean),
         baptism_date: formData.baptism_date,
         ministry: formData.ministry,
         church: formData.church,
         church_role: formData.church_role,
         pastor_name: formData.pastor_name,
         growth_areas: formData.growth_areas,
         aspirations: formData.aspirations,
         leadership: formData.leadership
      });

      const result = await updateProfileDataAction({
        name: formData.name,
        email: formData.email,
        address: formData.address,
        bio: formData.bio,
        phone: formData.phone,
        motivation: formData.motivation,
        spiritual_bg: spiritual_bg
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] flex flex-col md:flex-row relative">
      <StudentSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">

            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in duration-700">
               <div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Profile</span>
                  </h1>
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] px-1 italic">Identity & Spiritual Journey</p>
               </div>
               <div className="flex items-center gap-4">
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:border-purple-600 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm"
                    >
                       <Edit3 size={16} className="group-hover:rotate-12 transition-transform" />
                       Modify Profile
                    </button>
                  ) : (
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-purple-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-purple-600 dark:hover:bg-purple-500 transition-all shadow-xl disabled:opacity-50"
                    >
                       {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                       {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  )}
               </div>
            </header>

            {/* Main Content Info */}
            <div className="bg-white dark:bg-[#1e293b] rounded-[3rem] p-8 md:p-12 border border-blue-50/50 dark:border-slate-700 shadow-2xl shadow-blue-100/20 dark:shadow-none relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/40 to-indigo-100/40 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full blur-3xl -mr-32 -mt-32" />
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-2xl -ml-24 -mb-24" />
               
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="relative isolate">
                    <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-indigo-600 p-1 shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
                       <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-white relative group">
                          {userProfileUrl ? (
                             <Image width={160} height={160} src={userProfileUrl} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" unoptimized />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                <User size={64} />
                             </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                             <Camera size={24} />
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-white border border-gray-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-xl hover:bg-purple-600 hover:text-white transition-all cursor-pointer transform hover:rotate-6 z-20"
                    >
                       <Camera size={20} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="flex-1 pt-2">
                     <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{formData.name}</h2>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-full">
                           <CheckCircle size={14} />
                        </div>
                     </div>
                     <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                           <Mail size={12} className="text-purple-500 dark:text-purple-400" />
                           {formData.email}
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar size={12} className="text-purple-500 dark:text-purple-400" />
                           Enrolled {new Date(stats.firstaccess * 1000).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
               
               {/* Information Forms */}
               <div className="lg:col-span-2 space-y-8 animate-in fade-in duration-1000 delay-300">
                  
                  {/* Personal Section */}
                  <section className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm p-10 space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 dark:border-slate-800 pb-6">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center text-gray-900 dark:text-white">
                          <User size={18} />
                       </div>
                       <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Account Information</h3>
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
                          label="Phone Number" 
                          name="phone" 
                          value={formData.phone} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                          className="md:col-span-1"
                       />
                       <Field 
                          label="Mailing Address" 
                          name="address" 
                          value={formData.address} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                          className="md:col-span-1"
                       />
                    </div>
                  </section>

                  {/* Demographics Section */}
                  <section className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm p-10 space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 dark:border-slate-800 pb-6">
                       <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <MapPin size={18} />
                       </div>
                       <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Demographics</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <Field 
                          label="Gender" 
                          name="gender" 
                          value={formData.gender} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                       />
                       <Field 
                          label="Date of Birth" 
                          name="dob" 
                          value={formData.dob} 
                          type="date"
                          isEditing={isEditing} 
                          onChange={handleChange} 
                       />
                       <Field 
                          label="Marital Status" 
                          name="marital_status" 
                          value={formData.marital_status} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                       />
                       <Field 
                          label="Country of Residence" 
                          name="country" 
                          value={formData.country} 
                          isEditing={isEditing} 
                          onChange={handleChange} 
                       />
                    </div>
                  </section>

                  {/* Spiritual Journey Section */}
                  <section className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm p-10 space-y-10">
                    <div className="flex items-center gap-4 border-b border-gray-50 dark:border-slate-800 pb-6">
                       <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Flame size={18} />
                       </div>
                       <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Spiritual Journey</h3>
                    </div>

                    <div className="space-y-10">
                       <div className="grid grid-cols-1 gap-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Walk with God / Relationship</label>
                            {isEditing ? (
                               <textarea
                                  name="relationship"
                                  value={formData.relationship}
                                  onChange={handleChange}
                                  rows={4}
                                  className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-purple-50 dark:focus:ring-purple-900/20 focus:bg-white dark:focus:bg-slate-700 outline-none resize-none transition-all outline-none dark:text-slate-200"
                                  placeholder="Describe your current daily walk..."
                               />
                            ) : (
                               <div className="p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2rem] border-2 border-dashed border-amber-100/50 dark:border-amber-900/30">
                                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed italic opacity-80">{formData.relationship || "Not shared yet."}</p>
                               </div>
                            )}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Field 
                            label="Time as a Believer" 
                            name="believer_duration" 
                            value={formData.believer_duration} 
                            isEditing={isEditing} 
                            onChange={handleChange} 
                          />
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Baptism History</label>
                            <div className="flex gap-4">
                               <label className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.baptism_water ? 'bg-purple-600 text-white border-purple-600 shadow-lg scale-[1.02]' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>
                                  {isEditing && <input type="checkbox" name="baptism_water" checked={formData.baptism_water} onChange={handleChange} className="hidden" />}
                                  <span className="font-black text-xs uppercase tracking-widest leading-none">Water</span>
                               </label>
                               <label className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.baptism_spirit ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500'}`}>
                                  {isEditing && <input type="checkbox" name="baptism_spirit" checked={formData.baptism_spirit} onChange={handleChange} className="hidden" />}
                                  <span className="font-black text-xs uppercase tracking-widest leading-none">Holy Spirit</span>
                               </label>
                            </div>
                          </div>
                          <Field 
                            label="Baptism Date" 
                            name="baptism_date" 
                            type="date"
                            value={formData.baptism_date} 
                            isEditing={isEditing} 
                            onChange={handleChange} 
                          />
                          <Field 
                            label="Local Church" 
                            name="church" 
                            value={formData.church} 
                            isEditing={isEditing} 
                            onChange={handleChange} 
                          />
                          <Field 
                            label="Church Role / Ministry" 
                            name="church_role" 
                            value={formData.church_role} 
                            isEditing={isEditing} 
                            onChange={handleChange} 
                          />
                       </div>

                       <div className="grid grid-cols-1 gap-8 pt-4">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Personal Bio / Philosophy</label>
                            {isEditing ? (
                               <textarea
                                  name="bio"
                                  value={formData.bio}
                                  onChange={handleChange}
                                  rows={4}
                                  className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-purple-50 dark:focus:ring-purple-900/20 focus:bg-white dark:focus:bg-slate-700 outline-none resize-none transition-all outline-none dark:text-slate-200"
                               />
                            ) : (
                               <div className="p-8 bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] border-2 border-dashed border-purple-100 dark:border-purple-900/30">
                                  <p className="text-sm font-medium text-purple-900 dark:text-purple-200 leading-relaxed italic opacity-80 decoration-purple-200 dark:decoration-purple-900">&quot;{formData.bio}&quot;</p>
                               </div>
                            )}
                          </div>
                       </div>
                    </div>
                  </section>
               </div>

               {/* Stats Sidebar */}
               <div className="space-y-6 animate-in fade-in duration-1000 delay-500">
                  <div className="bg-gray-900 dark:bg-slate-900/50 rounded-[2.5rem] border border-gray-900 dark:border-white/10 p-8 text-white shadow-2xl shadow-gray-200 dark:shadow-none overflow-hidden relative">
                     <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                           <Award size={28} className="text-purple-400" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 dark:text-purple-400 mb-8">Academic Standing</h4>
                        
                        <div className="grid grid-cols-1 w-full gap-6">
                           <StatItem icon={<BookOpen size={16} />} label="Enrolled Units" value={stats.enrolledCoursesCount} />
                           <StatItem icon={<MapPin size={16} />} label="Location" value={formData.address === "Not specified" ? "Remote Student" : formData.address} />
                           <StatItem icon={<Award size={16} />} label="Assessments" value={`${stats.examsPassed} Passed`} />
                        </div>
                     </div>
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[60px]" />
                  </div>
               </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

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
    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">{label}</label>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-purple-50 dark:focus:ring-purple-900/20 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all dark:text-white ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
    ) : (
      <div className="px-6 py-4 bg-white dark:bg-slate-800/50 border border-gray-50 dark:border-slate-700 rounded-2xl text-sm font-black text-gray-900 dark:text-white shadow-sm flex items-center justify-between min-h-[52px]">
         {value || <span className="text-gray-300 dark:text-slate-600 italic font-medium">Empty</span>}
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
