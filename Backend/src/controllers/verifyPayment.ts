/**
 * POST /api/verify-payment  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Called by the browser when Razorpay Checkout reports a payment. The signature is
 * checked with the key secret, the payment is confirmed (and captured if needed) with
 * Razorpay, and the pre-order is marked reserved. The success screen is only shown
 * when this says so, never on the browser's word alone.
 */
import { getDb } from '../services/db.js';
import { getRazorpay, notesOf, verifyPaymentSignature } from '../services/razorpay.js';
import { ensureCaptured, forwardReservation, recordCapturedPayment } from '../services/reservations.js';
import { json } from '../utils/http.js';

const ORDER_ID = /^order_[A-Za-z0-9]+$/;
const PAYMENT_ID = /^pay_[A-Za-z0-9]+$/;
const SIGNATURE = /^[a-f0-9]{64}$/;

export async function verifyPayment(request: Request): Promise<Response> {
  const razorpay = getRazorpay();
  if (!razorpay) return json({ error: 'Payments are not configured.' }, 503);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }
  const orderId = String(body?.razorpay_order_id ?? '');
  const paymentId = String(body?.razorpay_payment_id ?? '');
  const signature = String(body?.razorpay_signature ?? '');
  if (!ORDER_ID.test(orderId) || !PAYMENT_ID.test(paymentId) || !SIGNATURE.test(signature)) {
    return json({ error: 'Invalid payment details.' }, 400);
  }
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    console.warn('[verify] Signature check failed', orderId, paymentId);
    return json({ error: 'Invalid payment signature.' }, 400);
  }

  let order;
  let payment;
  try {
    [order, payment] = await Promise.all([razorpay.fetchOrder(orderId), razorpay.fetchPayment(paymentId)]);
    if (payment.order_id !== orderId) return json({ error: 'Payment does not match the order.' }, 400);
    payment = await ensureCaptured(razorpay, payment);
  } catch (err) {
    console.error('[verify] Could not confirm payment with Razorpay', orderId, paymentId, err);
    return json({ error: 'Could not confirm the payment.' }, 502);
  }

  const notes = notesOf(order.notes);
  const result = {
    paid: payment.status === 'captured',
    reference: notes.reference ?? order.receipt ?? null,
    email: notes.email ?? payment.email ?? null,
    amount: payment.amount / 100,
    currency: payment.currency.toLowerCase(),
  };
  if (!result.paid) return json(result);

  // Record it now; the webhook does the same, so if the database is briefly unavailable the
  // reservation is still recorded when Razorpay delivers the event. The buyer has paid either way.
  const db = getDb();
  if (db) {
    try {
      if (await recordCapturedPayment(db, order, payment)) {
        console.info('[order] Reserved', result.reference ?? orderId);
        await forwardReservation(order, payment);
      }
    } catch (err) {
      console.error('[verify] Paid, but could not record it yet (the webhook will retry)', orderId, err);
    }
  }
  return json(result);
}
