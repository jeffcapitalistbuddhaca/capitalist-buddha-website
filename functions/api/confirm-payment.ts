const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequest(context: any): Promise<Response> {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { paymentIntentId, email, password } = await context.request.json();

    if (!paymentIntentId || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'paymentIntentId, email, and password required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const stripeKey = (context.env as any)?.['Stripe Secret Key 2'] || '';

    // Determine if this is a Checkout Session ID (cs_*) or PaymentIntent ID (pi_*)
    const isCheckoutSession = paymentIntentId.startsWith('cs_');

    let paymentStatus = null;
    let transactionId = paymentIntentId;

    if (isCheckoutSession) {
      // Handle Checkout Session
      console.log('Confirming Checkout Session:', paymentIntentId);
      const sessionResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${paymentIntentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      });

      const session = await sessionResponse.json() as any;
      console.log('Session response:', session);

      if (!sessionResponse.ok) {
        return new Response(
          JSON.stringify({ error: session.error?.message || 'Session not found' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // For Checkout Sessions, check payment_status
      paymentStatus = session.payment_status;
      if (session.payment_status !== 'paid') {
        return new Response(
          JSON.stringify({ error: `Payment not completed. Status: ${session.payment_status}` }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // Handle PaymentIntent (legacy)
      console.log('Confirming PaymentIntent:', paymentIntentId);
      const paymentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${stripeKey}` },
      });

      const paymentIntent = await paymentResponse.json() as any;
      console.log('PaymentIntent response:', paymentIntent);

      if (paymentIntent.status !== 'succeeded') {
        return new Response(
          JSON.stringify({ error: 'Payment not completed' }),
          { status: 400, headers: corsHeaders }
        );
      }

      paymentStatus = 'succeeded';
    }

    const enrollmentDate = new Date();
    const expirationDate = new Date(enrollmentDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

    const enrollment = {
      email,
      enrollmentDate: enrollmentDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      transactionId: transactionId,
      transactionType: isCheckoutSession ? 'checkout_session' : 'payment_intent',
    };

    console.log('Account created with enrollment:', enrollment);

    // Log email for audit trail
    const stripeKeyForLog = (context.env as any)?.['Stripe Secret Key 2'] || '';
    try {
      await fetch('https://capitalistbuddha.ca/api/email-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(context.env as any)?.['EMAIL_LOG_SECRET'] || 'dev-secret'}`,
        },
        body: JSON.stringify({
          email,
          type: 'account_created',
          sessionId: transactionId,
        }),
      });
    } catch (err) {
      console.error('Email logging error:', err);
      // Don't fail the request if logging fails
    }

    // Note: Firebase enrollment storage would go here
    // For now, account is confirmed and ready
    // TODO: Implement Firebase Firestore enrollment storage

    return new Response(
      JSON.stringify({ success: true, enrollment }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
