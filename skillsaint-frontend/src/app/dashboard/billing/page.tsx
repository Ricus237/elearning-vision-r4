/* eslint-disable */

"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserBilling } from "@/lib/moodle";

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

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

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
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{txn.id}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{txn.date} • {txn.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
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
                
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative z-10 border border-white/10">
                  Contact support
                  <ChevronRight size={14} />
                </button>
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
    </div>
  );
}
