/**
 * Every API endpoint, with its middleware applied. Used by the standalone server
 * (src/server.ts) and by the Vercel entry points in api/, so both serve exactly
 * the same handlers.
 */
import { env } from '../config/env.js';
import { getCheckoutSession } from '../controllers/checkoutSession.js';
import { createCheckoutSession } from '../controllers/createCheckoutSession.js';
import { handleStripeWebhook } from '../controllers/stripeWebhook.js';
import { preflight, withCors, type Handler } from '../middleware/cors.js';
import { json } from '../utils/http.js';

/** Reports which integrations are configured (never their values). */
const health: Handler = async () =>
  json({
    ok: true,
    stripe: !!env.stripeSecretKey,
    stripeWebhook: !!env.stripeWebhookSecret,
    database: !!(env.supabaseUrl && env.supabaseServiceRoleKey),
  });

/** Handlers per method for each path. Browser-facing endpoints get CORS; Stripe's webhook is server-to-server. */
export const endpoints = {
  '/api/create-checkout-session': { POST: withCors(createCheckoutSession), OPTIONS: preflight },
  '/api/checkout-session': { GET: withCors(getCheckoutSession), OPTIONS: preflight },
  '/api/stripe-webhook': { POST: handleStripeWebhook },
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
