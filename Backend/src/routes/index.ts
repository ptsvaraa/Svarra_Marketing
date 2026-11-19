/**
 * Every API endpoint, with its middleware applied. Used by the standalone server
 * (src/server.ts) and by the Vercel entry points in api/, so both serve exactly
 * the same handlers.
 */
import { env } from '../config/env.js';
import { createOrder } from '../controllers/createOrder.js';
import { handleRazorpayWebhook } from '../controllers/razorpayWebhook.js';
import { verifyPayment } from '../controllers/verifyPayment.js';
import { preflight, withCors, type Handler } from '../middleware/cors.js';
import { json } from '../utils/http.js';

/** Reports which integrations are configured (never their values). */
const health: Handler = async () =>
  json({
    ok: true,
    razorpay: !!(env.razorpayKeyId && env.razorpayKeySecret),
    razorpayMode: env.razorpayKeyId ? (env.razorpayLive ? 'live' : 'test') : null,
    razorpayWebhook: !!env.razorpayWebhookSecret,
    database: !!(env.supabaseUrl && env.supabaseServiceRoleKey),
  });

/** Handlers per method for each path. Browser-facing endpoints get CORS; Razorpay's webhook is server-to-server. */
export const endpoints = {
  '/api/create-order': { POST: withCors(createOrder), OPTIONS: preflight },
  '/api/verify-payment': { POST: withCors(verifyPayment), OPTIONS: preflight },
  '/api/razorpay-webhook': { POST: handleRazorpayWebhook },
  '/api/health': { GET: withCors(health), OPTIONS: preflight },
} satisfies Record<string, Partial<Record<'GET' | 'POST' | 'OPTIONS', Handler>>>;

type Path = keyof typeof endpoints;

/** Finds and runs the handler for a request: 404 for an unknown path, 405 for a wrong method. */
export async function route(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const methods = endpoints[pathname.replace(/\/+$/, '') as Path] as Record<string, Handler> | undefined;
  if (!methods) return json({ error: 'Not found.' }, 404);
  const handler = methods[request.method];
  if (!handler) return json({ error: 'Method not allowed.' }, 405);
  return handler(request);
}
