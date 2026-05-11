import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


export async function POST(req: NextRequest) {
  try {
    const { 
      courseId, 
      userId, 
      courseTitle, 
      amount, 
      currency, 
      isApplication, 
      courses, 
      email, 
      name,
      paymentType,
      successUrl,
      cancelUrl,
      savePaymentMethod
    } = await req.json();

    if ((!courseId && !isApplication) || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: (currency || 'usd').toLowerCase(),
            product_data: {
              name: courseTitle || `Course #${courseId}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}${courseId ? `&courseId=${courseId}` : '&isApplication=true'}${paymentType ? `&paymentType=${paymentType}` : ''}`,
      cancel_url: cancelUrl || `${appUrl}/apply`,
      billing_address_collection: 'required',
      metadata: {
        courseId: courseId?.toString() || '0',
        userId: userId?.toString() || '',
        email: email || '',
        name: name || '',
        isApplication: isApplication ? 'true' : 'false',
        courses: courses || '',
        paymentType: paymentType || '',
        savePaymentMethod: savePaymentMethod ? 'true' : 'false',
      },
    };

    // If we want to save the payment method for future autopay
    if (savePaymentMethod) {
      sessionOptions.payment_intent_data = {
        setup_future_usage: 'off_session',
      };
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Stripe create-session error]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

}
