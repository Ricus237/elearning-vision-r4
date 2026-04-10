"use client";
import { useState } from "react";
import { 
  Bell, 
  Lock, 
  Shield, 
  Trash2, 
  ChevronRight, 
  Monitor, 
  Moon, 
  Sun,
  FileText,
  AlertTriangle,
  LogOut,
  CheckCircle
} from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { logoutAction } from "@/lib/actions";

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    examReminders: true,
    newCourses: false,
    systemAlerts: true,
  });
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${enabled ? "bg-purple-600 shadow-lg shadow-purple-100" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-sm ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      <StudentSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <header className="mb-12 animate-in slide-in-from-left duration-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1 rounded-full bg-purple-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Preferences</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                Settings
              </h1>
              <p className="text-gray-400 font-medium max-w-xl text-sm leading-relaxed">
                Customize your academic experience, manage alerts, and control your privacy.
              </p>
            </header>

            <div className="space-y-6 pb-20">
              
              {/* Notifications Card */}
              <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 md:p-10 animate-in fade-in duration-1000 slide-in-from-bottom-5">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Notifications</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Alerts & Updates</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {[
                    { key: "courseUpdates", label: "Module Updates", desc: "Alerts when new lesson content or materials are added." },
                    { key: "examReminders", label: "Exam Eligibility", desc: "Notification when you unlock a quarterly assessment." },
                    { key: "newCourses", label: "Academic News", desc: "Stay updated with general IBI announcements." },
                    { key: "systemAlerts", label: "System Alerts", desc: "Technical platform updates and maintenance info." },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-6 gap-6">
                      <div className="max-w-sm">
                        <p className="text-sm font-black text-gray-900">{n.label}</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.desc}</p>
                      </div>
                      <Toggle 
                        enabled={notifications[n.key as keyof typeof notifications]} 
                        onChange={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))} 
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Appearance Card */}
              <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 md:p-10 animate-in fade-in duration-1000 delay-200 slide-in-from-bottom-5">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Appearance</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Interface theme</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: "light", label: "Light", icon: Sun, bg: "bg-white border-gray-100", text: "text-gray-900" },
                    { id: "dark", label: "Dark", icon: Moon, bg: "bg-gray-900 border-gray-800", text: "text-white" },
                    { id: "system", label: "System", icon: Monitor, bg: "bg-gradient-to-br from-white to-gray-50 border-gray-100", text: "text-purple-600" },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as "light" | "dark" | "system")}
                        className={`relative p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden flex flex-col items-center gap-4 ${isActive ? "border-purple-600 shadow-xl shadow-purple-50 -translate-y-1" : "border-gray-50 hover:border-gray-100"}`}
                      >
                         <div className={`w-full aspect-video rounded-xl ${t.bg} border flex items-center justify-center mb-2`}>
                            <Icon size={24} className={t.text} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t.label}</span>
                         {isActive && (
                           <div className="absolute top-4 right-4 text-purple-600">
                             <CheckCircle size={16} />
                           </div>
                         )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Security Card */}
              <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 md:p-10 animate-in fade-in duration-1000 delay-300 slide-in-from-bottom-5">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Security</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Privacy & Access</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button className="flex items-center justify-between p-8 bg-gray-50/50 rounded-3xl border border-transparent hover:border-purple-100 hover:bg-white transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                          <Lock size={18} />
                        </div>
                        <p className="text-sm font-black text-gray-900">Password</p>
                     </div>
                     <ChevronRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button className="flex items-center justify-between p-8 bg-gray-50/50 rounded-3xl border border-transparent hover:border-purple-100 hover:bg-white transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                          <FileText size={18} />
                        </div>
                        <p className="text-sm font-black text-gray-900">Privacy Policy</p>
                     </div>
                     <ChevronRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="bg-red-50/50 rounded-[2.5rem] border border-red-100 p-8 md:p-10 animate-in fade-in duration-1000 delay-400">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-red-100 text-red-500 flex items-center justify-center">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-600">Danger Zone</h2>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-0.5">Irreversible actions</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-[2rem] p-8 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="max-w-md">
                      <p className="text-sm font-black text-gray-900 mb-2 leading-relaxed">Delete Student Account Permanently</p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        By proceeding, your academic records, certificates, and enrollment access will be erased. This cannot be undone.
                      </p>
                   </div>
                   <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="shrink-0 px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
                   >
                     Clear My Data
                   </button>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Sign Out Floating Button (Mobile only or extra) */}
      <form action={logoutAction} className="fixed bottom-6 right-6 z-40 md:hidden">
        <button type="submit" className="w-14 h-14 bg-red-600 text-white rounded-2xl shadow-2xl flex items-center justify-center">
           <LogOut size={24} />
        </button>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Are you sure?</h3>
              <p className="text-gray-400 font-medium leading-relaxed mb-10">
                You will lose access to all your courses and academic progress. This action is definitive.
              </p>
              <div className="flex gap-4">
                 <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Abort</button>
                 <button className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100">Confirm</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
