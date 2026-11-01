/**
 * Every environment variable the backend reads, in one place.
 *
 * Locally they come from Backend/.env (loaded by the npm scripts); in production,
 * from the host's settings (e.g. Vercel → Project → Settings → Environment Variables).
 * See .env.example for what each one is. Values are read on each access, so a
 * missing key shows up as "not configured" rather than crashing at startup.
 */
const trimSlash = (value: string) => value.trim().replace(/\/+$/, '');

export const env = {
  /** Port for the standalone server (`npm run dev` / `npm start`). */
  get port() {
    return Number(process.env.PORT) || 3001;
  },
  /** sk_test_… / sk_live_…: required to take payments. */
  get stripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY || undefined;
  },
  /** whsec_…: required for the Stripe webhook. */
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || undefined;
  },
  /** Optional: paid reservations are also POSTed here. */
  get reservationsWebhookUrl() {
    return process.env.RESERVATIONS_WEBHOOK_URL || undefined;
  },
  /** The frontend's public address, e.g. https://svaraa.ai. Base for Stripe's return links. */
  get siteUrl() {
    return trimSlash(process.env.SITE_URL ?? '') || undefined;
  },
  get supabaseUrl() {
    return process.env.SUPABASE_URL || undefined;
  },
  /** Secret server key: bypasses Row Level Security, so it never leaves the backend. */
  get supabaseServiceRoleKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
  },
  /** Frontend origins allowed to call the API from the browser: SITE_URL plus ALLOWED_ORIGINS (comma-separated). */
  get allowedOrigins(): string[] {
    const extra = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(trimSlash).filter(Boolean);
    return [...new Set([this.siteUrl, ...extra].filter((o): o is string => !!o))];
  },
};
