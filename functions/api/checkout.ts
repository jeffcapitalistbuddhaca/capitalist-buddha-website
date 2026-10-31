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
    const { email, password } = await context.request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const stripeKey = (context.env as any)?.['Stripe Secret Key 2'];
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Create Checkout Session
    const params = new URLSearchParams({
      'line_items[0][price]': 'price_1UVYmmKLvdoBDUk6V3E7FEZZ',
      'line_items[0][quantity]': '1',
      mode: 'payment',
      'success_url': 'https://capitalistbuddha.ca/?payment=success&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password),
      'cancel_url': 'https://capitalistbuddha.ca/',
      'customer_email': email,
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json() as any;

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Failed to create checkout session' }),
        { status: response.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
