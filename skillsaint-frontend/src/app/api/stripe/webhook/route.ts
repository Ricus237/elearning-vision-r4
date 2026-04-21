import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { fetchMoodle } from '@/lib/moodle';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text(); 
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('[Stripe Webhook] Signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }


  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await handleEnrolment(session);
      }
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleEnrolment(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const userId = meta.userId;
  const email = meta.email;
  const isApplication = meta.isApplication === 'true';
  const courseId = meta.courseId;
  const coursesString = meta.courses;

  // 1. Handle New Applications (New candidate paying)
  if (isApplication && email) {
    try {
      const result = await fetchMoodle('local_skillsaint_confirm_payment', { email });
      if (result?.status === 'success') {
        console.log(`[Stripe Webhook] ✅ Application confirmed for ${email}`);
        return;
      } else {
        console.error(`[Stripe Webhook] ❌ Moodle failed to confirm application for ${email}:`, result);
      }
    } catch (err) {
      console.error(`[Stripe Webhook] ❌ Moodle Error during application confirmation:`, err);
    }
  }

  // 2. Handle standard enrollments (Logged in user buying a course)
  if (!userId) {
    console.error('[Stripe Webhook] Missing userId in metadata (and not a new application)');
    return;
  }

  const enrolments: Record<string, { roleid: number; userid: number; courseid: number }> = {};

  
  if (isApplication && coursesString) {
    // Enroll in multiple courses (from application)
    const courseIds = coursesString.split(',').filter(Boolean);
    courseIds.forEach((id, index) => {
      enrolments[index.toString()] = {
        roleid: 5,
        userid: parseInt(userId),
        courseid: parseInt(id),
      };
    });
  } else if (courseId && courseId !== '0') {
    // Enroll in a single course
    enrolments['0'] = {
      roleid: 5,
      userid: parseInt(userId),
      courseid: parseInt(courseId),
    };
  }

  if (Object.keys(enrolments).length === 0) {
    console.warn('[Stripe Webhook] No courses to enroll in');
    return;
  }

  try {
    const result = await fetchMoodle('enrol_manual_enrol_users', { enrolments });
    if (result?.errorcode) {
      console.error(`[Stripe Webhook] Moodle error for user ${userId}:`, result);
    } else {
      console.log(`[Stripe Webhook] ✅ User ${userId} enrolled in ${Object.keys(enrolments).length} courses`);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Moodle error:', err);
  }
}
