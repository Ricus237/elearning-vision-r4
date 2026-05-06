import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


export async function POST(req: NextRequest) {
  try {
    const { courseId, userId, courseTitle, amount, currency, isApplication, courses, email, paymentType } = await req.json();

    if ((!courseId && !isApplication) || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
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
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}${courseId ? `&courseId=${courseId}` : '&isApplication=true'}${paymentType ? `&paymentType=${paymentType}` : ''}`,
      cancel_url: `${appUrl}/apply`,
      metadata: {
        courseId: courseId?.toString() || '0',
        userId: userId?.toString() || '',
        email: email || '',
        isApplication: isApplication ? 'true' : 'false',
        courses: courses || '',
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Stripe create-session error]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

}
