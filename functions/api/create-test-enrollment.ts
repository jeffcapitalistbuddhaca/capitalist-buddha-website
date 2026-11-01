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

  const serviceAccount = {
    type: 'service_account',
    project_id: (context.env as any)?.['FIREBASE_PROJECT_ID_CORRECT'],
    private_key_id: 'key-id',
    private_key: (context.env as any)?.['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
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
    const { email, password = 'testpass123', expiredNow = false } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID_CORRECT'];
    const privateKey = (context.env as any)?.['FIREBASE_PRIVATE_KEY'];
    const clientEmail = (context.env as any)?.['FIREBASE_CLIENT_EMAIL'];

    if (!firebaseProject || !privateKey || !clientEmail) {
      return new Response(JSON.stringify({ error: 'Firebase service account not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    try {
      const database = initializeFirebase(context);

      // Create enrollment date
      const enrollmentDate = new Date();

      // Set expiration date - either yesterday (if expiredNow=true) or 180 days from now
      const expirationDate = new Date();
      if (expiredNow) {
        expirationDate.setDate(expirationDate.getDate() - 1);
      } else {
        expirationDate.setDate(expirationDate.getDate() + 180);
      }

      // Create document in Firestore
      const enrollmentsRef = database.collection('enrollments');
      const docId = `test_${email.split('@')[0]}_${Date.now()}`;

      await enrollmentsRef.doc(docId).set({
        email: email,
        enrollmentDate: enrollmentDate,
        expirationDate: expirationDate,
        transactionId: `test_${Date.now()}`,
        transactionType: 'test_enrollment',
        password: password,
      });

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
    } catch (firebaseError) {
      console.error('Firebase creation error:', firebaseError);
      return new Response(JSON.stringify({ error: 'Firebase creation failed', details: String(firebaseError) }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  } catch (error) {
    console.error('Create test enrollment error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
