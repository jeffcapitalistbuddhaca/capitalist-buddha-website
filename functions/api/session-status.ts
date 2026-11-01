const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequest(context: any): Promise<Response> {
  try {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (context.request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const url = new URL(context.request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'session_id required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const env = context.env;
    const stripeKey = env?.STRIPE_SECRET_KEY_LIVE;

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe key not found' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    const session = await response.json() as any;

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Session lookup failed' }),
        { status: response.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        status: session.status,
        customer_email: session.customer_details?.email || '',
        payment_status: session.payment_status,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Session status error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
