import { env } from '../config/env.js';

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/**
 * Where Stripe sends the customer back to: the frontend, not this API.
 * Prefers the configured SITE_URL, then the calling page's origin if it is an
 * allowed frontend, and only then this request's own origin.
 */
export function siteOrigin(request: Request): string {
  if (env.siteUrl) return env.siteUrl;
  const origin = request.headers.get('origin');
  if (origin && env.allowedOrigins.includes(origin)) return origin;
  return new URL(request.url).origin;
}
