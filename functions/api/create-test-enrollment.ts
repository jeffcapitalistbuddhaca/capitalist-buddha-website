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
    const { email, password = 'testpass123', expiredNow = false } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID'] || '';
    const firebaseKey = (context.env as any)?.['FIREBASE_API_KEY'] || '';

    if (!firebaseProject || !firebaseKey) {
      return new Response(JSON.stringify({ error: 'Firebase not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Create enrollment date
    const enrollmentDate = new Date();

    // Set expiration date - either yesterday (if expiredNow=true) or 180 days from now
    const expirationDate = new Date();
    if (expiredNow) {
      expirationDate.setDate(expirationDate.getDate() - 1);
    } else {
      expirationDate.setDate(expirationDate.getDate() + 180);
    }

    const documentId = `test_${email.split('@')[0]}_${Date.now()}`;

    const enrollmentData = {
      fields: {
        email: { stringValue: email },
        enrollmentDate: { stringValue: enrollmentDate.toISOString() },
        expirationDate: { stringValue: expirationDate.toISOString() },
        transactionId: { stringValue: `test_${Date.now()}` },
        transactionType: { stringValue: 'test_enrollment' },
        password: { stringValue: password },
      },
    };

    const createUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents/enrollments?documentId=${encodeURIComponent(documentId)}&key=${firebaseKey}`;

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollmentData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return new Response(JSON.stringify({ error: 'Firebase creation failed', details: error }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const status = expiredNow ? 'ALREADY EXPIRED' : 'VALID (180 days)';

    return new Response(
      JSON.stringify({
        success: true,
        email: email,
        password: password,
        enrollmentDate: enrollmentDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: status,
        testInstruction: expiredNow
          ? 'Try to log in - you should immediately get "access expired" error'
          : 'Log in normally (access valid). Then call test-expire to expire it and test the error.',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Create test enrollment error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
