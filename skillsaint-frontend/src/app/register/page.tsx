import RegisterForm from "./RegisterForm";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const RegisterPage = async ({ searchParams }: { searchParams: Promise<{ courseId?: string }> }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("moodle_token")?.value;
  const { courseId } = await searchParams;

  if (token) {
    if (courseId) {
      redirect(`/checkout?courseId=${courseId}`);
    } else {
      redirect("/");
    }
  }

  return (
    <main className="bg-gray-50 min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-card p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 text-[clamp(2rem,1.663rem+2vw,3rem)] leading-tight">
              Course Registration
            </h1>
            <p className="text-secondary text-lg">
              Please fill out the form below to secure your spot.
            </p>
          </div>
          <Suspense fallback={<div className="text-center">Loading form...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
