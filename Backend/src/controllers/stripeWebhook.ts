/**
 * POST /api/stripe-webhook
 * Stripe calls this when a payment's state changes. The signature is verified,
 * so only genuine Stripe events are trusted. The webhook, not the success page,
 * is what marks an order as reserved in the database: buyers can close the tab
 * before returning, but Stripe keeps retrying the webhook until it gets a 2xx reply.
 * Every event is logged in webhook_events and handled at most once.
 *
 * In the Stripe dashboard, add an endpoint for https://<your-backend>/api/stripe-webhook
 * with these events, then copy its signing secret into STRIPE_WEBHOOK_SECRET:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 *   refund.created
 *   refund.updated
 *   refund.failed
 */
import type Stripe from 'stripe';
import { env } from '../config/env.js';
import { getDb } from '../services/db.js';
import {
  beginWebhookEvent,
  buildPreorder,
  createPreorder,
  finishWebhookEvent,
  markPaymentSucceeded,
  markPaymentUnpaid,
  recordRefund,
} from '../services/orders.js';
import { getStripe } from '../services/stripe.js';
import type { PreorderDetails } from '../shared/preorderValidation.js';
import { json } from '../utils/http.js';

type Db = NonNullable<ReturnType<typeof getDb>>;

/** The form details, read back from the metadata createCheckoutSession put on the session. */
function detailsFromMetadata(session: Stripe.Checkout.Session): PreorderDetails {
  const m = session.metadata ?? {};
  return {
    buyerType: m.buyer_type === 'business' ? 'business' : 'individual',
    organisation: m.organisation ?? '',
    gstin: m.gstin ?? '',
    fullName: m.full_name || session.customer_details?.name || 'Unknown',
    phone: m.phone || session.customer_details?.phone || '',
    email: m.email || session.customer_details?.email || session.customer_email || 'unknown',
    addressLine1: m.address_line1 || 'unknown',
    addressLine2: m.address_line2 ?? '',
    city: m.city || 'unknown',
    state: m.state || 'unknown',
    pincode: m.pincode || 'unknown',
    quantity: Number(m.quantity) > 0 ? Number(m.quantity) : 1,
    wearer: m.wearer ?? '',
    consent: m.contact_consent === 'yes',
  };
}

/**
 * Marks the order reserved. Safe to call repeatedly for the same session: only
 * the first call changes anything. Returns true the first time.
 */
async function markPaid(db: Db, session: Stripe.Checkout.Session): Promise<boolean> {
  const result = await markPaymentSucceeded(db, session);
  if (result !== 'not_found') return result === 'paid_now';

  // No order for this session (e.g. it was paid before the database existed).
  // Rebuild it from the Stripe metadata so a paid order is never lost.
  const reference = session.metadata?.reference ?? session.client_reference_id ?? `STRIPE-${session.id.slice(-10)}`;
  await createPreorder(db, buildPreorder(detailsFromMetadata(session), reference, session.id));
  console.warn('[webhook] Paid session had no order; rebuilt it from metadata', session.id);
  return (await markPaymentSucceeded(db, session)) === 'paid_now';
}

/** Optional copy of each new paid reservation to RESERVATIONS_WEBHOOK_URL (Google Sheet, CRM…). Best effort. */
async function forwardReservation(session: Stripe.Checkout.Session) {
  const target = env.reservationsWebhookUrl;
  if (!target) return;
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...session.metadata,
        stripe_session_id: session.id,
        amount_paid: session.amount_total == null ? null : session.amount_total / 100,
        currency: session.currency,
        paid_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // The database already has the order, so a failed copy is logged rather than retried.
    console.error('[webhook] Could not forward reservation', session.id, err);
  }
}

async function handleEvent(db: Db, event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      // 'unpaid' here means a delayed payment method; async_payment_succeeded/failed follows later.
      if (session.payment_status === 'paid' && (await markPaid(db, session))) {
        console.info('[order] Reserved', session.metadata?.reference ?? session.id);
        await forwardReservation(session);
      }
      break;
    }
    case 'checkout.session.async_payment_failed':
      await markPaymentUnpaid(db, event.data.object.id, 'failed', 'async payment failed');
      break;
    case 'checkout.session.expired':
      await markPaymentUnpaid(db, event.data.object.id, 'expired');
      break;
    case 'refund.created':
    case 'refund.updated':
    case 'refund.failed':
      // Refunds of payments that aren't pre-orders (other products on the account) are ignored.
      if ((await recordRefund(db, event.data.object)) === 'not_found') {
        console.warn('[webhook] Refund for a payment with no order', event.data.object.id);
      }
      break;
  }
}

export async function handleStripeWebhook(request: Request): Promise<Response> {
  const stripe = getStripe();
  const db = getDb();
  const secret = env.stripeWebhookSecret;
  if (!stripe || !db || !secret) return json({ error: 'Webhook not configured.' }, 503);

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

  try {
    if (!(await beginWebhookEvent(db, event))) return json({ received: true, duplicate: true });
    await handleEvent(db, event);
    await finishWebhookEvent(db, event.id);
  } catch (err) {
    // A non-2xx reply makes Stripe retry the event later, so a database hiccup doesn't lose it.
    console.error('[webhook] Could not handle event', event.type, event.id, err);
    await finishWebhookEvent(db, event.id, err);
    return json({ error: 'Could not record the event.' }, 500);
  }

  return json({ received: true });
}
