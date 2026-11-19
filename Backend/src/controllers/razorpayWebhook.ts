/**
 * POST /api/razorpay-webhook
 * Razorpay calls this when a payment or refund changes. The X-Razorpay-Signature header
 * is checked against the raw body, so only genuine Razorpay events are trusted. With
 * /api/verify-payment this records every reservation even if the buyer closes the tab
 * before the browser reports back: Razorpay retries the webhook until it gets a 2xx reply.
 * Every event is logged in webhook_events and handled at most once.
 *
 * In the Razorpay dashboard (Accounts & Settings → Webhooks), add
 * https://<your-backend>/api/razorpay-webhook with a secret of your choice, copy that
 * secret into RAZORPAY_WEBHOOK_SECRET, and tick these events:
 *   payment.captured
 *   payment.failed
 *   order.paid
 *   refund.created
 *   refund.processed
 *   refund.failed
 */
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { getDb } from '../services/db.js';
import { beginWebhookEvent, finishWebhookEvent, markPaymentFailed, recordRefund } from '../services/orders.js';
import {
  getRazorpay,
  verifyWebhookSignature,
  type RazorpayClient,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpayRefund,
} from '../services/razorpay.js';
import { forwardReservation, recordCapturedPayment } from '../services/reservations.js';
import { json } from '../utils/http.js';

type Db = NonNullable<ReturnType<typeof getDb>>;

/** The parts of a webhook body we read. */
interface WebhookBody {
  event: string;
  payload: {
    payment?: { entity: RazorpayPayment };
    order?: { entity: RazorpayOrder };
    refund?: { entity: RazorpayRefund };
  };
}

async function onCaptured(db: Db, razorpay: RazorpayClient, payment: RazorpayPayment, order?: RazorpayOrder) {
  if (payment.status !== 'captured' || !payment.order_id) return;
  const fullOrder = order ?? (await razorpay.fetchOrder(payment.order_id));
  if (await recordCapturedPayment(db, fullOrder, payment)) {
    console.info('[order] Reserved', fullOrder.receipt ?? fullOrder.id);
    await forwardReservation(fullOrder, payment);
  }
}

async function handleEvent(db: Db, razorpay: RazorpayClient, body: WebhookBody) {
  const payment = body.payload.payment?.entity;
  switch (body.event) {
    case 'payment.captured':
      if (payment) await onCaptured(db, razorpay, payment);
      break;
    case 'order.paid':
      if (payment) await onCaptured(db, razorpay, payment, body.payload.order?.entity);
      break;
    case 'payment.failed':
      // The buyer can retry in the same Checkout window; a later success marks the order reserved again.
      if (payment?.order_id) await markPaymentFailed(db, payment.order_id, payment.error_description);
      break;
    case 'refund.created':
    case 'refund.processed':
    case 'refund.failed': {
      const refund = body.payload.refund?.entity;
      if (!refund) break;
      const result = await recordRefund(db, {
        razorpayPaymentId: refund.payment_id,
        refundId: refund.id,
        status: refund.status,
        amountMinor: refund.amount,
        currency: refund.currency,
      });
      // Refunds of payments that aren't pre-orders (other products on the account) are ignored.
      if (result === 'not_found') console.warn('[webhook] Refund for a payment with no order', refund.id);
      break;
    }
  }
}

export async function handleRazorpayWebhook(request: Request): Promise<Response> {
  const razorpay = getRazorpay();
  const db = getDb();
  if (!razorpay || !db || !env.razorpayWebhookSecret) return json({ error: 'Webhook not configured.' }, 503);

  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) return json({ error: 'Missing signature.' }, 400);

  // The raw body is needed to verify Razorpay's signature.
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, signature)) {
    console.warn('[webhook] Signature check failed');
    return json({ error: 'Invalid signature.' }, 400);
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return json({ error: 'Invalid body.' }, 400);
  }
  // Razorpay sends the same event id on every retry; fall back to a hash of the body.
  const id = request.headers.get('x-razorpay-event-id') ?? `sha256:${createHash('sha256').update(raw).digest('hex')}`;
  const event = { id, type: body.event, livemode: env.razorpayLive, payload: body };

  try {
    if (!(await beginWebhookEvent(db, event))) return json({ received: true, duplicate: true });
    await handleEvent(db, razorpay, body);
    await finishWebhookEvent(db, id);
  } catch (err) {
    // A non-2xx reply makes Razorpay retry the event later, so a database hiccup doesn't lose it.
    console.error('[webhook] Could not handle event', body.event, id, err);
    await finishWebhookEvent(db, id, err);
    return json({ error: 'Could not record the event.' }, 500);
  }

  return json({ received: true });
}
