import { generateSignedUrl } from '../lib/r2-signed-urls';
import { getFirebaseUser } from '../lib/firebase';

export async function getSignedUrls(request: Request): Promise<Response> {
  try {
    const { email, videoPaths } = await request.json();

    if (!email || !Array.isArray(videoPaths)) {
      return new Response(JSON.stringify({ error: 'Email and videoPaths array required' }), {
        status: 400,
      });
    }

    const user = await getFirebaseUser(email);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
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

    const signedUrls = videoPaths.map((path: string) => ({
      path,
      url: generateSignedUrl(path, 7 * 24 * 60 * 60),
    }));

    return new Response(JSON.stringify({ success: true, signedUrls }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
