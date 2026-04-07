import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getPaypalAccessToken(): Promise<string> {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { courseId, userId, courseTitle, amount, currency, isApplication, plan, courses } = await req.json();

    const token = await getPaypalAccessToken();
    const appUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paypalRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: isApplication ? `app_${plan}_user_${userId}` : `course_${courseId}_user_${userId}`,
            description: courseTitle || (isApplication ? `IBI ${plan} Program` : `Course #${courseId}`),
            custom_id: JSON.stringify({ courseId, userId, isApplication, plan, courses }),
            amount: {
              currency_code: (currency || 'USD').toUpperCase(),
              value: parseFloat(amount).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'International Bible Institute',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${appUrl}/success?method=paypal${courseId ? `&courseId=${courseId}` : '&isApplication=true'}`,
          cancel_url: `${appUrl}/apply`,
        },
      }),
    });

    const order = await paypalRes.json();

    if (!order.id) {
      console.error('[PayPal create-order error]', order);
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
    }

    return NextResponse.json({ orderID: order.id });
  } catch (err: any) {
    console.error('[PayPal create-order error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
