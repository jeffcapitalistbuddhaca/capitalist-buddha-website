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

    if (context.request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const { email, amount } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const env = context.env;
    const stripeKey = env?.['Stripe Secret Key 2'];

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe Secret Key not found', keys: Object.keys(env || {}) }),
        { status: 500, headers: corsHeaders }
      );
    }

    const finalAmount = amount || 19900;

    const params = new URLSearchParams();
    params.append('amount', String(finalAmount));
    params.append('currency', 'usd');
    params.append('metadata[email]', email);
    params.append('description', 'Capitalist Buddha Course - $199 USD + Tax');

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
