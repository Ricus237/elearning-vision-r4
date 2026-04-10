"use client";
import { useState, useRef, useEffect } from "react";
import {
  User, Mail, Phone, Lock, Moon, Sun, Monitor,
  Shield, FileText, ScrollText, Trash2, ChevronRight,
  Camera, CheckCircle2, Loader2, AlertTriangle, X, Eye, EyeOff,
  LogOut, Bell, Globe
} from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import Image from "next/image";
import { logoutAction } from "@/lib/actions";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";

interface Profile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
}

interface Policy {
  id: string;
  title: string;
  icon: React.ElementType;
  lastUpdated: string;
  content: string;
}

// ─── Policies content ─────────────────────────────────────────────────────────
const policies: Policy[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: Shield,
    lastUpdated: "January 1, 2025",
    content: `At IBI, we are committed to protecting your personal data and respecting your privacy.

**Data We Collect**
We collect information you provide directly to us, such as your name, email address, phone number, and application details. We also collect usage data to improve our platform.

**How We Use Your Data**
Your data is used exclusively to manage your enrollment, communicate important academic information, and improve our services. We never sell your personal data to third parties.

**Data Retention**
We retain your personal data for as long as your account is active or as required by law. Upon account deletion, personal data is removed within 30 days, except where legally required to retain it.

**Your Rights**
You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@ibi.edu to exercise these rights.

**Contact**
For privacy-related questions, contact our Data Protection Officer at dpo@ibi.edu.`,
  },
  {
    id: "terms",
    title: "Terms of Service",
    icon: FileText,
    lastUpdated: "January 1, 2025",
    content: `By accessing and using the IBI platform, you agree to these Terms of Service.

**Academic Integrity**
All submitted work must be your own. Plagiarism or academic dishonesty may result in immediate suspension or expulsion from the program without refund.

**Payment & Refunds**
Enrollment fees are non-refundable after the first 7 days of course commencement. Technical issues preventing course access may qualify for a partial refund at IBI's discretion.

**Platform Usage**
The platform and all content therein are the intellectual property of IBI. Downloading, reproducing, or distributing course materials without written permission is prohibited.

**Account Responsibility**
You are responsible for maintaining the confidentiality of your login credentials. IBI is not liable for any loss resulting from unauthorized account access.

**Termination**
IBI reserves the right to suspend or terminate accounts that violate these terms. Students may delete their accounts at any time through the Settings page.`,
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    icon: ScrollText,
    lastUpdated: "January 1, 2025",
    content: `IBI uses cookies and similar tracking technologies to enhance your experience.

**Essential Cookies**
These cookies are required for the platform to function correctly. They manage your session and authentication state. They cannot be disabled.

**Analytics Cookies**
We use anonymized analytics cookies to understand how users interact with our platform, enabling us to improve the user experience. No personally identifiable information is tracked.

**Preference Cookies**
These store your preferences such as theme selection and notification settings, so your experience is consistent across sessions.

**Managing Cookies**
You can control non-essential cookies through your browser settings. Note that disabling certain cookies may affect platform functionality.`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    name: "Admin IBI",
    email: "admin@ibi.edu",
    phone: "+1 (555) 000-0000",
    role: "Platform Administrator",
    avatar: "",
  });
  const [theme, setTheme] = useState<Theme>("system");
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [openPolicy, setOpenPolicy] = useState<Policy | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPwd: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    newStudents: true,
    examResults: true,
    systemAlerts: true,
    weeklyReport: false,
  });

  const fileRef = useRef<HTMLInputElement>(null);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSavePassword = async () => {
    if (passwords.newPwd !== passwords.confirm) {
      alert("New passwords do not match.");
      return;
    }
    if (passwords.newPwd.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setPwdSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setPwdSaving(false);
    setPwdSaved(true);
    setPasswords({ current: "", newPwd: "", confirm: "" });
    setTimeout(() => setPwdSaved(false), 3000);
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "policies", label: "Policies & Legal", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <header className="mb-10 animate-in slide-in-from-left duration-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1 rounded-full bg-purple-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Account Settings</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                Settings
              </h1>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left Nav */}
              <nav className="lg:w-64 shrink-0">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-3 lg:sticky lg:top-8">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 mb-1 ${
                          isActive
                            ? item.id === "danger"
                              ? "bg-red-600 text-white shadow-lg shadow-red-100"
                              : "bg-gray-900 text-white shadow-lg shadow-gray-100"
                            : item.id === "danger"
                            ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                            : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Right Panel */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* ── PROFILE ──────────────────────────────────────────── */}
                {activeSection === "profile" && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 mb-8">Profile Information</h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-6 mb-10">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-purple-200 overflow-hidden">
                          {profile.avatar ? (
                            <Image src={profile.avatar} alt="avatar" width={96} height={96} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            profile.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="absolute inset-0 rounded-[1.5rem] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Camera className="w-6 h-6" />
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900">{profile.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{profile.role}</p>
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="mt-2 text-[10px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: "name", label: "Full Name", icon: User, type: "text" },
                        { key: "role", label: "Role / Title", icon: Globe, type: "text" },
                        { key: "email", label: "Email Address", icon: Mail, type: "email" },
                        { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
                      ].map((field) => {
                        const Icon = field.icon;
                        return (
                          <div key={field.key} className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                            <div className="relative">
                              <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                              <input
                                type={field.type}
                                value={profile[field.key as keyof Profile]}
                                onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                                className="w-full pl-12 pr-6 h-14 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${saved ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-gray-900 text-white hover:bg-purple-600 shadow-gray-100"}`}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                        {saving ? "Saving..." : saved ? "Profile Saved!" : "Save Profile"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── PASSWORD ─────────────────────────────────────────── */}
                {activeSection === "password" && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 mb-2">Change Password</h2>
                    <p className="text-sm text-gray-400 mb-8">Minimum 8 characters. Use a mix of letters, numbers, and symbols.</p>

                    <div className="space-y-5 max-w-md">
                      {[
                        { key: "current", label: "Current Password", show: showCurrentPwd, toggle: () => setShowCurrentPwd(!showCurrentPwd) },
                        { key: "newPwd", label: "New Password", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) },
                        { key: "confirm", label: "Confirm New Password", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) },
                      ].map((f) => (
                        <div key={f.key} className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f.label}</label>
                          <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                              type={f.show ? "text" : "password"}
                              value={passwords[f.key as keyof typeof passwords]}
                              onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))}
                              className="w-full pl-12 pr-14 h-14 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all"
                            />
                            <button onClick={f.toggle} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                              {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        onClick={handleSavePassword}
                        disabled={pwdSaving}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${pwdSaved ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-gray-900 text-white hover:bg-purple-600 shadow-gray-100"}`}
                      >
                        {pwdSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : pwdSaved ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {pwdSaving ? "Updating..." : pwdSaved ? "Password Updated!" : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── APPEARANCE ───────────────────────────────────────── */}
                {activeSection === "appearance" && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 mb-2">Appearance</h2>
                    <p className="text-sm text-gray-400 mb-8">Choose how the dashboard looks on your device.</p>

                    <div className="grid grid-cols-3 gap-4">
                      {([
                        { id: "light", label: "Light", icon: Sun, preview: "bg-white border-gray-200", text: "text-gray-900" },
                        { id: "dark", label: "Dark", icon: Moon, preview: "bg-gray-900 border-gray-700", text: "text-white" },
                        { id: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-br from-white to-gray-900 border-gray-300", text: "text-gray-600" },
                      ] as const).map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`relative rounded-2xl border-2 p-6 flex flex-col items-center gap-4 transition-all ${isActive ? "border-purple-600 shadow-xl shadow-purple-100 -translate-y-1" : "border-gray-100 hover:border-gray-200"}`}
                          >
                            <div className={`w-full aspect-video rounded-xl border ${t.preview} flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 ${t.text}`} />
                            </div>
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{t.label}</span>
                            {isActive && (
                              <div className="absolute top-3 right-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── NOTIFICATIONS ────────────────────────────────────── */}
                {activeSection === "notifications" && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 mb-2">Notifications</h2>
                    <p className="text-sm text-gray-400 mb-8">Manage what alerts you receive from the platform.</p>

                    <div className="divide-y divide-gray-50">
                      {[
                        { key: "newStudents", label: "New Student Applications", desc: "Get notified when a new student applies." },
                        { key: "examResults", label: "Exam Results Ready", desc: "Alert when quiz results are ready for review." },
                        { key: "systemAlerts", label: "System Alerts", desc: "Critical platform notifications and errors." },
                        { key: "weeklyReport", label: "Weekly Summary Report", desc: "Receive a weekly dashboard digest every Monday." },
                      ].map((n) => (
                        <div key={n.key} className="flex items-center justify-between py-5 gap-4">
                          <div>
                            <p className="text-sm font-black text-gray-900">{n.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${notifications[n.key as keyof typeof notifications] ? "bg-purple-600" : "bg-gray-200"}`}
                          >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${notifications[n.key as keyof typeof notifications] ? "left-7" : "left-1"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── POLICIES ─────────────────────────────────────────── */}
                {activeSection === "policies" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {policies.map((policy) => {
                      const Icon = policy.icon;
                      return (
                        <button
                          key={policy.id}
                          onClick={() => setOpenPolicy(policy)}
                          className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm p-7 flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-700 shrink-0">
                            <Icon className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-black text-gray-900">{policy.title}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Last updated: {policy.lastUpdated}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>
                      );
                    })}

                    {/* Sign Out */}
                    <form action={logoutAction} className="mt-4">
                      <button
                        type="submit"
                        className="w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm p-7 flex items-center gap-5 hover:bg-red-50 hover:border-red-100 hover:shadow-md transition-all"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                          <LogOut className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-base font-black text-red-500">Sign Out</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">End your current session</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </button>
                    </form>
                  </div>
                )}

                {/* ── DANGER ZONE ──────────────────────────────────────── */}
                {activeSection === "danger" && (
                  <div className="animate-in fade-in duration-300 space-y-5">
                    <div className="bg-red-50 border-2 border-red-100 rounded-[2rem] p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h2 className="text-xl font-black text-red-600">Danger Zone</h2>
                      </div>
                      <p className="text-sm text-red-400 font-medium mb-8">
                        These actions are irreversible. Please proceed with extreme caution.
                      </p>

                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-6 flex items-center justify-between gap-6 border border-red-100">
                          <div>
                            <p className="font-black text-gray-900">Delete My Account Permanently</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                              All your personal data, preferences, and access rights will be permanently erased. This cannot be undone.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="shrink-0 px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Policy Modal ─────────────────────────────────────────────────────── */}
      {openPolicy && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpenPolicy(null)}>
          <div
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <openPolicy.icon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{openPolicy.title}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last updated: {openPolicy.lastUpdated}</p>
                </div>
              </div>
              <button onClick={() => setOpenPolicy(null)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-200 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="prose prose-sm prose-slate max-w-none">
                {openPolicy.content.split("\n\n").map((block, i) => {
                  if (block.startsWith("**") && block.endsWith("**")) {
                    return <h4 key={i} className="font-black text-gray-900 text-base mt-6 mb-2">{block.replace(/\*\*/g, "")}</h4>;
                  }
                  if (block.includes("**")) {
                    return (
                      <p key={i} className="text-gray-600 leading-relaxed mb-3">
                        {block.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                          part.startsWith("**") ? <strong key={j} className="text-gray-900">{part.replace(/\*\*/g, "")}</strong> : part
                        )}
                      </p>
                    );
                  }
                  return <p key={i} className="text-gray-600 leading-relaxed mb-3">{block}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-3">Delete Account?</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              This action is <strong className="text-gray-900">permanent and irreversible</strong>. All your data will be immediately deleted.
            </p>
            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Type <span className="text-red-600 font-black">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full px-6 h-14 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-red-100 transition-all"
                placeholder="Type DELETE here"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={deleteInput !== "DELETE"}
                onClick={() => alert("Account deletion request sent.")}
                className="flex-1 py-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-100"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
