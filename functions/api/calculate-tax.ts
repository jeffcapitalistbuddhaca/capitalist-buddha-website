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

    const { address } = await context.request.json();

    if (!address) {
      return new Response(JSON.stringify({ error: 'Address required' }), {
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

    // Call Stripe Tax Calculation API
    const params = new URLSearchParams();
    params.append('currency', 'usd');
    params.append('line_items[0][amount]', '19900');
    params.append('line_items[0][reference]', 'course');
    params.append('customer_details[address_source]', 'billing');
    params.append('customer_details[address][line1]', address.line1 || '');
    params.append('customer_details[address][line2]', address.line2 || '');
    params.append('customer_details[address][city]', address.city || '');
    params.append('customer_details[address][state]', address.state || '');
    params.append('customer_details[address][postal_code]', address.postal_code || '');
    params.append('customer_details[address][country]', address.country || 'US');

    const bodyString = params.toString();
    console.log('Tax API payload:', bodyString);

    const taxResponse = await fetch('https://api.stripe.com/v1/tax/calculations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyString,
    });

    const taxData = await taxResponse.json() as any;

    if (!taxResponse.ok) {
      return new Response(
        JSON.stringify({ error: taxData.error?.message || 'Tax calculation failed' }),
        { status: taxResponse.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        calculationId: taxData.id,
        taxAmount: taxData.tax_amount_exclusive,
        total: 19900 + (taxData.tax_amount_exclusive || 0),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Tax calculation error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
