import { Router } from 'itty-router';
import * as crypto from 'crypto';
import { auth } from './handlers/auth';
import { getSignedUrls } from './handlers/get-signed-urls';
import { createPayment } from './handlers/create-payment';
import { confirmPayment } from './handlers/confirm-payment';

const router = Router();

router.post('/api/auth', auth);
router.post('/api/get-signed-urls', getSignedUrls);
router.post('/api/create-payment', createPayment);
router.post('/api/confirm-payment', confirmPayment);

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await router.handle(request);

    // Add CORS headers to all responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  },
};
