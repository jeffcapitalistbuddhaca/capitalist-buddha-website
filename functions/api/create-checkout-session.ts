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

    const { email } = await context.request.json();

    const env = context.env;
    const stripeKey = env?.['Stripe Secret Key 2'];

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe key not found' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const params = new URLSearchParams();
    params.append('ui_mode', 'embedded');
    params.append('mode', 'payment');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', '19900'); // $199.00 USD in cents
    params.append('line_items[0][price_data][product_data][name]', 'Capitalist Buddha Course');
    params.append('line_items[0][price_data][product_data][tax_code]', 'txcd_100000'); // Educational Services tax code
    params.append('line_items[0][quantity]', '1');
    params.append('automatic_tax[enabled]', 'true');
    params.append('billing_address_collection', 'required');
    params.append('customer_creation', 'always');
    params.append('metadata[email]', email || '');
    params.append('return_url', 'https://capitalistbuddha.ca/?session_id={CHECKOUT_SESSION_ID}');

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
      return new Response(JSON.stringify({ error: session.error?.message || 'Session creation failed' }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: session.client_secret,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
