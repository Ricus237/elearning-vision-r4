/* eslint-disable */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { confirmPayment } from "@/lib/data";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { email: providedEmail, sessionId, method, orderID, userId: providedUserId } = await request.json();

    let email = providedEmail;
    let amount = 0;
    let transactionId = sessionId || orderID || "";
    const finalMethod = method || "stripe";
    let userId = providedUserId || 0;
    let stripeCustomerId = "";
    let stripePaymentMethod = "";

    // 1. If we have a sessionId (Stripe), fetch real details from Stripe
    if (sessionId && finalMethod === "stripe") {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent'],
        });
        if (session.payment_status === 'paid') {
          email = session.customer_details?.email || session.metadata?.email || email;
          amount = session.amount_total ? session.amount_total / 100 : 0;
          transactionId = session.id;
          userId = session.metadata?.userId ? parseInt(session.metadata.userId) : userId;
          stripeCustomerId = session.customer as string || "";
          
          const pi = session.payment_intent as any;
          if (pi && pi.payment_method) {
            stripePaymentMethod = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method.id;
          }
        }
      } catch (err) {
        console.error("Stripe session retrieval error:", err);
      }
    }

    // 2. If we have a PayPal orderID, fetch details from PayPal
    if (orderID && finalMethod === "paypal") {
      try {
        const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
        const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
        const PAYPAL_BASE = process.env.PAYPAL_SANDBOX === 'true' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

        // Get Access Token
        const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
          method: 'POST',
          headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
        });
        const tokenData = await tokenRes.json();
        
        if (tokenData.access_token) {
          const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}`, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          const orderData = await orderRes.json();
          if (orderData.status === 'COMPLETED' || orderData.status === 'APPROVED') {
            const purchaseUnit = orderData.purchase_units?.[0];
            amount = parseFloat(purchaseUnit?.amount?.value || "0");
            email = purchaseUnit?.payee?.email || email; // Fallback to provided email
            transactionId = orderData.id;
          }
        }
      } catch (err) {
        console.error("PayPal order retrieval error:", err);
      }
    }

    if (!email) {
      return NextResponse.json({ status: "error", message: "Email is required" }, { status: 400 });
    }

    // Call Moodle with ALL payment details including USER ID
    const result = await confirmPayment(email, amount, finalMethod, transactionId, userId, stripeCustomerId, stripePaymentMethod);
    
    if (result && result.status === 'success' && result.user_id) {
       const cookieStore = await cookies();
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
