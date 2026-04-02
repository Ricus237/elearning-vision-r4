import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { confirmPayment } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ status: "error", message: "Email is required" }, { status: 400 });
    }

    // Ici, nous sommes sur le SERVEUR, donc confirmPayment aura accès à MOODLE_TOKEN
    const result = await confirmPayment(email);
    
    if (result && result.status === 'success' && result.user_id) {
       const cookieStore = await cookies();
       // Définir les cookies de session directement depuis le serveur pour éviter les problèmes de redirection
       cookieStore.set("moodle_user_id", result.user_id.toString(), { path: "/", maxAge: 2592000 });
       cookieStore.set("user_email", email, { path: "/", maxAge: 3600 });
       cookieStore.set("moodle_is_admin", "false", { path: "/", maxAge: 2592000 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 });
  }
}
