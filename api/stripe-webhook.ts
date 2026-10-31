/**
 * POST /api/stripe-webhook
 * Stripe calls this when a payment completes. The signature is verified, so
 * only genuine Stripe events are trusted. Each paid reservation is logged and,
 * if RESERVATIONS_WEBHOOK_URL is set, forwarded there (e.g. a Google Sheet
 * script, a CRM, or your own API).
 *
 * In the Stripe dashboard, add an endpoint for https://<your-site>/api/stripe-webhook
 * with the events checkout.session.completed and
 * checkout.session.async_payment_succeeded, then copy its signing secret into
 * STRIPE_WEBHOOK_SECRET.
 */
import type Stripe from 'stripe';
import { getStripe, json } from './_stripe.js';

async function recordReservation(session: Stripe.Checkout.Session) {
  const reservation = {
    ...session.metadata,
    stripe_session_id: session.id,
    amount_paid: session.amount_total == null ? null : session.amount_total / 100,
    currency: session.currency,
    paid_at: new Date().toISOString(),
  };
  console.info('[reservation] Paid', reservation);

  const target = process.env.RESERVATIONS_WEBHOOK_URL;
  if (!target) return;
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  });
  if (!res.ok) throw new Error(`Forwarding failed (${res.status})`);
}

export async function POST(request: Request): Promise<Response> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return json({ error: 'Webhook not configured.' }, 503);

  const signature = request.headers.get('stripe-signature');
  if (!signature) return json({ error: 'Missing signature.' }, 400);

  let event: Stripe.Event;
  try {
    // The raw body is needed to verify Stripe's signature.
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (err) {
    console.warn('[webhook] Signature check failed', err);
    return json({ error: 'Invalid signature.' }, 400);
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      try {
        await recordReservation(session);
      } catch (err) {
        // A non-2xx reply makes Stripe retry the event later.
        console.error('[webhook] Could not record reservation', err);
        return json({ error: 'Could not record reservation.' }, 500);
      }
    }
  }

  return json({ received: true });
}
