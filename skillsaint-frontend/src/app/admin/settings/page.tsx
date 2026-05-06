"use client";
import { useState, useRef, useEffect } from "react";
import {
  User, Mail, Phone, Lock, Moon, Sun, Monitor,
  Shield, FileText, ScrollText, Trash2, ChevronRight,
  Camera, CheckCircle2, Loader2, AlertTriangle, X, Eye, EyeOff,
  LogOut, Globe, CreditCard
} from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import Image from "next/image";
import { logoutAction, updateAvatarAction, changePasswordAction } from "@/lib/actions";

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "system";

interface PaymentConfig {
  installmentsEnabled: boolean;
  minPayment: number;
}

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
    content: `At Global Bible Institute, we are committed to protecting your personal data and respecting your privacy.

**Data We Collect**
We collect information you provide directly to us, such as your name, email address, phone number, and application details. We also collect usage data to improve our platform.

**How We Use Your Data**
Your data is used exclusively to manage your enrollment, communicate important academic information, and improve our services. We never sell your personal data to third parties.

**Data Retention**
We retain your personal data for as long as your account is active or as required by law. Upon account deletion, personal data is removed within 30 days, except where legally required to retain it.

**Your Rights**
You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@gbi.edu to exercise these rights.

**Contact**
For privacy-related questions, contact our Data Protection Officer at dpo@Gbi.edu.`,
  },
  {
    id: "terms",
    title: "Terms of Service",
    icon: FileText,
    lastUpdated: "January 1, 2025",
    content: `By accessing and using the GBI platform, you agree to these Terms of Service.

**Academic Integrity**
All submitted work must be your own. Plagiarism or academic dishonesty may result in immediate suspension or expulsion from the program without refund.

**Payment & Refunds**
Enrollment fees are non-refundable after the first 7 days of course commencement. Technical issues preventing course access may qualify for a partial refund at GBI's discretion.

**Platform Usage**
The platform and all content therein are the intellectual property of GBI. Downloading, reproducing, or distributing course materials without written permission is prohibited.

**Account Responsibility**
You are responsible for maintaining the confidentiality of your login credentials. GBI is not liable for any loss resulting from unauthorized account access.

**Termination**
GBI reserves the right to suspend or terminate accounts that violate these terms. Students may delete their accounts at any time through the Settings page.`,
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    icon: ScrollText,
    lastUpdated: "January 1, 2025",
    content: `GBI uses cookies and similar tracking technologies to enhance your experience.

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
    name: "Admin GBI",
    email: "admin@gbi.edu",
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
  const [payConfig, setPayConfig] = useState<PaymentConfig>({
    installmentsEnabled: true,
    minPayment: 50,
  });
  const [paySaving, setPaySaving] = useState(false);
  const [paySaved, setPaySaved] = useState(false);
 

  const fileRef = useRef<HTMLInputElement>(null);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setProfile((p) => ({ ...p, avatar: base64 }));
      try {
        const result = await updateAvatarAction(base64);
        if (result?.error) {
          console.warn('Avatar not saved to Moodle:', result.error);
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
      }
    };
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
    try {
      const result = await changePasswordAction(passwords.current, passwords.newPwd);
      if (result.error) {
        alert(result.error);
      } else {
        setPwdSaved(true);
        setPasswords({ current: "", newPwd: "", confirm: "" });
        setTimeout(() => setPwdSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleSavePayments = async () => {
    setPaySaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPaySaving(false);
    setPaySaved(true);
    setTimeout(() => setPaySaved(false), 3000);
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "appearance", label: "Appearance", icon: Monitor },
    { id: "policies", label: "Policies & Legal", icon: Shield },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120] flex flex-col md:flex-row relative">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-12 bg-[#f0f2f5] dark:bg-[#0b1120]">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <header className="mb-10 animate-in slide-in-from-left duration-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1 rounded-full bg-purple-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Account Settings</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Settings
              </h1>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left Nav */}
              <nav className="lg:w-64 shrink-0">
                <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-3 lg:sticky lg:top-8">
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
                              ? "bg-red-600 text-white shadow-lg shadow-red-100 dark:shadow-none"
                              : "bg-gray-900 dark:bg-purple-600 text-white shadow-lg shadow-gray-100 dark:shadow-none"
                            : item.id === "danger"
                            ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600"
                            : "text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"
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
                  <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8">Profile Information</h2>

                    {/* Avatar */}
                    <div className="flex items-center gap-6 mb-10">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-purple-200 dark:shadow-none overflow-hidden">
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
                            <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{field.label}</label>
                            <div className="relative">
                              <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-slate-600" />
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
                  <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Change Password</h2>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">Minimum 8 characters. Use a mix of letters, numbers, and symbols.</p>

                    <div className="space-y-5 max-w-md">
                      {[
                        { key: "current", label: "Current Password", show: showCurrentPwd, toggle: () => setShowCurrentPwd(!showCurrentPwd) },
                        { key: "newPwd", label: "New Password", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) },
                        { key: "confirm", label: "Confirm New Password", show: showNewPwd, toggle: () => setShowNewPwd(!showNewPwd) },
                      ].map((f) => (
                        <div key={f.key} className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{f.label}</label>
                          <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-slate-600" />
                            <input
                              type={f.show ? "text" : "password"}
                              value={passwords[f.key as keyof typeof passwords]}
                              onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))}
                              className="w-full pl-12 pr-14 h-14 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20 transition-all"
                            />
                            <button onClick={f.toggle} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400">
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
                  <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Appearance</h2>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">Choose how the dashboard looks on your device.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            className={`relative rounded-2xl border-2 p-6 flex flex-col items-center gap-4 transition-all ${isActive ? "border-purple-600 shadow-xl shadow-purple-100 dark:shadow-none -translate-y-1" : "border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700"}`}
                          >
                            <div className={`w-full aspect-video rounded-xl border ${t.preview} flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 ${t.text}`} />
                            </div>
                            <span className="text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">{t.label}</span>
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

                
                {/* ── POLICIES ─────────────────────────────────────────── */}
                {activeSection === "policies" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {policies.map((policy) => {
                      const Icon = policy.icon;
                      return (
                        <button
                          key={policy.id}
                          onClick={() => setOpenPolicy(policy)}
                          className="w-full bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-7 flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-slate-300 shrink-0">
                            <Icon className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-black text-gray-900 dark:text-white">{policy.title}</p>
                            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">Last updated: {policy.lastUpdated}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                        </button>
                      );
                    })}

                    {/* Sign Out */}
                    <form action={logoutAction} className="mt-4">
                      <button
                        type="submit"
                        className="w-full bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-7 flex items-center gap-5 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-100 dark:hover:border-red-900/20 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 shrink-0">
                          <LogOut className="w-7 h-7" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-base font-black text-red-500">Sign Out</p>
                          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">End your current session</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600" />
                      </button>
                    </form>
                  </div>
                )}

                {/* ── PAYMENTS ────────────────────────────────────────── */}
                {activeSection === "payments" && (
                  <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm p-8 animate-in fade-in duration-300">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Payment Settings</h2>
                    <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">Configure flexible payments and student installment options.</p>

                    <div className="space-y-8">
                      {/* Toggle Installments */}
                      <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <div>
                          <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">Activer les paiements flexibles</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Permet aux étudiants de verser le montant de leur choix.</p>
                        </div>
                        <button 
                          onClick={() => setPayConfig(c => ({ ...c, installmentsEnabled: !c.installmentsEnabled }))}
                          className={`w-14 h-8 rounded-full transition-all relative ${payConfig.installmentsEnabled ? "bg-purple-600" : "bg-gray-200 dark:bg-slate-700"}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${payConfig.installmentsEnabled ? "left-7" : "left-1"}`} />
                        </button>
                      </div>

                      {/* Min Payment */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Montant Minimum de Versement ($)</label>
                        <div className="relative max-w-[200px]">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input 
                            type="number"
                            value={payConfig.minPayment}
                            onChange={(e) => setPayConfig(c => ({ ...c, minPayment: Number(e.target.value) }))}
                            className="w-full pl-10 pr-6 h-14 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/20"
                          />
                        </div>
                      </div>

                      {/* Summary Table Mockup */}
                      <div className="pt-8 border-t border-gray-50 dark:border-slate-800">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-6 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Soldes en attente (Top 3)
                        </h3>
                        <div className="space-y-3">
                          {[
                            { name: "Jean Dupont", plan: "Executive", balance: 749.00 },
                            { name: "Marie Curie", plan: "Premium", balance: 249.50 },
                            { name: "Paul Valéry", plan: "Standard", balance: 149.00 },
                          ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/30 rounded-xl">
                              <div>
                                <p className="text-xs font-black text-gray-800 dark:text-slate-200">{s.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">{s.plan} Plan</p>
                              </div>
                              <p className="text-sm font-black text-red-500">${s.balance.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-10">
                      <button
                        onClick={handleSavePayments}
                        disabled={paySaving}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${paySaved ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-gray-900 text-white hover:bg-purple-600 shadow-gray-100"}`}
                      >
                        {paySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : paySaved ? <CheckCircle2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        {paySaving ? "Saving..." : paySaved ? "Settings Saved!" : "Save Settings"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── DANGER ZONE ──────────────────────────────────────── */}
                {activeSection === "danger" && (
                  <div className="animate-in fade-in duration-300 space-y-5">
                    <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-[2rem] p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h2 className="text-xl font-black text-red-600">Danger Zone</h2>
                      </div>
                      <p className="text-sm text-red-400 font-medium mb-8">
                        These actions are irreversible. Please proceed with extreme caution.
                      </p>

                      <div className="space-y-4">
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 flex items-center justify-between gap-6 border border-red-100 dark:border-red-900/10">
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">Delete My Account Permanently</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm">
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
            className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <openPolicy.icon className="w-6 h-6 text-gray-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{openPolicy.title}</h3>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Last updated: {openPolicy.lastUpdated}</p>
                </div>
              </div>
              <button onClick={() => setOpenPolicy(null)} className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                {openPolicy.content.split("\n\n").map((block, i) => {
                  if (block.startsWith("**") && block.endsWith("**")) {
                    return <h4 key={i} className="font-black text-gray-900 dark:text-white text-base mt-6 mb-2">{block.replace(/\*\*/g, "")}</h4>;
                  }
                  if (block.includes("**")) {
                    return (
                      <p key={i} className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">
                        {block.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                          part.startsWith("**") ? <strong key={j} className="text-gray-900 dark:text-white">{part.replace(/\*\*/g, "")}</strong> : part
                        )}
                      </p>
                    );
                  }
                  return <p key={i} className="text-gray-600 dark:text-slate-400 leading-relaxed mb-3">{block}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300 border border-red-100 dark:border-red-900/20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-3">Delete Account?</h3>
            <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-6">
              This action is <strong className="text-gray-900 dark:text-white">permanent and irreversible</strong>. All your data will be immediately deleted.
            </p>
            <div className="space-y-3 mb-6">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                Type <span className="text-red-600 font-black">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full px-6 h-14 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20 transition-all"
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
