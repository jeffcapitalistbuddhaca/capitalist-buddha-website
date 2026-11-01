import * as admin from 'firebase-admin';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

let db: any = null;

function initializeFirebase(context: any) {
  if (db) return db;

  let privateKey = (context.env as any)?.['FIREBASE_PRIVATE_KEY'] || '';

  // Handle various escaping formats
  privateKey = privateKey
    .replace(/\\n/g, '\n')           // Replace \\n with actual newlines
    .replace(/\\\\/g, '\\')          // Fix double-escaped backslashes
    .trim();

  const serviceAccount = {
    type: 'service_account',
    project_id: (context.env as any)?.['FIREBASE_PROJECT_ID_CORRECT'],
    private_key_id: 'key-id',
    private_key: privateKey,
    client_email: (context.env as any)?.['FIREBASE_CLIENT_EMAIL'],
    client_id: 'client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });

  db = admin.firestore();
  return db;
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
        const database = initializeFirebase(context);

        // Query enrollments collection for this email
        const enrollmentsRef = database.collection('enrollments');
        const snapshot = await enrollmentsRef.where('email', '==', email).get();

        if (snapshot.empty) {
          return new Response(JSON.stringify({ error: 'No enrollment found for this email' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const doc = snapshot.docs[0];
        const enrollment = doc.data();

        // Check expiration date
        const expirationDate = enrollment.expirationDate;
        if (!expirationDate) {
          return new Response(JSON.stringify({ error: 'Invalid enrollment data' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const expirationTime = expirationDate instanceof Date ? expirationDate : expirationDate.toDate?.() || new Date(expirationDate);
        const now = new Date();

        if (now > expirationTime) {
          return new Response(JSON.stringify({ error: 'Your course access has expired. Please purchase again to regain access.' }), {
            status: 403,
            headers: corsHeaders,
          });
        }

        // Access is valid
        return new Response(JSON.stringify({ success: true, user: { email, uid: 'user-' + email }, expirationDate: expirationTime.toISOString() }), {
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
