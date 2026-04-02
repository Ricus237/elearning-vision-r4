import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { fetchMoodle } from "@/lib/moodle";
import { DollarSign, TrendingUp, Users, CheckCircle, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";

/**
 * Finance page – 100% dynamic, pulls all paid applications from Moodle.
 * No Math.random(), no static mock data → hydration error fixed.
 */
const FinancePage = async () => {
  let apps: any[] = [];

  try {
    const data = await fetchMoodle("local_skillsaint_get_all_paid_applications");
    if (Array.isArray(data)) apps = data;
  } catch {}

  const totalPaid = apps.length;
  const totalActivated = apps.filter(a => a.is_activated).length;

  // Group by plan
  const byPlan: Record<string, number> = {};
  apps.forEach(a => {
    const plan = a.selected_plan || "unknown";
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  });

  // New this month
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1); firstOfMonth.setHours(0, 0, 0, 0);
  const newThisMonth = apps.filter(a => a.timecreated * 1000 >= firstOfMonth.getTime()).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
              <p className="text-gray-500 mt-1">Live enrollment data from Moodle. Payment processing via Stripe.</p>
            </div>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#635bff] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#5851db] transition-colors shadow-sm text-sm"
            >
              <ExternalLink className="w-4 h-4" /> Stripe Dashboard
            </a>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Enrollments" value={totalPaid} icon={<Users className="w-5 h-5" />} iconBg="bg-blue-50 text-blue-600" sub={`+${newThisMonth} this month`} subColor="text-green-600" />
            <StatCard label="Accounts Activated" value={totalActivated} icon={<ShieldCheck className="w-5 h-5" />} iconBg="bg-green-50 text-green-600" sub={`${totalPaid - totalActivated} still locked`} subColor="text-orange-500" />
            <StatCard label="Pending Activation" value={totalPaid - totalActivated} icon={<ShieldAlert className="w-5 h-5" />} iconBg="bg-orange-50 text-orange-600" sub="Need activation code" subColor="text-gray-400" />
            <StatCard label="This Month" value={newThisMonth} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-purple-50 text-purple-600" sub="New paid enrollments" subColor="text-gray-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* By Plan */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Enrollments by Plan</h2>
              </div>
              <div className="p-5 space-y-3">
                {Object.keys(byPlan).length === 0 ? (
                  <p className="text-sm text-gray-400">No data yet.</p>
                ) : (
                  Object.entries(byPlan).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        plan === "executive" ? "bg-purple-100 text-purple-700" :
                        plan === "premium" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>{plan}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${totalPaid > 0 ? (count / totalPaid) * 100 : 0}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Recent Paid Enrollments</h2>
              </div>
              {apps.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No paid enrollments yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                        <th className="p-4 font-medium">Student</th>
                        <th className="p-4 font-medium">Plan</th>
                        <th className="p-4 font-medium">Activated</th>
                        <th className="p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {apps.slice(0, 10).map(app => (
                        <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-medium text-gray-900 text-sm">{app.fullname || "—"}</p>
                            <p className="text-xs text-gray-400">{app.email}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              app.selected_plan === "executive" ? "bg-purple-100 text-purple-700" :
                              app.selected_plan === "premium" ? "bg-blue-100 text-blue-700" :
                              "bg-green-100 text-green-700"
                            }`}>{app.selected_plan || "—"}</span>
                          </td>
                          <td className="p-4">
                            {app.is_activated ? (
                              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" />Yes</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-medium"><ShieldAlert className="w-3.5 h-3.5" />Pending</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-400 text-xs">
                            {new Date(app.timecreated * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Stripe CTA */}
          <div className="bg-gradient-to-r from-[#635bff] to-[#7a73ff] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Stripe Integration Active</h3>
              <p className="text-white/80 text-sm">All payments are processed securely through Stripe. Enrollment data is stored in Moodle.</p>
            </div>
            <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer"
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm backdrop-blur-sm border border-white/20 inline-flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> View Payments
            </a>
          </div>

        </div>
      </main>
    </div>
  );
};

function StatCard({ label, value, icon, iconBg, sub, subColor }: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; sub: string; subColor: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <h3 className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</h3>
      <p className={`text-xs font-medium mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

export default FinancePage;
