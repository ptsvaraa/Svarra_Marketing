/**
 * Shared helpers for the Stripe server functions. Files starting with "_" are
 * not deployed as routes on Vercel.
 *
 * Environment variables (set in Vercel → Project → Settings → Environment Variables):
 *   STRIPE_SECRET_KEY        sk_test_… / sk_live_…   required to take payments
 *   STRIPE_WEBHOOK_SECRET    whsec_…                 required for the webhook
 *   RESERVATIONS_WEBHOOK_URL https://…               optional: paid reservations are POSTed here
 *   SITE_URL                 https://svaraa.ai       optional: base for Stripe's return links
 */
import Stripe from 'stripe';

let client: Stripe | null = null;

/** The Stripe client, or null until STRIPE_SECRET_KEY is configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** Where Stripe sends the customer back to. Prefer the configured site URL over request headers. */
export function siteOrigin(request: Request): string {
  const configured = process.env.SITE_URL?.replace(/\/+$/, '');
  return configured || new URL(request.url).origin;
}
