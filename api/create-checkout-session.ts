/**
 * POST /api/create-checkout-session
 * Validates the pre-order form and creates a Stripe Checkout session for the
 * reservation fee. The amount is fixed here, never taken from the browser.
 * Delivery details travel as session metadata, so every paid reservation is
 * visible in the Stripe dashboard with its address.
 */
import { feeLines, feeTotal, PRODUCT_NAME } from '../src/data/preorder.js';
import { makeReference, normalisePhone, validatePreorder, type PreorderDetails } from '../src/lib/preorderValidation.js';
import { getStripe, json, siteOrigin } from './_stripe.js';

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

export async function POST(request: Request): Promise<Response> {
  const stripe = getStripe();
  if (!stripe) return json({ error: 'Online reservations are not open yet.' }, 503);

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
  const origin = siteOrigin(request);
  // Stripe metadata: up to 50 keys, 500 characters each.
  const metadata = {
    reference,
    buyer_type: details.buyerType,
    organisation: details.organisation,
    gstin: details.gstin,
    full_name: details.fullName,
    phone: `+91${normalisePhone(details.phone)}`,
    email: details.email,
    address_line1: details.addressLine1,
    address_line2: details.addressLine2,
    city: details.city,
    state: details.state,
    pincode: details.pincode,
    quantity: String(details.quantity),
    total_usd: String(feeTotal(lines)),
    wearer: details.wearer,
    contact_consent: 'yes',
  };

  try {
    const session = await stripe.checkout.sessions.create({
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
    return json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Could not create session', err);
    return json({ error: 'We could not start the payment. Please try again.' }, 502);
  }
}
