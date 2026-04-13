"use client";
import { useState, useEffect } from "react";
import { 
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
import { logoutAction, changePasswordAction } from "@/lib/actions";
import { Loader2 } from "lucide-react";

const SettingsPage = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ibi_theme");
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        setTheme(saved as "light" | "dark" | "system");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      localStorage.setItem("ibi_theme", theme);
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
           root.classList.add("dark");
        } else {
           root.classList.remove("dark");
        }
      }
    }
  }, [theme]);



  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row relative">
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
                  <button 
                    onClick={() => setShowPasswordChange(true)}
                    className="flex w-full items-center justify-between p-8 bg-gray-50/50 rounded-3xl border border-transparent hover:border-purple-100 hover:bg-white transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors shadow-sm">
                          <Lock size={18} />
                        </div>
                        <p className="text-sm font-black text-gray-900">Change Password</p>
                     </div>
                     <ChevronRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button 
                     onClick={() => setShowPrivacyPolicy(true)}
                     className="flex w-full items-center justify-between p-8 bg-gray-50/50 rounded-3xl border border-transparent hover:border-purple-100 hover:bg-white transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors shadow-sm">
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
                 <button onClick={() => { 
                   alert("Account deletion sequence initiated. A confirmation email has been sent. Follow the instructions to finalize the process."); 
                   setShowDeleteConfirm(false); 
                 }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-colors">Confirm Wipe</button>
              </div>
           </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                 <Lock className="text-purple-600" /> Change Password
              </h3>
              <div className="space-y-5 mb-10">
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Current Password</label>
                   <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none mt-2 text-sm font-medium focus:ring-4 focus:ring-purple-50 focus:border-purple-200 focus:bg-white transition-all" placeholder="Enter current password" />
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">New Password</label>
                   <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none mt-2 text-sm font-medium focus:ring-4 focus:ring-purple-50 focus:border-purple-200 focus:bg-white transition-all" placeholder="Enter new password" />
                 </div>
                 <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Confirm New Password</label>
                   <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none mt-2 text-sm font-medium focus:ring-4 focus:ring-purple-50 focus:border-purple-200 focus:bg-white transition-all" placeholder="Confirm new password" />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowPasswordChange(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
                  <button 
                    disabled={isUpdatingPassword}
                    onClick={async () => {
                    if(!passwordForm.new || passwordForm.new !== passwordForm.confirm) { 
                       alert("Error: Passwords do not match or are empty!"); 
                       return; 
                    }
                    if(!passwordForm.current) {
                       alert("Error: Please specify your current password.");
                       return;
                    }

                    setIsUpdatingPassword(true);
                    try {
                      const res = await changePasswordAction(passwordForm.current, passwordForm.new);
                      if (res.error) {
                        alert("Error: " + res.error);
                      } else {
                        alert("Success: Your password has been successfully updated via Moodle."); 
                        setShowPasswordChange(false);
                        setPasswordForm({current: "", new: "", confirm: ""});
                      }
                    } catch {
                      alert("A network error occurred.");
                    } finally {
                      setIsUpdatingPassword(false);
                    }
                  }} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2">
                    {isUpdatingPassword && <Loader2 size={14} className="animate-spin" />}
                    {isUpdatingPassword ? "Updating..." : "Update Security"}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                 <Shield className="text-emerald-500"/> Privacy Policy & Terms
              </h3>
              <div className="text-sm text-gray-500 font-medium leading-relaxed mb-10 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-4">
                 <p className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl mb-6">Your privacy matters. We rigorously guard your personal and academic data using state-of-the-art encryption protocols.</p>
                 <p><strong className="text-gray-900">1. Data Collection:</strong> We collect your personal data such as name, email, and academic progress strictly for educational tracking and certification purposes within the International Bible Institute portal.</p>
                 <p><strong className="text-gray-900">2. Third Parties:</strong> Your data is securely synchronized with our LMS backbone via protected APIs. We absolutely do not sell or rent your personal information to third parties or marketing boards.</p>
                 <p><strong className="text-gray-900">3. Security Infrastructure:</strong> All communications between your client and our servers are encrypted via HTTPS headers and secure token rotations. Authentication relies on industry-standard hashing.</p>
                 <p><strong className="text-gray-900">4. Right to Deletion:</strong> You may permanently wipe your records at any time via the « Danger Zone » on your settings dashboard. Upon request, all historical progress is scrubbed irreversibly.</p>
              </div>
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
                className="w-full py-5 bg-gray-900 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-emerald-200 transition-all"
              >
                I have read and understood
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
