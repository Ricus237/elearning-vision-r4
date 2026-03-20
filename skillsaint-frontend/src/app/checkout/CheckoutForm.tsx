"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { coursesData } from "@/components/courses/courseData";
import { CourseType } from "@/types/CourseType";
import Button from "@/components/ui/button";

import { getCourseById } from "@/lib/moodle";
import { enrollAction } from "@/lib/actions";

const CheckoutForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams?.get("courseId");
  const [course, setCourse] = useState<CourseType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (courseId) {
      getCourseById(parseInt(courseId)).then(setCourse);
    }
  }, [courseId]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    // Simulation du délai Stripe
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (courseId) {
      const result = await enrollAction(parseInt(courseId));
      if (result.success) {
        setIsProcessing(false);
        router.push("/dashboard"); // Ou une page de succès
        router.refresh();
      } else {
        setError(result.error || "Erreur lors de l'inscription au cours sur Moodle.");
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
      router.push("/");
    }
  };

  const amount = course ? (course.discountPrice || course.price).toFixed(2) : "0.00";

  return (
    <>
      <div className="w-full md:w-5/12 bg-gray-900 text-white p-8 md:p-10 flex flex-col justify-between">
        <div>
          <h2 className="text-xl text-gray-400 font-medium mb-2">Order Summary</h2>
          <h3 className="text-2xl font-bold mb-6">{course?.title || "Selected Course"}</h3>
          
          <div className="space-y-4 text-gray-300 text-sm">
            <div className="flex justify-between pb-4 border-b border-gray-800">
              <span>Original Price</span>
              <span>${course?.price?.toFixed(2) || "0.00"}</span>
            </div>
            {course?.discountPrice && (
              <div className="flex justify-between pb-4 border-b border-gray-800 text-purple-400">
                <span>Discount</span>
                <span>-${(course.price - course.discountPrice).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-2 text-xl font-bold text-white">
              <span>Total due</span>
              <span>${amount}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-gray-400 text-xs flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-green-500" />
          <p>This is a secure 256-bit encrypted checkout. Your payment details are safely processed by Stripe.</p>
        </div>
      </div>

      <div className="w-full md:w-7/12 p-8 md:p-10 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
        
        <form onSubmit={handlePayment} className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-600 flex items-center justify-between">
            <div className="flex items-center gap-3 text-purple-900 font-medium">
              <CreditCard className="w-5 h-5" />
              Credit / Debit Card
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-5 bg-white border rounded flex items-center justify-center text-[8px] font-bold text-blue-900">VISA</div>
              <div className="w-8 h-5 bg-white border rounded flex items-center justify-center text-[8px] font-bold text-red-600">MC</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Information</label>
              <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 bg-white flex items-center gap-3 border-b border-gray-200">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Card number" required className="w-full focus:outline-none placeholder-gray-400" />
                </div>
                <div className="flex">
                  <div className="w-1/2 p-3 bg-white border-r border-gray-200">
                    <input type="text" placeholder="MM / YY" required className="w-full focus:outline-none placeholder-gray-400" />
                  </div>
                  <div className="w-1/2 p-3 bg-white flex items-center gap-2">
                    <input type="text" placeholder="CVC" required className="w-full focus:outline-none placeholder-gray-400" />
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name on card</label>
              <input type="text" placeholder="Full name on card" required className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country or region</label>
              <select className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 bg-white focus:border-transparent outline-none">
                <option>United States</option>
                <option>France</option>
                <option>Canada</option>
                <option>Senegal</option>
                <option>Cote d'Ivoire</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={isProcessing} className="w-full py-4 text-lg rounded-xl flex justify-center items-center gap-2">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Pay ${amount}</span>
            )}
          </Button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            By confirming your payment, you allow us to charge your card for this payment in accordance with our terms of service.
          </p>
        </form>
      </div>
    </>
  );
};

export default CheckoutForm;
