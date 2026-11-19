/**
 * POST /api/create-checkout-session
 * Validates the pre-order form and creates a Stripe Checkout session for the
 * reservation fee. The amount is fixed here, never taken from the browser.
 * The order is saved in Supabase as 'pending_payment' before the buyer is sent
 * to pay; the webhook marks it reserved. Delivery details also travel as session metadata,
 * so every reservation is visible in the Stripe dashboard with its address.
 */
import type Stripe from 'stripe';
import { getDb } from '../services/db.js';
import { buildPreorder, createPreorder } from '../services/orders.js';
import { getStripe } from '../services/stripe.js';
import { feeLines, feeTotal, PRODUCT_NAME } from '../shared/preorder.js';
import { makeReference, normalisePhone, validatePreorder, type PreorderDetails } from '../shared/preorderValidation.js';
import { json, siteOrigin } from '../utils/http.js';

const text = (value: unknown, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Keeps only the fields we expect, trimmed and length-limited. */
function readDetails(body: unknown): PreorderDetails | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const quantity = Number(b.quantity);
  const buyerType = b.buyerType === 'business' ? 'business' : 'individual';
  return {
    buyerType,
    organisation: buyerType === 'business' ? text(b.organisation, 160) : '',
    gstin: buyerType === 'business' ? text(b.gstin, 15).toUpperCase() : '',
    fullName: text(b.fullName, 120),
    phone: text(b.phone, 20),
    email: text(b.email, 254),
    addressLine1: text(b.addressLine1),
    addressLine2: text(b.addressLine2),
    city: text(b.city, 80),
    state: text(b.state, 80),
    pincode: text(b.pincode, 6),
    // Passed through as sent: validation rejects anything outside the allowed range rather than silently changing it.
    quantity: Number.isInteger(quantity) ? quantity : 0,
    wearer: text(b.wearer, 20),
    consent: b.consent === true,
  };
}

export async function createCheckoutSession(request: Request): Promise<Response> {
  const stripe = getStripe();
  const db = getDb();
  // Both are required: taking money without a place to record the order would lose reservations.
  if (!stripe || !db) return json({ error: 'Online reservations are not open yet.' }, 503);

  let details: PreorderDetails | null;
  try {
    details = readDetails(await request.json());
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (!details) return json({ error: 'Invalid request.' }, 400);

  const errors = validatePreorder(details);
  if (Object.keys(errors).length) return json({ error: 'Please check your details.', errors }, 422);

  const reference = makeReference();
  const lines = feeLines(details.buyerType, details.quantity);
  const totalUsd = feeTotal(lines);
  const phone = `+91${normalisePhone(details.phone)}`;
  const origin = siteOrigin(request);
  // Stripe metadata: up to 50 keys, 500 characters each.
  const metadata = {
    reference,
    buyer_type: details.buyerType,
    organisation: details.organisation,
    gstin: details.gstin,
    full_name: details.fullName,
    phone,
    email: details.email,
    address_line1: details.addressLine1,
    address_line2: details.addressLine2,
    city: details.city,
    state: details.state,
    pincode: details.pincode,
    quantity: String(details.quantity),
    total_usd: String(totalUsd),
    wearer: details.wearer,
    contact_consent: 'yes',
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Same breakdown the form shows: one line for individuals, hold fee + booking amount for businesses.
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: l.unitUsd * 100,
          product_data: { name: `${PRODUCT_NAME} · ${l.label}`, description: l.description },
        },
      })),
      customer_email: details.email,
      client_reference_id: reference,
      metadata,
      payment_intent_data: { description: `${PRODUCT_NAME} reservation ${reference}`, metadata },
      success_url: `${origin}/pre-order?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pre-order?checkout=cancelled`,
    });
    if (!session.url) throw new Error('Stripe returned no checkout URL');
  } catch (err) {
    console.error('[checkout] Could not create session', err);
    return json({ error: 'We could not start the payment. Please try again.' }, 502);
  }

  // Save the order (customer, address, items, pending payment, consent) before the
  // buyer is sent to pay. The webhook later marks it reserved, or expired.
  try {
    await createPreorder(db, buildPreorder(details, reference, session.id));
  } catch (err) {
    console.error('[checkout] Could not save order', err);
    // Close the payment page so nobody can pay for an order we failed to record.
    await stripe.checkout.sessions.expire(session.id).catch((e) => console.error('[checkout] Could not expire session', e));
    return json({ error: 'We could not start the payment. Please try again.' }, 502);
  }

  return json({ url: session.url });
}
