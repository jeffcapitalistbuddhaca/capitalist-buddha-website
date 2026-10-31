const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Max-Age': '86400',
};

export async function onRequest(context: any): Promise<Response> {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(context.request.url);
    const videoPath = url.searchParams.get('path');

    if (!videoPath) {
      return new Response(JSON.stringify({ error: 'path parameter required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const r2Url = `https://pub-bba51804cea9490d86d3f69e92387c34.r2.dev/${videoPath}`;
    const r2Response = await fetch(r2Url, {
      method: context.request.method,
      headers: context.request.headers,
    });

    if (!r2Response.ok) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: r2Response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = r2Response.headers.get('content-type') || 'video/mp4';
    const contentLength = r2Response.headers.get('content-length');
    const acceptRanges = r2Response.headers.get('accept-ranges');

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', contentType);
    if (contentLength) responseHeaders.set('Content-Length', contentLength);
    if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
