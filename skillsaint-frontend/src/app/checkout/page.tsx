import { Suspense } from "react";
import CheckoutForm from "./CheckoutForm";

const CheckoutPage = () => {
  return (
    <main className="bg-gray-50 min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-card flex flex-col md:flex-row overflow-hidden">
          <Suspense fallback={<div className="p-12 text-center w-full">Loading secure checkout...</div>}>
            <CheckoutForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
