import Stripe from 'stripe';
import { createFirebaseEnrollment, sendConfirmationEmail } from '../lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function confirmPayment(request: Request): Promise<Response> {
  try {
    const { paymentIntentId, email, password } = await request.json();

    if (!paymentIntentId || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'paymentIntentId, email, and password required' }),
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return new Response(JSON.stringify({ error: 'Payment not confirmed' }), {
        status: 400,
      });
    }

    const now = new Date();
    const expirationDate = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

    const enrollment = await createFirebaseEnrollment({
      email,
      password,
      enrollmentDate: now.toISOString(),
      expirationDate: expirationDate.toISOString(),
      paymentIntentId,
    });

    await sendConfirmationEmail(email, password, expirationDate);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Enrollment created. Check your email for login credentials.',
        expirationDate: expirationDate.toISOString(),
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
