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

    const env = context.env;
    const signingSecret = env?.['Webhook Signing Secret'];

    if (!signingSecret) {
      console.error('Webhook signing secret not found');
      return new Response(
        JSON.stringify({ error: 'Webhook signing secret not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const rawBody = await context.request.text();
    const signature = context.request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify Stripe signature
    const verified = await verifyStripeSignature(rawBody, signature, signingSecret);
    if (!verified) {
      console.error('Signature verification failed');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const event = JSON.parse(rawBody);
    console.log('Webhook event received:', event.type);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      console.log('Customer email:', session.customer_email);
      console.log('Payment status:', session.payment_status);

      // Log the event for audit trail
      if (session.customer_email) {
        try {
          await fetch('https://capitalistbuddha.ca/api/email-log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env?.['EMAIL_LOG_SECRET'] || 'dev-secret'}`,
            },
            body: JSON.stringify({
              email: session.customer_email,
              type: 'webhook_received',
              sessionId: session.id,
            }),
          });
        } catch (err) {
          console.error('Email logging error:', err);
        }
      }

      return new Response(
        JSON.stringify({ received: true, event: event.type }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Other event types: acknowledge receipt
    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const [timestamp, hash] = signature.split(',').map(part => part.split('=')[1]);

    if (!timestamp || !hash) {
      return false;
    }

    const signed = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature_bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signed));
    const computed_hash = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computed_hash === hash;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
