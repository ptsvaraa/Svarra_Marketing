/**
 * Supabase (Postgres) access for the controllers.
 *
 * Environment variables (see src/config/env.ts):
 *   SUPABASE_URL               https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  the secret server key (service_role, or a new sb_secret_… key)
 *
 * The secret key bypasses Row Level Security, so it must only ever be used
 * here on the server. It is never sent to the browser.
 *
 * Tables are created by supabase/migrations/ (see services/orders.ts for how they're used).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let client: SupabaseClient | null = null;

/** The Supabase client, or null until both environment variables are configured. */
export function getDb(): SupabaseClient | null {
  const url = env.supabaseUrl;
  const key = env.supabaseServiceRoleKey;
  if (!url || !key) return null;
  // Server-side only: no session storage or token refresh needed.
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
