/** Stripe client for the controllers. Configured by STRIPE_SECRET_KEY (see src/config/env.ts). */
import Stripe from 'stripe';
import { env } from '../config/env.js';

let client: Stripe | null = null;

/** The Stripe client, or null until STRIPE_SECRET_KEY is configured. */
export function getStripe(): Stripe | null {
  const key = env.stripeSecretKey;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}
