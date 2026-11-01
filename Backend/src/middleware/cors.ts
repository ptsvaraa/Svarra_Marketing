/**
 * CORS for the browser-facing endpoints. The frontend is deployed separately, so
 * its pages call this API from another origin. Only origins listed in SITE_URL /
 * ALLOWED_ORIGINS get the CORS headers; any other site's browser calls are blocked.
 */
import { env } from '../config/env.js';

export type Handler = (request: Request) => Promise<Response>;

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin || !env.allowedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** Answers the browser's preflight (OPTIONS) request. */
export const preflight: Handler = async (request) => new Response(null, { status: 204, headers: corsHeaders(request) });

/** Adds CORS headers to a handler's response. */
export const withCors =
  (handler: Handler): Handler =>
  async (request) => {
    const response = await handler(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders(request))) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  };
