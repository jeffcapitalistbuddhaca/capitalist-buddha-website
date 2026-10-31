import { getFirebaseUser, createFirebaseEnrollment, sendConfirmationEmail } from '../../src/lib/firebase';

export const onRequest: PagesFunction = async (context) => {
  try {
    const { email, password, action, enrollmentData } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'login') {
      const user = await getFirebaseUser(email, password);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'enroll') {
      const enrollment = await createFirebaseEnrollment(enrollmentData);
      await sendConfirmationEmail(email, enrollmentData.password, enrollmentData.expirationDate);
      return new Response(JSON.stringify({ success: true, enrollment }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
