const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// In-memory email log (would be database in production)
// This persists during a Cloudflare Workers instance lifetime
let emailLog: Array<{
  email: string;
  type: 'checkout' | 'account_created';
  timestamp: string;
  sessionId?: string;
}> = [];

export async function onRequest(context: any): Promise<Response> {
  try {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Require authorization - check for a secret header
    const authHeader = context.request.headers.get('Authorization');
    const SECRET = context.env?.['EMAIL_LOG_SECRET'] || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${SECRET}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (context.request.method === 'GET') {
      // Return all logged emails
      return new Response(
        JSON.stringify({
          success: true,
          count: emailLog.length,
          emails: emailLog,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    if (context.request.method === 'POST') {
      // Log an email
      const { email, type, sessionId } = await context.request.json();

      if (!email || !type) {
        return new Response(
          JSON.stringify({ error: 'email and type required' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const entry = {
        email,
        type,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || undefined,
      };

      emailLog.push(entry);

      return new Response(
        JSON.stringify({
          success: true,
          logged: entry,
          totalLogged: emailLog.length,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Email log error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
