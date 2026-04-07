"use client";
import { useState } from "react";
import { Bell, Globe, Lock, Shield, Trash2 } from "lucide-react";
import StudentSidebar from "@/components/dashboard/StudentSidebar";

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    examReminders: true,
    newCourses: false,
    promotions: false,
  });
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-purple-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10 pb-20 md:pb-20 lg:pb-20">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-secondary mt-1">Manage your account preferences.</p>
          </header>

          <div className="space-y-8">
            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Course Updates</p>
                    <p className="text-sm text-gray-500">Get notified when courses you&apos;re enrolled in are updated</p>
                  </div>
                  <Toggle enabled={notifications.courseUpdates} onChange={() => setNotifications(n => ({ ...n, courseUpdates: !n.courseUpdates }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Exam Reminders</p>
                    <p className="text-sm text-gray-500">Receive reminders when you&apos;re eligible to take exams</p>
                  </div>
                  <Toggle enabled={notifications.examReminders} onChange={() => setNotifications(n => ({ ...n, examReminders: !n.examReminders }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">New Courses</p>
                    <p className="text-sm text-gray-500">Be informed when new courses are published</p>
                  </div>
                  <Toggle enabled={notifications.newCourses} onChange={() => setNotifications(n => ({ ...n, newCourses: !n.newCourses }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Promotions</p>
                    <p className="text-sm text-gray-500">Receive offers and discount notifications</p>
                  </div>
                  <Toggle enabled={notifications.promotions} onChange={() => setNotifications(n => ({ ...n, promotions: !n.promotions }))} />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-500">Select your preferred language</p>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                  </div>
                  <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Security</h3>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition-colors">
                Delete Account
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
