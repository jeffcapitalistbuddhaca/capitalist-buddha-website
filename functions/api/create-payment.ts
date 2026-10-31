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

    // TEST: Hit a public API to verify fetch works
    const testResponse = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    const testData = await testResponse.json() as any;

    if (!testResponse.ok) {
      return new Response(JSON.stringify({ error: 'Test API call failed', details: testData }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // If test passes, return test data
    return new Response(
      JSON.stringify({
        success: true,
        test: 'API calls work',
        testData: testData,
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
