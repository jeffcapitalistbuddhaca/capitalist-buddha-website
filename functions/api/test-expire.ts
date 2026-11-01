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

    const firebaseProject = (context.env as any)?.['FIREBASE_PROJECT_ID'] || '';
    const firebaseKey = (context.env as any)?.['FIREBASE_API_KEY'] || '';

    if (!firebaseProject || !firebaseKey) {
      return new Response(JSON.stringify({ error: 'Firebase not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Query Firebase to get enrollment record
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProject}/databases/(default)/documents/enrollments?pageSize=100&key=${firebaseKey}`;
    const firestoreResponse = await fetch(firestoreUrl);
    const firestoreData = await firestoreResponse.json() as any;

    if (!firestoreData.documents) {
      return new Response(JSON.stringify({ error: 'No enrollments found' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Find enrollment for this email
    let enrollmentDoc = null;
    let enrollmentPath = null;
    for (const doc of firestoreData.documents) {
      const fields = doc.fields;
      if (fields.email?.stringValue === email) {
        enrollmentDoc = doc;
        enrollmentPath = doc.name;
        break;
      }
    }

    if (!enrollmentDoc) {
      return new Response(JSON.stringify({ error: 'No enrollment found for this email' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Set expiration date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const updateData = {
      fields: {
        ...enrollmentDoc.fields,
        expirationDate: { stringValue: yesterday.toISOString() },
      },
    };

    const updateResponse = await fetch(`${enrollmentPath}?updateMask.fieldPaths=expirationDate&key=${firebaseKey}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return new Response(JSON.stringify({ error: 'Firebase update failed', details: error }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enrollment for ${email} has been expired (set to yesterday: ${yesterday.toISOString()})`,
        testInstruction: 'Try to log in - you should get "access expired" error',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Test expire error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
