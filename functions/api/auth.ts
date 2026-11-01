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
    const { email, password, action = 'login' } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (action === 'login') {
      const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID_CORRECT'];
      const privateKey = (context.env as any)?.['FIREBASE_PRIVATE_KEY'];
      const clientEmail = (context.env as any)?.['FIREBASE_CLIENT_EMAIL'];

      if (!firebaseProject || !privateKey || !clientEmail) {
        console.warn('Firebase service account not configured, allowing login');
        return new Response(JSON.stringify({ success: true, user: { email, uid: 'test-user-' + email } }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      try {
        const accessToken = await getAccessToken(context);

        // Query Firestore REST API for enrollment
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents/enrollments`;
        const firestoreResponse = await fetch(firestoreUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        const firestoreData = await firestoreResponse.json() as any;

        if (!firestoreData.documents) {
          return new Response(JSON.stringify({ error: 'No enrollment found' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Find enrollment for this email
        let enrollment = null;
        for (const doc of firestoreData.documents) {
          const fields = doc.fields;
          if (fields.email?.stringValue === email) {
            enrollment = fields;
            break;
          }
        }

        if (!enrollment) {
          return new Response(JSON.stringify({ error: 'No enrollment found for this email' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Check expiration date
        const expirationDateStr = enrollment.expirationDate?.stringValue;
        if (!expirationDateStr) {
          return new Response(JSON.stringify({ error: 'Invalid enrollment data' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const expirationDate = new Date(expirationDateStr);
        const now = new Date();

        if (now > expirationDate) {
          return new Response(JSON.stringify({ error: 'Your course access has expired. Please purchase again to regain access.' }), {
            status: 403,
            headers: corsHeaders,
          });
        }

        // Access is valid
        return new Response(JSON.stringify({ success: true, user: { email, uid: 'user-' + email }, expirationDate: expirationDateStr }), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (firebaseError) {
        console.error('Firebase lookup error:', firebaseError);
        return new Response(JSON.stringify({ error: 'Authentication service error', details: String(firebaseError) }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
