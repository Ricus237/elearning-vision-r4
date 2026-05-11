/* eslint-disable */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StudentSidebar from "@/components/dashboard/StudentSidebar";
import { 
  CreditCard, 
  History, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  Zap,
  X as CloseIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserBilling, requestPlanUpgrade, getMyUpgradeStatus } from "@/lib/moodle";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  method: string;
  status: string;
}

interface BillingData {
  plan_name: string;
  total_price: number;
  amount_paid: number;
  remaining_balance: number;
  transactions: Transaction[];
}

interface UpgradeStatus {
  has_request: number;
  request_id: number;
  current_plan: string;
  target_plan: string;
  price_difference: number;
  status: string;
  admin_note: string;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [siteData, setSiteData] = useState<any>(null);
  const [upgradeStatus, setUpgradeStatus] = useState<UpgradeStatus | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      // In a real scenario, we get the userId from cookies
      const userId = typeof document !== "undefined" 
        ? parseInt(document.cookie.split("; ").find(row => row.startsWith("moodle_user_id="))?.split("=")[1] || "0")
        : 0;

      if (userId) {
        const data = await getUserBilling(userId);
        if (data && !data.error) {
          setBilling(data);
          setPayAmount(data.remaining_balance);
        } else {
          setBilling(null);
          setPayAmount(0);
        }
      }
      setLoading(false);
    }
    fetchData();

    // Fetch global site data for prices/quotas
    const loadSiteData = async () => {
      const res = await fetch("/api/moodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ function: "local_skillsaint_get_all_site_data", params: {} }),
      });
      const json = await res.json();
      if (json && !json.error) {
        setSiteData(json);
      }
    };
    loadSiteData();

    // Fetch upgrade status
    const loadUpgradeStatus = async () => {
      const uid = typeof document !== "undefined" 
        ? parseInt(document.cookie.split("; ").find(row => row.startsWith("moodle_user_id="))?.split("=")[1] || "0")
        : 0;
      if (uid) {
        const status = await getMyUpgradeStatus(uid);
        if (status && !status.error) setUpgradeStatus(status);
      }
    };
    loadUpgradeStatus();
  }, []);

  const getUserId = () => {
    return typeof document !== "undefined"
      ? parseInt(document.cookie.split("; ").find(row => row.startsWith("moodle_user_id="))?.split("=")[1] || "0")
      : 0;
  };

  const handleUpgradeRequest = async (targetPlan: string) => {
    const userId = getUserId();
    if (!userId) return;
    setUpgradeLoading(true);
    setUpgradeMsg("");
    const result = await requestPlanUpgrade(userId, targetPlan);
    if (result?.status === "success") {
      setUpgradeMsg("✓ Upgrade request submitted! Awaiting admin approval.");
      const status = await getMyUpgradeStatus(userId);
      if (status && !status.error) setUpgradeStatus(status);
    } else {
      setUpgradeMsg(result?.message || "An error occurred.");
    }
    setUpgradeLoading(false);
  };

  const handlePayBalance = async () => {
    if (payAmount <= 0) return;
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isApplication: true,
          plan: billing?.plan_name.toLowerCase(),
          amount: payAmount,
          currency: "USD",
          userId: document.cookie.split("; ").find(row => row.startsWith("moodle_user_id="))?.split("=")[1],
          email: document.cookie.split("; ").find(row => row.startsWith("user_email="))?.split("=")[1],
          courseTitle: `Solde - ${billing?.plan_name}`,
          paymentType: "billing"
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Erreur lors de la création de la session de paiement.");
      }
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  const progress = billing ? (billing.amount_paid / billing.total_price) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row relative">
      <StudentSidebar />

      <main className="flex-1 min-h-screen p-6 md:p-10 lg:p-14">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header */}
          <header className="animate-in slide-in-from-left duration-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-1 rounded-full bg-purple-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">Finances</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">
              Payments & <span className="text-purple-600">Billing.</span>
            </h1>
            <p className="text-gray-400 font-medium max-w-lg">
              Manage your installments, view your history and complete your balance for your academic program.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Balance Overview */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Progress Card */}
              <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-purple-50 opacity-50">
                  <TrendingUp size={120} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Program</p>
                      <h2 className="text-2xl font-black text-gray-900 uppercase">{billing?.plan_name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan Total</p>
                      <p className="text-2xl font-black text-gray-900">${billing?.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                      <span className="text-emerald-600">Paid: ${billing?.amount_paid.toFixed(2)}</span>
                      <span className="text-gray-300">{Math.round(progress)}%</span>
                      <span className="text-purple-600">Remaining: ${billing?.remaining_balance.toFixed(2)}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 via-purple-600 to-indigo-600"
                      />
                    </div>
                  </div>

                  {billing && billing.remaining_balance > 0 ? (
                    <div className="p-8 bg-purple-50 rounded-[2rem] border-2 border-purple-100 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                          <CreditCard size={24} />
                        </div>
                        <div>
                          <h3 className="font-black text-purple-900 uppercase tracking-widest text-sm">Complete my payment</h3>
                          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter">Enter the amount you wish to pay now</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-purple-300">$</span>
                          <input 
                            type="number"
                            value={payAmount || ""}
                            onChange={(e) => setPayAmount(Math.min(billing.remaining_balance, Math.max(0, Number(e.target.value))))}
                            className="w-full h-16 pl-12 pr-6 bg-white border-2 border-transparent rounded-2xl text-xl font-black text-purple-900 focus:border-purple-300 outline-none transition-all"
                            placeholder="0.00"
                          />
                        </div>
                        <button 
                          onClick={handlePayBalance}
                          disabled={isProcessing || payAmount <= 0}
                          className="px-10 h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-purple-600 shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={16} />}
                          {isProcessing ? "Processing..." : "Pay Now"}
                        </button>
                      </div>
                      {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
                    </div>
                  ) : (
                    <div className="p-8 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                        <ShieldCheck size={32} />
                      </div>
                      <div>
                        <h3 className="font-black text-emerald-900 uppercase tracking-widest text-sm">Payment Completed</h3>
                        <p className="text-xs text-emerald-600 font-medium">Your training is fully paid. Thank you for your trust!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <History className="text-gray-400" size={24} />
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Transaction History</h2>
                </div>

                <div className="space-y-4">
                  {billing?.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate" title={txn.id}>
                            {txn.id}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{txn.date} • {txn.method}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-lg font-black text-gray-900">+${txn.amount.toFixed(2)}</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{txn.status}</p>
                      </div>
                    </div>
                  ))}

                  {(!billing?.transactions || billing.transactions.length === 0) && (
                    <div className="py-12 text-center">
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No transactions found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Info / Help */}
            <div className="space-y-8">
              <div className="bg-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-gray-200">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600 rounded-full blur-[80px] opacity-40" />
                
                <h3 className="text-xl font-black uppercase tracking-tight mb-4 relative z-10">Need help?</h3>
                <p className="text-gray-400 text-xs font-medium leading-relaxed mb-8 relative z-10">
                  If you encounter difficulties with your payments or wish to change your payment method, our financial support team is here for you.
                </p>
                
                <div className="space-y-3 relative z-10">
                  <Link 
                    href="/dashboard/notifications"
                    className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-white/10"
                  >
                    Contact support
                    <ChevronRight size={14} />
                  </Link>

                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-900/20"
                  >
                    Upgrade Program
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Frequent Questions</h3>
                
                {[
                  { q: "Can I pay by bank transfer?", a: "Yes, contact us to receive our bank details." },
                  { q: "Is my data secure?", a: "We use Stripe and PayPal to guarantee maximum security." },
                ].map((faq, i) => (
                  <div key={i} className="space-y-2 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <p className="text-xs font-black text-gray-800 uppercase leading-tight">{faq.q}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors z-20"
              >
                <CloseIcon size={24} />
              </button>

              <div className="p-10 md:p-14">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-100">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Upgrade Program</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Choose a higher dimension for your training</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Logic to determine current, previous and next plan */}
                  {(() => {
                    const plans = [
                      { 
                        id: 'standard', 
                        name: 'Standard Enrollment', 
                        price: parseInt(siteData?.price_standard), 
                        quota: parseInt(siteData?.quota_standard), 
                        color: 'emerald' 
                      },
                      { 
                        id: 'premium', 
                        name: 'Premium Enrollment', 
                        price: parseInt(siteData?.price_premium), 
                        quota: parseInt(siteData?.quota_premium), 
                        color: 'purple' 
                      },
                      { 
                        id: 'executive', 
                        name: 'Executive Enrollment', 
                        price: parseInt(siteData?.price_executive), 
                        quota: 'Unlimited', 
                        color: 'indigo' 
                      },
                    ];
                    
                    const currentId = billing?.plan_name.toLowerCase().replace(' plan', '').replace(' enrollment', '').trim() || 'none';
                    
                    const displayPlans = plans.map(p => {
                      const currentIndex = plans.findIndex(pl => pl.id === currentId);
                      const pIndex = plans.findIndex(pl => pl.id === p.id);
                      
                      if (p.id === currentId) return { ...p, type: 'current' };
                      if (pIndex > currentIndex) return { ...p, type: 'upgrade' };
                      return { ...p, type: 'downgrade' };
                    });

                    return displayPlans.map((p) => (
                      <div 
                        key={p.id}
                        className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col ${
                          p.type === 'current' 
                            ? 'border-purple-600 bg-purple-50/50 ring-4 ring-purple-50' 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        {p.type === 'current' && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full whitespace-nowrap">
                            Current Plan
                          </div>
                        )}
                        
                        <div className="mb-6">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
                            p.id === 'standard' ? 'text-emerald-500' : p.id === 'premium' ? 'text-purple-500' : 'text-indigo-500'
                          }`}>
                            {p.name}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-900">${p.price}</span>
                            <span className="text-[10px] font-bold text-gray-400 italic">one-time</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          <li className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                            <Zap size={12} className="text-amber-400" />
                            {p.quota} Courses
                          </li>
                          <li className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                            <ShieldCheck size={12} className="text-emerald-400" />
                            Official Support
                          </li>
                        </ul>

                        {p.type === 'upgrade' ? (
                          upgradeStatus?.has_request === 1 && upgradeStatus?.target_plan === p.id && upgradeStatus?.status === 'pending' ? (
                            <div className="w-full py-3 bg-amber-100 text-amber-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin" />
                              Pending Approval
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleUpgradeRequest(p.id)}
                              disabled={upgradeLoading || (upgradeStatus?.has_request === 1 && upgradeStatus?.status === 'pending')}
                              className="w-full py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {upgradeLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
                              Request Upgrade
                            </button>
                          )
                        ) : p.type === 'downgrade' ? (
                          <div className="w-full py-3 bg-gray-50 text-gray-300 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                            <ArrowDownCircle size={14} />
                            Lower Tier
                          </div>
                        ) : (
                          <div className="w-full py-3 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} />
                            Active
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* Upgrade status message */}
                {upgradeMsg && (
                  <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center ${
                    upgradeMsg.startsWith("✓") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                  }`}>
                    {upgradeMsg}
                  </div>
                )}

                {/* Pending upgrade banner */}
                {upgradeStatus?.has_request === 1 && upgradeStatus?.status === 'pending' && !upgradeMsg && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                    <Loader2 size={16} className="text-amber-500 animate-spin flex-shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700">
                      You have a pending upgrade request to <span className="uppercase font-black">{upgradeStatus.target_plan}</span>. Our team will review it shortly.
                    </p>
                  </div>
                )}

                <div className="mt-6 p-6 bg-gray-50 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
                    Upgrading requires admin approval. Once approved, the price difference will be added to your balance.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
