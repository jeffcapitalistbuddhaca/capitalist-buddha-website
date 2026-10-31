import { generateSignedUrl } from '../../src/lib/r2-signed-urls';

export const onRequest: PagesFunction = async (context) => {
  try {
    const { videoPaths } = await context.request.json();

    if (!Array.isArray(videoPaths)) {
      return new Response(JSON.stringify({ error: 'videoPaths must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const signedUrls: Record<string, string> = {};

    for (const videoPath of videoPaths) {
      try {
        signedUrls[videoPath] = await generateSignedUrl(videoPath);
      } catch (error) {
        console.error(`Failed to generate URL for ${videoPath}:`, error);
        signedUrls[videoPath] = '';
      }
    }

    return new Response(JSON.stringify({ signedUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
