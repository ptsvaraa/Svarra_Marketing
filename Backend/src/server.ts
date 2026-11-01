/**
 * Standalone Node server for the API: `npm run dev` locally, or `npm start` on any
 * Node host. On Vercel the same handlers run as functions from api/ instead.
 */
import { createServer, type IncomingMessage } from 'node:http';
import { env } from './config/env.js';
import { route } from './routes/index.js';

/** Turns Node's request into a standard Request, keeping the raw body (Stripe signs it). */
async function toRequest(req: IncomingMessage): Promise<Request> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${env.port}`}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(name, v));
    else if (value !== undefined) headers.set(name, value);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && chunks.length > 0;
  return new Request(url, { method: req.method, headers, body: hasBody ? new Uint8Array(Buffer.concat(chunks)) : undefined });
}

const server = createServer(async (req, res) => {
  try {
    const response = await route(await toRequest(req));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error('[server] Unhandled error', req.method, req.url, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Something went wrong.' }));
  }
});

server.listen(env.port, () => {
  console.info(`Svaraa API listening on http://localhost:${env.port}`);
  console.info(
    `Stripe ${env.stripeSecretKey ? 'configured' : 'not configured'} · ` +
      `database ${env.supabaseUrl && env.supabaseServiceRoleKey ? 'configured' : 'not configured'} · ` +
      `allowed origins: ${env.allowedOrigins.join(', ') || 'none'}`,
  );
});
