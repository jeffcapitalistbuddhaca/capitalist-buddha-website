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
    const { email } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const env = context.env as any;

    // Debug: return all env values to see what's actually available
    const envDebug: any = {};
    for (const key in env) {
      const val = env[key];
      if (typeof val === 'string' && val.length > 0) {
        envDebug[key] = val.substring(0, 30) + (val.length > 30 ? '...' : '');
      } else {
        envDebug[key] = typeof val;
      }
    }

    return new Response(
      JSON.stringify({ debug: 'environment', env: envDebug }),
      { status: 500, headers: corsHeaders }
    );

    const params = new URLSearchParams({
      amount: '19900',
      currency: 'usd',
      'metadata[email]': email,
      description: 'Capitalist Buddha Course - $199 USD',
    });

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const paymentIntent = await response.json() as any;

    if (!response.ok) {
      return new Response(JSON.stringify({ error: paymentIntent.error?.message || 'Payment creation failed' }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
