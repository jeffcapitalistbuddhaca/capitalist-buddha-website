import * as crypto from 'crypto';

const R2_ENDPOINT = 'https://f23e301eee8ef9bc8625e93b7b5ba58a.r2.cloudflarestorage.com';
const R2_BUCKET = 'consciousbusinesscourse';
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

export function generateSignedUrl(filePath: string, expiresIn: number): string {
  const bucket = R2_BUCKET;
  const key = filePath;
  const accessKeyId = R2_ACCESS_KEY;
  const secretAccessKey = R2_SECRET_KEY;

  const date = new Date();
  const amzdate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const datestamp = amzdate.slice(0, 8);

  const credentialScope = `${datestamp}/auto/s3/aws4_request`;
  const algorithm = 'AWS4-HMAC-SHA256';

  const canonicalQueryString = `X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(
    accessKeyId + '/' + credentialScope
  )}&X-Amz-Date=${amzdate}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host`;

  const canonicalRequest = `GET\n/${key}\n${canonicalQueryString}\nhost:${R2_ENDPOINT.replace(
    'https://',
    ''
  )}\n\nhost\nUNSIGNED-PAYLOAD`;

  const canonicalRequestHash = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex');

  const stringToSign = `${algorithm}\n${amzdate}\n${credentialScope}\n${canonicalRequestHash}`;

  const signature = crypto
    .createHmac('sha256', createSignatureKey(secretAccessKey, datestamp))
    .update(stringToSign)
    .digest('hex');

  return `${R2_ENDPOINT}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

function createSignatureKey(key: string, datestamp: string): Buffer {
  const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(datestamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update('auto').digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
  return crypto.createHmac('sha256', kService).update('aws4_request').digest();
}
