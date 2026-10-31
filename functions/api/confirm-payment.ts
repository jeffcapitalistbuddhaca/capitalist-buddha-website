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

    const stripeKey = context.env?.STRIPE_SECRET_KEY || '';
    const paymentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${stripeKey}` },
    });

    const paymentIntent = await paymentResponse.json() as any;

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const enrollmentDate = new Date();
    const expirationDate = new Date(enrollmentDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

    const firebaseDbUrl = context.env?.FIREBASE_DATABASE_URL || '';
    const firebaseKey = context.env?.FIREBASE_API_KEY || '';

    const enrollment = {
      email,
      enrollmentDate: enrollmentDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      paymentIntentId,
    };

    const firestoreResponse = await fetch(
      `${firebaseDbUrl}/documents/enrollments?key=${firebaseKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { email: { stringValue: email } } }),
      }
    );

    if (!firestoreResponse.ok) {
      console.error('Firestore error:', await firestoreResponse.text());
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
