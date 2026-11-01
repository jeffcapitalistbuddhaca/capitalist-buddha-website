const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Base64 URL encode without padding
function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function getAccessToken(context: any): Promise<string> {
  const privateKeyPem = (context.env as any)?.['FIREBASE_PRIVATE_KEY'] || '';
  const clientEmail = (context.env as any)?.['FIREBASE_CLIENT_EMAIL'] || '';

  if (!privateKeyPem || !clientEmail) {
    throw new Error('Firebase credentials missing');
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const message = `${header}.${payload}`;

  // Convert PEM to PKCS8 DER format for Web Crypto API
  const keyLines = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');

  const keyBuffer = Uint8Array.from(atob(keyLines), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(message));
  const signature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  const jwt = `${message}.${signature}`;

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
  if (!tokenData.access_token) {
    throw new Error(`Failed to get token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

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

    const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID_CORRECT'];
    if (!firebaseProject) {
      return new Response(JSON.stringify({ error: 'Firebase project not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    try {
      const accessToken = await getAccessToken(context);

      const enrollmentDate = new Date();
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

      const createUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents/enrollments?documentId=${encodeURIComponent(documentId)}`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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

      const status = expiredNow ? 'ALREADY EXPIRED' : 'VALID (180 days)';

      return new Response(
        JSON.stringify({
          success: true,
          email,
          password,
          enrollmentDate: enrollmentDate.toISOString(),
          expirationDate: expirationDate.toISOString(),
          status,
          testInstruction: expiredNow
            ? 'Try to log in - you should immediately get "access expired" error'
            : 'Log in normally (access valid).',
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error('Test enrollment error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  } catch (error) {
    console.error('Request error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
