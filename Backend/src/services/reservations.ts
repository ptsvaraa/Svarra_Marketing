/**
 * Turning a captured Razorpay payment into a reserved pre-order. Shared by the
 * browser's verify call and the webhook, whichever arrives first; the database
 * functions make the second one a no-op.
 */
import { env } from '../config/env.js';
import type { Currency } from '../shared/preorder.js';
import type { PreorderDetails } from '../shared/preorderValidation.js';
import type { getDb } from './db.js';
import { buildPreorder, createPreorder, markPaymentSucceeded } from './orders.js';
import { notesOf, type RazorpayClient, type RazorpayNotes, type RazorpayOrder, type RazorpayPayment } from './razorpay.js';

type Db = NonNullable<ReturnType<typeof getDb>>;

/** The form details as order notes, so every reservation is readable in the Razorpay dashboard (max 15 keys). */
export function notesFromDetails(details: PreorderDetails, reference: string): RazorpayNotes {
  const cut = (s: string) => s.slice(0, 256);
  return {
    reference,
    buyer_type: details.buyerType,
    full_name: cut(details.fullName),
    email: cut(details.email),
    phone: details.phone,
    address: cut([details.addressLine1, details.addressLine2].filter(Boolean).join(', ')),
    city: cut(details.city),
    state: details.state,
    pincode: details.pincode,
    quantity: String(details.quantity),
    organisation: cut(details.organisation),
    gstin: details.gstin,
    wearer: details.wearer,
    contact_consent: details.consent ? 'yes' : 'no',
  };
}

/** The form details, read back from the notes createOrder put on the Razorpay order. */
function detailsFromNotes(notes: RazorpayNotes, payment: RazorpayPayment): PreorderDetails {
  const [line1 = 'unknown', ...rest] = (notes.address ?? '').split(', ');
  return {
    buyerType: notes.buyer_type === 'business' ? 'business' : 'individual',
    organisation: notes.organisation ?? '',
    gstin: notes.gstin ?? '',
    fullName: notes.full_name || 'Unknown',
    phone: notes.phone || payment.contact || '',
    email: notes.email || payment.email || 'unknown',
    addressLine1: line1 || 'unknown',
    addressLine2: rest.join(', '),
    city: notes.city || 'unknown',
    state: notes.state || 'unknown',
    pincode: notes.pincode || 'unknown',
    quantity: Number(notes.quantity) > 0 ? Number(notes.quantity) : 1,
    wearer: notes.wearer ?? '',
    consent: notes.contact_consent === 'yes',
  };
}

/**
 * Records a captured payment against its pre-order. Safe to call repeatedly: only the
 * first call changes anything, and it returns true. If the order is missing (e.g. paid
 * while the database was down), it is rebuilt from the Razorpay order notes, so a paid
 * reservation is never lost.
 */
export async function recordCapturedPayment(db: Db, order: RazorpayOrder, payment: RazorpayPayment): Promise<boolean> {
  const captured = {
    razorpayOrderId: order.id,
    razorpayPaymentId: payment.id,
    amountMinor: payment.amount,
    currency: payment.currency,
  };
  const result = await markPaymentSucceeded(db, captured);
  if (result !== 'not_found') return result === 'paid_now';

  const notes = notesOf(order.notes);
  const reference = notes.reference || order.receipt || `RZP-${order.id.slice(-10)}`;
  const currency = payment.currency.toLowerCase() as Currency;
  await createPreorder(db, buildPreorder(detailsFromNotes(notes, payment), reference, order.id, currency));
  console.warn('[order] Paid Razorpay order had no pre-order; rebuilt it from the notes', order.id);
  return (await markPaymentSucceeded(db, captured)) === 'paid_now';
}

/**
 * Makes sure a payment is captured. Orders are normally set to auto-capture in the Razorpay
 * dashboard; if a payment is only authorised, it is captured here so it isn't auto-refunded.
 */
export async function ensureCaptured(razorpay: RazorpayClient, payment: RazorpayPayment): Promise<RazorpayPayment> {
  if (payment.status !== 'authorized') return payment;
  return razorpay.capturePayment(payment.id, payment.amount, payment.currency);
}

/** Optional copy of each new paid reservation to RESERVATIONS_WEBHOOK_URL (Google Sheet, CRM…). Best effort. */
export async function forwardReservation(order: RazorpayOrder, payment: RazorpayPayment) {
  const target = env.reservationsWebhookUrl;
  if (!target) return;
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notesOf(order.notes),
        razorpay_order_id: order.id,
        razorpay_payment_id: payment.id,
        amount_paid: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        paid_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // The database already has the order, so a failed copy is logged rather than retried.
    console.error('[order] Could not forward reservation', order.id, err);
  }
}
