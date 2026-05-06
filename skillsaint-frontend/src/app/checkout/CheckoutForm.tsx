/* eslint-disable */

"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, ShieldCheck, CreditCard } from "lucide-react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { getCourseById } from "@/lib/moodle";
import { CourseType } from "@/types/CourseType";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

const CheckoutForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams?.get("courseId");
  const isApplication = searchParams?.get("application") === "true";
  const plan = searchParams?.get("plan");
  const paymentParam = searchParams?.get("payment"); // "stripe" | "paypal"

  const [course, setCourse] = useState<CourseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">(
    paymentParam === "paypal" ? "paypal" : "card"
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (courseId) getCourseById(parseInt(courseId)).then(setCourse);
    // Read Moodle user ID from cookie (set by loginAction)
    const match = document.cookie.match(/moodle_user_id=([^;]+)/);
    if (match) setUserId(match[1]);
  }, [courseId]);

  // ─── Pricing Logic ──────────────────────────────────────────────────────────
  const pricing = useMemo(() => {
    let amount = 0;
    const currency = "USD";
    let title = "Selected Course";
    let originalPrice = 0;
    let discountAmount: number | null = null;

    if (course) {
      amount = course.discountPrice || course.price;
      originalPrice = course.price;
      title = course.title;
      if (course.discountPrice && course.discountPrice < course.price) {
        discountAmount = course.price - course.discountPrice;
      }
    } else if (isApplication) {
      switch (plan) {
        case "standard":
          amount = 299;
          originalPrice = 399;
          title = "Standard Enrollment Plan";
          discountAmount = 100;
          break;
        case "premium":
          amount = 499;
          originalPrice = 599;
          title = "Premium Enrollment Plan";
          discountAmount = 100;
          break;
        case "executive":
          amount = 999;
          originalPrice = 1199;
          title = "Executive Enrollment Plan";
          discountAmount = 200;
          break;
        default:
          amount = 999;
          originalPrice = 1199;
          title = "GBI Enrollment Plan";
          discountAmount = 200;
      }
    }
    return { amount, currency, title, originalPrice, discountAmount };
  }, [course, isApplication, plan]);

  const { amount, currency, title, originalPrice, discountAmount } = pricing;

  // Set default custom amount when prices are loaded
  useEffect(() => {
    if (amount > 0 && customAmount === 0) {
      setCustomAmount(amount);
    }
  }, [amount, customAmount]);

  // ─── Stripe redirect ────────────────────────────────────────────────────────
  const handleStripePayment = async () => {
    setIsProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId ? parseInt(courseId) : null,
          userId,
          courseTitle: title,
          amount: customAmount || amount,
          currency,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start Stripe checkout.");
        setIsProcessing(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsProcessing(false);
    }
  };

  // ─── PayPal handlers ────────────────────────────────────────────────────────
  const createPayPalOrder = useCallback(async () => {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: courseId ? parseInt(courseId) : null,
        userId,
        courseTitle: title,
        amount: customAmount || amount,
        currency,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.orderID;
  }, [courseId, userId, title, amount, currency, customAmount]);

  const onPayPalApprove = useCallback(
    async (data: { orderID: string }) => {
      setIsProcessing(true);
      setError("");
      try {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderID: data.orderID,
            courseId: courseId ? parseInt(courseId) : null,
            userId,
          }),
        });
        const result = await res.json();
        if (result.success) {
          router.push("/success?method=paypal");
        } else {
          setError(result.error || "Payment capture failed.");
          setIsProcessing(false);
        }
      } catch {
        setError("Network error during capture.");
        setIsProcessing(false);
      }
    },
    [courseId, userId, router]
  );

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Left panel: Order summary ── */}
      <div className="w-full md:w-5/12 bg-gray-900 text-white p-8 md:p-10 flex flex-col justify-between">
        <div>
          <h2 className="text-xl text-gray-400 font-medium mb-2">Order Summary</h2>
          <h3 className="text-2xl font-bold mb-6">{title}</h3>

          <div className="space-y-4 text-gray-300 text-sm">
            <div className="flex justify-between pb-4 border-b border-gray-800">
              <span>Original Price</span>
              <span>${originalPrice.toFixed(2)}</span>
            </div>
            {discountAmount && (
              <div className="flex justify-between pb-4 border-b border-gray-800 text-purple-400">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 text-xl font-bold text-white">
              <span>Total due</span>
              <span>${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-gray-400 text-xs flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-green-500 shrink-0" />
          <p>Secure 256-bit encrypted checkout. Your payment is processed by Stripe or PayPal — we never store your card details.</p>
        </div>
      </div>

      {/* ── Right panel: Payment methods ── */}
      <div className="w-full md:w-7/12 p-8 md:p-10 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

        {/* Custom Amount Section */}
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border-2 border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Payer un montant spécifique</h3>
            <span className="text-[10px] font-black px-2 py-1 bg-purple-100 text-purple-700 rounded-full uppercase tracking-wider">Total: ${amount.toFixed(2)}</span>
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">$</span>
            <input
              type="number"
              min={10}
              max={amount}
              value={customAmount || ""}
              onChange={(e) => setCustomAmount(Math.min(amount, Math.max(0, Number(e.target.value))))}
              className="w-full h-14 pl-10 pr-6 bg-white border-2 border-gray-200 rounded-xl text-xl font-black text-gray-900 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
              placeholder="0.00"
            />
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase text-center italic">Indiquez le montant que vous souhaitez verser aujourd'hui.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ── Method toggle ── */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setPaymentMethod("paypal")}
            className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
              paymentMethod === "paypal"
                ? "bg-blue-50 border-blue-600 text-blue-900"
                : "bg-white border-gray-200 text-gray-500 hover:border-blue-200"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.54h7.947c1.513 0 2.754.365 3.72 1.082 1.25.928 1.888 2.344 1.888 4.212 0 2.856-1.542 5.33-4.585 5.33h-1.457c-.45 0-.832.312-.911.753l-.033.187-.532 3.007c-.053.298-.314.516-.617.516h-3.926zm12.39-12.016c0-3.328-2.618-4.792-5.746-4.792H5.576L2.61 20.668h3.844l1.292-7.24a.64.64 0 0 1 .632-.527h2.247c3.964 0 7.291-1.74 7.291-3.58z" />
            </svg>
            PayPal
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
              paymentMethod === "card"
                ? "bg-purple-50 border-purple-600 text-purple-900"
                : "bg-white border-gray-200 text-gray-500 hover:border-purple-200"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Card
          </button>
        </div>

        {/* ── PayPal Buttons ── */}
        {paymentMethod === "paypal" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center text-sm text-blue-700 mb-2">
              You&apos;ll be redirected to PayPal&apos;s secure checkout. No account required.
            </div>
            {isProcessing ? (
              <div className="flex items-center justify-center py-6">
                <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="ml-3 text-blue-700 font-medium">Finalizing payment...</span>
              </div>
            ) : (
              <PayPalScriptProvider
                options={{
                  clientId: PAYPAL_CLIENT_ID,
                  currency: currency.toUpperCase(),
                  intent: "capture",
                }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                  createOrder={createPayPalOrder}
                  onApprove={onPayPalApprove}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    setError("PayPal encountered an error. Please try again.");
                  }}
                  onCancel={() => setError("Payment cancelled.")}
                />
              </PayPalScriptProvider>
            )}
          </div>
        )}

        {/* ── Stripe Card Button ── */}
        {paymentMethod === "card" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center text-sm text-purple-700 mb-4">
              You&apos;ll be taken to Stripe&apos;s secure checkout page to enter your card details.
            </div>
            <button
              type="button"
              onClick={handleStripePayment}
              disabled={isProcessing}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-lg font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
            >
              {isProcessing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Payer ${customAmount.toFixed(2)} par Carte
                </>
              )}
            </button>
            <div className="flex justify-center gap-2 mt-2">
              {["VISA", "MC", "AMEX", "DISC"].map((brand) => (
                <div key={brand} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-600">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          By confirming your payment, you agree to our Terms of Service. Payments are processed securely by Stripe or PayPal.
        </p>
      </div>
    </>
  );
};

export default CheckoutForm;
