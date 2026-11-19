/**
 * POST /api/create-order
 * Validates the pre-order form and creates a Razorpay order for the reservation fee,
 * in rupees or US dollars as the buyer chose. The amount is fixed here, never taken
 * from the browser. The pre-order is saved in Supabase as 'pending_payment' before the
 * buyer pays; /api/verify-payment or the webhook marks it reserved. The browser opens
 * Razorpay Checkout with the details returned here.
 */
import { getDb } from '../services/db.js';
import { buildPreorder, createPreorder } from '../services/orders.js';
import { getRazorpay, type RazorpayOrder } from '../services/razorpay.js';
import { notesFromDetails } from '../services/reservations.js';
import { CURRENCIES, feeLines, feeTotal, PRODUCT_NAME, toMinor, type Currency } from '../shared/preorder.js';
import { makeReference, normalisePhone, validatePreorder, type PreorderDetails } from '../shared/preorderValidation.js';
import { json } from '../utils/http.js';

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

const readCurrency = (value: unknown): Currency | null =>
  (CURRENCIES as readonly unknown[]).includes(value) ? (value as Currency) : null;

export async function createOrder(request: Request): Promise<Response> {
  const razorpay = getRazorpay();
  const db = getDb();
  // Both are required: taking money without a place to record the order would lose reservations.
  if (!razorpay || !db) return json({ error: 'Online reservations are not open yet.' }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const details = readDetails(body);
  const currency = readCurrency((body as Record<string, unknown> | null)?.currency);
  if (!details) return json({ error: 'Invalid request.' }, 400);
  if (!currency) return json({ error: 'Choose to pay in rupees or US dollars.' }, 422);

  const errors = validatePreorder(details);
  if (Object.keys(errors).length) return json({ error: 'Please check your details.', errors }, 422);

  const reference = makeReference();
  const total = feeTotal(feeLines(details.buyerType, details.quantity, currency));

  let order: RazorpayOrder;
  try {
    order = await razorpay.createOrder({
      amount: toMinor(total),
      currency: currency.toUpperCase(),
      receipt: reference,
      notes: notesFromDetails(details, reference),
    });
  } catch (err) {
    console.error('[order] Could not create Razorpay order', err);
    return json({ error: 'We could not start the payment. Please try again.' }, 502);
  }

  // Save the pre-order (customer, address, items, pending payment, consent) before the
  // buyer pays. If this fails, the Razorpay order is never handed to the browser, so
  // nobody can pay for an order we failed to record.
  try {
    await createPreorder(db, buildPreorder(details, reference, order.id, currency));
  } catch (err) {
    console.error('[order] Could not save pre-order', err);
    return json({ error: 'We could not start the payment. Please try again.' }, 502);
  }

  // Everything Razorpay Checkout needs. The key id is public by design; the secret never leaves the server.
  return json({
    keyId: razorpay.keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    reference,
    name: 'Svaraa',
    description: `${PRODUCT_NAME} reservation ${reference}`,
    prefill: { name: details.fullName, email: details.email, contact: `+91${normalisePhone(details.phone)}` },
  });
}
