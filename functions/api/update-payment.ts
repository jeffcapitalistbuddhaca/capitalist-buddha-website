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

    const { paymentIntentId, amount } = await context.request.json();

    if (!paymentIntentId || !amount) {
      return new Response(JSON.stringify({ error: 'Payment intent ID and amount required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const env = context.env;
    const stripeKey = env?.['Stripe Secret Key Live'];

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe key not found' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const params = new URLSearchParams({
      amount: String(amount),
    });

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const paymentIntent = await response.json() as any;

    if (!response.ok) {
      return new Response(JSON.stringify({ error: paymentIntent.error?.message || 'Update failed' }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: paymentIntent.amount,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Payment update error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
