const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function generateSignedUrl(videoPath: string, env: any): Promise<string> {
  const r2Endpoint = 'https://pub-bba51804cea9490d86d3f69e92387c34.r2.dev';
  const r2AccessKey = env?.R2_ACCESS_KEY || '';
  const r2SecretKey = env?.R2_SECRET_ACCESS_KEY || '';

  if (!r2AccessKey || !r2SecretKey) {
    throw new Error('R2 credentials not configured');
  }

  const expirySeconds = 604800;
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const datestamp = amzDate.slice(0, 8);

  const canonicalRequest = `GET\n/${videoPath}\n\nhost:${new URL(r2Endpoint).hostname}\nx-amz-date:${amzDate}\n\nhost;x-amz-date\nUNSIGNED-PAYLOAD`;

  const credentialScope = `${datestamp}/auto/s3/aws4_request`;

  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  const kDate = await hmac(r2SecretKey, datestamp);
  const kRegion = await hmac(kDate, 'auto');
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = await hmac(kSigning, stringToSign);

  const authHeader = `AWS4-HMAC-SHA256 Credential=${r2AccessKey}/${credentialScope}, SignedHeaders=host;x-amz-date, Signature=${signature}`;

  return `${r2Endpoint}/${videoPath}?X-Amz-Date=${amzDate}&X-Amz-Expires=${expirySeconds}`;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: string | ArrayBuffer, message: string): Promise<string> {
  const keyBuffer = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const msgBuffer = new TextEncoder().encode(message);
  const hmacKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', hmacKey, msgBuffer);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
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
        signedUrls[videoPath] = await generateSignedUrl(videoPath, context.env);
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
