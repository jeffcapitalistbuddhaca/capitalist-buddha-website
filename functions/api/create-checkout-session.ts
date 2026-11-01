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
    params.append('ui_mode', 'embedded_page');
    params.append('mode', 'payment');
    // TEMPORARY: Using $1 CAD test price for verification. Switch to COURSE_PRICE_ID after testing.
    params.append('line_items[0][price]', 'price_1UX1O6KLvdoBDUk6XgfDKxZh'); // $1 CAD test
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

    // Log email capture for audit trail
    if (email) {
      try {
        await fetch('https://capitalistbuddha.ca/api/email-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env?.['EMAIL_LOG_SECRET'] || 'dev-secret'}`,
          },
          body: JSON.stringify({
            email,
            type: 'checkout',
            sessionId: session.id,
          }),
        });
      } catch (err) {
        console.error('Email logging error:', err);
        // Don't fail the request if logging fails
      }
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
