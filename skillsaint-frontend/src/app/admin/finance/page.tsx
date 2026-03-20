"use client";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, ExternalLink, Calendar, Download } from "lucide-react";
import { mockEnrollments } from "@/data/students";
import { coursesData } from "@/components/courses/courseData";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

// Generate financial data from enrollments
const totalRevenue = mockEnrollments.length * 79;
const stripeFees = Math.round(totalRevenue * 0.029 + mockEnrollments.length * 0.30);
const netRevenue = totalRevenue - stripeFees;

const monthlyRevenue = [
  { month: "Jan", amount: 316, growth: 12 },
  { month: "Feb", amount: 474, growth: 50 },
  { month: "Mar", amount: 237, growth: -50 },
];

const recentTransactions = mockEnrollments.slice(0, 6).map((enrollment, idx) => {
  const course = coursesData.find(c => c._id === `course-${enrollment.courseId}`);
  return {
    id: `txn_${idx + 1}`,
    date: enrollment.enrolledAt,
    student: `Student ${enrollment.studentId.split("_")[1]}`,
    course: course?.title || "Course",
    amount: course?.discountPrice || 79,
    status: idx < 5 ? "succeeded" : "pending",
    stripeId: `pi_${Math.random().toString(36).substr(2, 14)}`,
  };
});

const courseRevenue = coursesData.map(course => {
  const courseId = parseInt(course._id.replace("course-", ""));
  const enrollments = mockEnrollments.filter(e => e.courseId === courseId);
  return {
    title: course.title,
    enrollments: enrollments.length,
    revenue: enrollments.length * (course.discountPrice || course.price),
  };
}).sort((a, b) => b.revenue - a.revenue);

const FinancePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 pt-24 md:pt-[100px]">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finances & Stripe</h1>
              <p className="text-secondary mt-1">Monitor revenue, transactions, and manage payouts.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#635bff] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#5851db] transition-colors shadow-sm text-sm"
              >
                <ExternalLink className="w-4 h-4" /> Stripe Dashboard
              </a>
            </div>
          </header>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</h3>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600 font-medium">
                <ArrowUpRight className="w-4 h-4" /> +12% from last month
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Net Revenue</p>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">${netRevenue.toLocaleString()}</h3>
              <div className="mt-2 text-sm text-gray-500">After Stripe fees</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Stripe Fees</p>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">${stripeFees.toLocaleString()}</h3>
              <div className="mt-2 text-sm text-gray-500">2.9% + $0.30/txn</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-500">Next Payout</p>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">2 days</h3>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Automatic
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Revenue by Course */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Revenue by Course</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {courseRevenue.map((course, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{course.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{course.enrollments} enrollments</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${totalRevenue > 0 ? (course.revenue / totalRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-16 text-right">${course.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Monthly Trend</h2>
              </div>
              <div className="p-6 space-y-4">
                {monthlyRevenue.map((month, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{month.month} 2024</p>
                      <p className="text-sm text-gray-500">${month.amount}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      month.growth >= 0 ? "text-green-600" : "text-red-500"
                    }`}>
                      {month.growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(month.growth)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
              <a
                href="https://dashboard.stripe.com/payments"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1"
              >
                View on Stripe <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-4 font-medium">Transaction ID</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Course</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-mono text-gray-500">{txn.stripeId.slice(0, 16)}...</span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 text-gray-900 text-sm font-medium">{txn.course}</td>
                      <td className="p-4 text-gray-900 font-bold">${txn.amount}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          txn.status === "succeeded" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stripe Integration Status */}
          <div className="mt-8 bg-gradient-to-r from-[#635bff] to-[#7a73ff] rounded-3xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Stripe Integration Active</h3>
                  <p className="text-white/80 text-sm mt-1">All payments are processed securely through Stripe. Automatic payouts every 2 business days.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                <span className="font-medium text-sm">Connected</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default FinancePage;
