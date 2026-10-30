import { getFirebaseUser } from '../lib/firebase';

export async function auth(request: Request): Promise<Response> {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
      });
    }

    const user = await getFirebaseUser(email, password);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
      });
    }

    const now = new Date();
    const expirationDate = new Date(user.expirationDate);

    if (now > expirationDate) {
      return new Response(JSON.stringify({ error: 'Access expired' }), {
        status: 403,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        email: user.email,
        expirationDate: user.expirationDate,
        daysRemaining: Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
