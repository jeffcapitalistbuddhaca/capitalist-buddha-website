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

    const stripeKey = (context.env as any)?.STRIPE_SECRET_KEY_LIVE || '';

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

    // Store enrollment in Firebase Firestore
    const firebaseKey = (context.env as any)?.['FIREBASE_API_KEY'] || '';
    const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID'] || '';

    if (firebaseKey && firebaseProject) {
      try {
        const enrollmentData = {
          email,
          enrollmentDate: enrollment.enrollmentDate,
          expirationDate: enrollment.expirationDate,
          transactionId: transactionId,
          transactionType: isCheckoutSession ? 'checkout_session' : 'payment_intent',
          createdAt: new Date().toISOString(),
        };

        // Save to Firestore: /enrollments/{email}
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents/enrollments?documentId=${encodeURIComponent(email.split('@')[0] + '_' + Date.now())}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firebaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                email: { stringValue: email },
                enrollmentDate: { stringValue: enrollmentData.enrollmentDate },
                expirationDate: { stringValue: enrollmentData.expirationDate },
                transactionId: { stringValue: transactionId },
                transactionType: { stringValue: enrollmentData.transactionType },
                createdAt: { stringValue: enrollmentData.createdAt },
              },
            }),
          }
        );

        const fbResult = await response.json();
        if (response.ok) {
          console.log('Enrollment stored in Firebase:', fbResult);
        } else {
          console.warn('Firebase storage warning:', fbResult);
        }
      } catch (err) {
        console.error('Firebase storage error:', err);
        // Continue anyway - account is created
      }
    } else {
      console.log('Firebase not configured, enrollment not persisted');
    }

    // Log email for audit trail
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
    }

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
