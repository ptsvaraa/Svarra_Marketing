/**
 * GET /api/checkout-session?session_id=cs_…
 * Confirms with Stripe whether a returning customer actually paid, so the
 * success screen is never shown on the strength of a URL alone.
 */
import { getStripe, json } from './_stripe.js';

export async function GET(request: Request): Promise<Response> {
  const stripe = getStripe();
  if (!stripe) return json({ error: 'Payments are not configured.' }, 503);

  const id = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return json({ error: 'Invalid session.' }, 400);

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    return json({
      paid: session.payment_status === 'paid',
      reference: session.client_reference_id,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      amount: session.amount_total == null ? null : session.amount_total / 100,
    });
  } catch (err) {
    console.error('[checkout] Could not retrieve session', err);
    return json({ error: 'Session not found.' }, 404);
  }
}
