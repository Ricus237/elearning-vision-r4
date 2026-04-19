import { NextRequest, NextResponse } from 'next/server';
import { fetchMoodle } from '@/lib/moodle';

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
    const { orderID } = await req.json();

    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID' }, { status: 400 });
    }

    const token = await getPaypalAccessToken();

    // Capture the PayPal order
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await res.json();

    if (capture.status !== 'COMPLETED') {
      console.error('[PayPal capture] Unexpected status:', capture.status, capture);
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Extract identifiers from the capture metadata
    const purchaseUnit = capture.purchase_units?.[0];
    const customId = purchaseUnit?.payments?.captures?.[0]?.custom_id || purchaseUnit?.custom_id;
    
    if (!customId) {
      console.warn('[PayPal capture] No customId found in capture data');
      return NextResponse.json({ success: true, captureId: capture.id });
    }

    const { courseId, userId, isApplication, courses, email } = JSON.parse(customId);
    
    // 1. Handle New Applications (New candidate paying)
    if (isApplication && email) {
      try {
        const result = await fetchMoodle('local_skillsaint_confirm_payment', { email });
        if (result?.status === 'success') {
          console.log(`[PayPal capture] ✅ Application confirmed for ${email}`);
          return NextResponse.json({ success: true, captureId: capture.id });
        } else {
          console.error(`[PayPal capture] ❌ Moodle failed to confirm application for ${email}:`, result);
        }
      } catch (err) {
        console.error(`[PayPal capture] ❌ Moodle Error during application confirmation:`, err);
      }
    }

    // 2. Handle standard enrollments (Logged in user buying a course)
    if (!userId) {
      console.warn('[PayPal capture] No userId found in customData (and not a new application)');
      return NextResponse.json({ success: true, captureId: capture.id });
    }

    const enrolments: Record<string, { roleid: number; userid: number; courseid: number }> = {};


    if (isApplication && Array.isArray(courses)) {
      courses.forEach((id, index) => {
        enrolments[index.toString()] = {
          roleid: 5, // Student role
          userid: parseInt(userId),
          courseid: parseInt(id),
        };
      });
    } else if (courseId && courseId !== '0') {
      enrolments['0'] = {
        roleid: 5,
        userid: parseInt(userId),
        courseid: parseInt(courseId),
      };
    }

    if (Object.keys(enrolments).length > 0) {
      const result = await fetchMoodle('enrol_manual_enrol_users', { enrolments });
      if (result?.errorcode) {
        console.error(`[PayPal capture] Moodle enrolment error for user ${userId}:`, result);
      } else {
        console.log(`[PayPal capture] ✅ User ${userId} enrolled in ${Object.keys(enrolments).length} courses`);
      }
    }

    return NextResponse.json({
      success: true,
      captureId: capture.id,
      status: capture.status,
    });
  } catch (err) {
    console.error('[PayPal capture-order error]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

}
