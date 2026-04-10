"use client";
import { useState, useEffect, useCallback } from "react";
import { Save, ChevronDown, Home, Info,
  BookOpen, ClipboardList, RefreshCw,
  CheckCircle2, Loader2, DollarSign, Plus, Trash2
} from "lucide-react";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

// ─── Types mapped exactly to what data.ts / the plugin return ─────────────────
interface SiteData {
  // Moodle site info (heroData)
  sitename: string;
  summary: string;
  // Global fields
  hero_badge: string;
  mission_title: string;
  mission_content: string;
  vision_title: string;
  vision_content: string;
  // About page
  about_hero_title: string;
  founder_title: string;
  founder_content: string;
  founder_name: string;
  goal_title: string;
  goal_content: string;
  // Programs page
  programs_hero_title: string;
  programs_hero_desc: string;
  core_program_title: string;
  core_program_items: string; // newline-separated
  // Apply / Enrollment page
  apply_hero_title: string;
  apply_hero_desc: string;
  price_standard: string;
  quota_standard: string;
  price_premium: string;
  quota_premium: string;
  price_executive: string;
  security_note: string;
}

const DEFAULT: SiteData = {
  sitename: "International Bible Institute",
  summary: "Deepen your understanding of Scripture and grow as a global leader.",
  hero_badge: "Empowering Spiritual Leaders",
  mission_title: "Our Mission",
  mission_content: "To form mature believers who impact every sphere of society with biblical truth.",
  vision_title: "Our Vision",
  vision_content: "To cultivate believers who transform every sphere of society.",
  about_hero_title: "Our Identity & Vision",
  founder_title: "Welcome Letter from Founder",
  founder_content: "Welcome to the International Bible Institute.\n\nWe are committed to raising a generation of leaders rooted in the Word of God.",
  founder_name: "In Christ, Our Founder",
  goal_title: "Our Goal",
  goal_content: "Raising a generation of leaders equipped with biblical foundations and global vision.",
  programs_hero_title: "Academic Programs",
  programs_hero_desc: "Equipping the next generation of spiritual and global leaders.",
  core_program_title: "Kingdom Foundations",
  core_program_items: "40-minute pre-recorded lessons\nDaily journaling\nPractical assignments",
  apply_hero_title: "Apply to IBI",
  apply_hero_desc: "Complete your application form and choose your program.",
  price_standard: "299",
  quota_standard: "3",
  price_premium: "499",
  quota_premium: "6",
  price_executive: "999",
  security_note: "Your data is protected. Payment is processed securely.",
};

// ─── Field renderer ───────────────────────────────────────────────────────────
type FieldType = "text" | "textarea" | "number";
interface Field { key: keyof SiteData; label: string; type: FieldType; hint?: string }

interface Section {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  fields: Field[];
}

const sections: Section[] = [
  {
    id: "homepage",
    label: "Homepage",
    subtitle: "Hero, Mission & Vision",
    icon: Home,
    color: "purple",
    fields: [
      { key: "sitename", label: "Site Name (Logo Text)", type: "text", hint: "Shown in the navbar logo" },
      { key: "summary", label: "Hero Description", type: "textarea", hint: "Shown under the main title" },
      { key: "hero_badge", label: "Hero Badge Text", type: "text", hint: "Small badge above the title (e.g. \"Empowering Spiritual Leaders\")" },
      { key: "mission_title", label: "Mission — Title", type: "text" },
      { key: "mission_content", label: "Mission — Body Text", type: "textarea" },
      { key: "vision_title", label: "Vision — Title", type: "text" },
      { key: "vision_content", label: "Vision — Body Text", type: "textarea" },
    ],
  },
  {
    id: "about",
    label: "About Page",
    subtitle: "Founder letter & Goal section",
    icon: Info,
    color: "indigo",
    fields: [
      { key: "about_hero_title", label: "Page Hero Title", type: "text", hint: "Large title at the top of the About page" },
      { key: "founder_title", label: "Founder Letter — Title", type: "text" },
      { key: "founder_content", label: "Founder Letter — Body", type: "textarea", hint: "Use a new line to separate paragraphs" },
      { key: "founder_name", label: "Founder Sign-off Name", type: "text", hint: "Displayed as \"— [Name]\" in italic" },
      { key: "goal_title", label: "Our Goal — Title", type: "text" },
      { key: "goal_content", label: "Our Goal — Content", type: "textarea" },
    ],
  },
  {
    id: "programs",
    label: "Programs Page",
    subtitle: "Hero & Kingdom Foundations program",
    icon: BookOpen,
    color: "emerald",
    fields: [
      { key: "programs_hero_title", label: "Page Hero Title", type: "text" },
      { key: "programs_hero_desc", label: "Page Hero Description", type: "textarea" },
      { key: "core_program_title", label: "Core Program Name", type: "text", hint: "e.g. \"Kingdom Foundations\"" },
      { key: "core_program_items", label: "Lesson Format Items", type: "textarea", hint: "One item per line. Each line becomes a bullet point in the Lesson Format list." },
    ],
  },
  {
    id: "apply",
    label: "Apply / Enrollment Page",
    subtitle: "Hero text, pricing plans & security note",
    icon: ClipboardList,
    color: "orange",
    fields: [
      { key: "apply_hero_title", label: "Page Hero Title", type: "text" },
      { key: "apply_hero_desc", label: "Page Hero Description", type: "textarea" },
      { key: "security_note", label: "Security / Trust Note", type: "text", hint: "Shown at the bottom of the sidebar on the apply page" },
    ],
  },
  {
    id: "pricing",
    label: "Pricing Plans",
    subtitle: "Standard, Premium & Executive prices",
    icon: DollarSign,
    color: "rose",
    fields: [
      { key: "price_standard", label: "Standard Plan — Price ($)", type: "number" },
      { key: "quota_standard", label: "Standard Plan — Course Quota", type: "number" },
      { key: "price_premium", label: "Premium Plan — Price ($)", type: "number" },
      { key: "quota_premium", label: "Premium Plan — Course Quota", type: "number" },
      { key: "price_executive", label: "Executive Plan — Price ($)", type: "number", hint: "Executive plan always has unlimited courses" },
    ],
  },
];

const colorVariants: Record<string, { icon: string; ring: string; saved: string }> = {
  purple: { icon: "bg-purple-600 text-white", ring: "ring-purple-100", saved: "text-purple-600 bg-purple-50" },
  indigo: { icon: "bg-indigo-600 text-white", ring: "ring-indigo-100", saved: "text-indigo-600 bg-indigo-50" },
  emerald: { icon: "bg-emerald-500 text-white", ring: "ring-emerald-100", saved: "text-emerald-600 bg-emerald-50" },
  orange: { icon: "bg-orange-500 text-white", ring: "ring-orange-100", saved: "text-orange-600 bg-orange-50" },
  rose: { icon: "bg-rose-500 text-white", ring: "ring-rose-100", saved: "text-rose-600 bg-rose-50" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SiteContentPage() {
  const [data, setData] = useState<SiteData>(DEFAULT);
  const [original, setOriginal] = useState<SiteData>(DEFAULT);
  const [expanded, setExpanded] = useState<string | null>("homepage");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load current values from Moodle
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_get_all_site_data", params: {} }),
      });
      const json = await res.json();
      if (json && !json.error) {
        const merged: SiteData = { ...DEFAULT };
        Object.keys(DEFAULT).forEach((k) => {
          const key = k as keyof SiteData;
          if (json[key] !== undefined && json[key] !== null && json[key] !== "") {
            merged[key] = String(json[key]);
          }
        });
        setData(merged);
        setOriginal(merged);
      }
    } catch {
      console.warn("Could not load site data, using defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (key: keyof SiteData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaved((prev) => { const s = new Set(prev); s.delete(/* the section */sections.find(s => s.fields.some(f => f.key === key))?.id || ""); return s; });
  };

  const handleSave = async (sectionId: string) => {
    setSaving(sectionId);
    try {
      // Build flat params from all fields
      const params: Record<string, string> = {};
      (Object.keys(data) as Array<keyof SiteData>).forEach((k) => {
         params[k] = String(data[k]);
      });

      await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_save_site_data", params }),
      });

      setOriginal({ ...data });
      setSaved((prev) => new Set(prev).add(sectionId));
    } catch {
      alert("Failed to save. Check your Moodle connection.");
    } finally {
      setSaving(null);
    }
  };

  const handleReset = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const reset = { ...data };
    sec.fields.forEach((f) => { reset[f.key] = DEFAULT[f.key]; });
    setData(reset);
    setSaved((prev) => { const s = new Set(prev); s.delete(sectionId); return s; });
  };

  const isDirty = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return false;
    return sec.fields.some((f) => data[f.key] !== original[f.key]);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 min-h-screen">
        <div className="pt-24 md:pt-0 p-6 md:p-10 lg:p-12">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <header className="mb-12 animate-in slide-in-from-left duration-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-1 rounded-full bg-purple-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">CMS — Content Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
                Site <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Content</span>
              </h1>
              <p className="text-gray-400 font-medium max-w-xl">
                Edit every text that appears on your public website — mapped exactly to each page. Changes are pushed directly to Moodle.
              </p>
            </header>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Loading from Moodle...</p>
              </div>
            ) : (
              <div className="space-y-5 pb-24">
                {sections.map((section) => {
                  const isOpen = expanded === section.id;
                  const isSaved = saved.has(section.id);
                  const isSaving = saving === section.id;
                  const dirty = isDirty(section.id);
                  const cv = colorVariants[section.color];
                  const Icon = section.icon;

                  return (
                    <div
                      key={section.id}
                      className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${isOpen ? `ring-2 ${cv.ring} shadow-xl` : "hover:shadow-md hover:-translate-y-0.5"}`}
                    >
                      {/* Section Header */}
                      <div
                        className={`p-8 flex items-center justify-between cursor-pointer transition-colors ${isOpen ? "bg-gray-50/50" : ""}`}
                        onClick={() => setExpanded(isOpen ? null : section.id)}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${cv.icon}`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <div>
                            <h2 className="text-lg font-black text-gray-900">{section.label}</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{section.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {dirty && !isSaved && (
                            <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest">
                              Unsaved changes
                            </span>
                          )}
                          {isSaved && (
                            <span className={`text-[9px] font-black ${cv.saved} px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1`}>
                              <CheckCircle2 className="w-3 h-3" /> Saved
                            </span>
                          )}
                          <div className={`p-2 rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Fields */}
                      {isOpen && (
                        <div className="border-t border-gray-50 p-8 pt-6" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-6">
                            {section.fields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{field.label}</label>
                                  {field.hint && (
                                    <span className="text-[9px] text-gray-300 font-medium max-w-xs text-right">{field.hint}</span>
                                  )}
                                </div>

                                {/* Special: multi-line list for core_program_items */}
                                {field.key === "core_program_items" ? (
                                  <div className="space-y-3">
                                    {data.core_program_items.split("\n").map((item, idx) => (
                                      <div key={idx} className="flex gap-3 items-center group">
                                        <div className="w-2 h-2 rounded-full bg-purple-300 shrink-0" />
                                        <input
                                          type="text"
                                          value={item}
                                          onChange={(e) => {
                                            const items = data.core_program_items.split("\n");
                                            items[idx] = e.target.value;
                                            handleChange("core_program_items", items.join("\n"));
                                          }}
                                          className="flex-1 px-5 h-12 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all"
                                          placeholder={`Lesson item ${idx + 1}`}
                                        />
                                        {data.core_program_items.split("\n").length > 1 && (
                                          <button
                                            onClick={() => {
                                              const items = data.core_program_items.split("\n").filter((_, i) => i !== idx);
                                              handleChange("core_program_items", items.join("\n"));
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => handleChange("core_program_items", data.core_program_items + "\n")}
                                      className="flex items-center gap-2 text-[10px] font-black text-purple-500 hover:text-purple-700 uppercase tracking-widest mt-2 ml-5"
                                    >
                                      <Plus className="w-3 h-3" /> Add Item
                                    </button>
                                  </div>
                                ) : field.type === "textarea" ? (
                                  <textarea
                                    rows={field.key === "founder_content" ? 6 : 3}
                                    value={data[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all resize-none leading-relaxed"
                                  />
                                ) : (
                                  <input
                                    type={field.type}
                                    value={data[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full px-6 h-14 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all"
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Section Footer */}
                          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50">
                            <button
                              onClick={() => handleReset(section.id)}
                              className="flex items-center gap-2 text-[10px] font-black text-gray-300 hover:text-gray-600 uppercase tracking-widest transition-all"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Reset to Default
                            </button>
                            <button
                              onClick={() => handleSave(section.id)}
                              disabled={isSaving}
                              className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60 shadow-lg ${
                                isSaved
                                  ? "bg-emerald-500 text-white shadow-emerald-100"
                                  : "bg-gray-900 text-white hover:bg-purple-600 shadow-gray-100"
                              }`}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isSaved ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              {isSaving ? "Saving..." : isSaved ? "Saved to Moodle!" : "Save to Moodle"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
