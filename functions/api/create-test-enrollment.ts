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

    const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID_CORRECT'] || '';
    const privateKeyPem = (context.env as any)?.['FIREBASE_PRIVATE_KEY'] || '';
    const clientEmail = (context.env as any)?.['FIREBASE_CLIENT_EMAIL'] || '';

    console.log('Environment check:');
    console.log('  firebaseProject:', firebaseProject ? 'set' : 'MISSING');
    console.log('  privateKeyPem:', privateKeyPem ? `set (${privateKeyPem.length} chars)` : 'MISSING');
    console.log('  clientEmail:', clientEmail ? `set (${clientEmail})` : 'MISSING');

    if (!firebaseProject || !privateKeyPem || !clientEmail) {
      return new Response(JSON.stringify({ error: 'Firebase service account not configured', missing: { firebaseProject: !firebaseProject, privateKeyPem: !privateKeyPem, clientEmail: !clientEmail } }), {
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

    try {
      // Create JWT token signed with service account private key
      const header = { alg: 'RS256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      const headerEncoded = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payloadEncoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const signatureInput = `${headerEncoded}.${payloadEncoded}`;

      // Sign JWT with Web Crypto API
      const encoder = new TextEncoder();
      const keyData = new TextEncoder().encode(privateKeyPem);
      const key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(signatureInput));
      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const jwt = `${signatureInput}.${signatureB64}`;

      // Exchange JWT for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }).toString(),
      });

      const tokenData = await tokenResponse.json() as any;
      console.log('Token response status:', tokenResponse.status);
      console.log('Token data:', tokenData);

      if (!tokenData.access_token) {
        throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
      }

      // Create document in Firestore with access token
      const createUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents/enrollments?documentId=${encodeURIComponent(documentId)}`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify(enrollmentData),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        return new Response(JSON.stringify({ error: 'Firebase creation failed', details: error }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    } catch (firebaseError) {
      console.error('Firebase creation error:', firebaseError);
      return new Response(JSON.stringify({ error: 'Firebase creation failed', details: String(firebaseError) }), {
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
