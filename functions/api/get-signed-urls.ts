import { generateSignedUrl } from '../../src/lib/r2-signed-urls';

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
    const { videoPaths } = await context.request.json();

    if (!Array.isArray(videoPaths)) {
      return new Response(JSON.stringify({ error: 'videoPaths must be an array' }), {
        status: 400,
        headers: corsHeaders,
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
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
