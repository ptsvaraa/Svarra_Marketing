/**
 * Orders in Supabase: every read and write the controllers make, through the
 * database functions in supabase/migrations/ (0002_commerce.sql, 0003_razorpay.sql).
 * Each function runs in one transaction, so an order is never half-saved, and the
 * payment ones are safe to call repeatedly for the same Razorpay order or payment.
 */
import type { MarkPaidResult, NewPreorder, RecordRefundResult } from '../models/order.js';
import { feeLines, PRICES, PRIVACY_POLICY_VERSION, PRODUCT_SKU, toMinor, type Currency } from '../shared/preorder.js';
import { normalisePhone, type PreorderDetails } from '../shared/preorderValidation.js';
import type { getDb } from './db.js';

type Db = NonNullable<ReturnType<typeof getDb>>;

/** The database row for a validated pre-order form, paid through the given Razorpay order. */
export function buildPreorder(details: PreorderDetails, reference: string, razorpayOrderId: string, currency: Currency): NewPreorder {
  return {
    reference,
    buyer_type: details.buyerType,
    quantity: details.quantity,
    wearer: details.wearer || null,
    currency,
    unit_price_minor: toMinor(PRICES[currency].preorder),
    customer: { email: details.email, full_name: details.fullName, phone: `+91${normalisePhone(details.phone)}` },
    organisation:
      details.buyerType === 'business' ? { legal_name: details.organisation, gstin: details.gstin || null } : null,
    address: {
      line1: details.addressLine1,
      line2: details.addressLine2 || null,
      city: details.city,
      state: details.state,
      postal_code: details.pincode,
      country: 'IN',
    },
    items: feeLines(details.buyerType, details.quantity, currency).map((l) => ({
      sku: PRODUCT_SKU,
      kind: l.id,
      description: l.label,
      unit_amount_minor: toMinor(l.unit),
      quantity: l.quantity,
    })),
    payment: { provider_session_id: razorpayOrderId },
    consent: {
      purpose: 'preorder_contact',
      granted: details.consent,
      policy_version: PRIVACY_POLICY_VERSION,
      source: 'preorder_form',
    },
  };
}

/** Saves a pre-order with its customer, address, items, pending payment and consent. Returns the order id. */
export async function createPreorder(db: Db, order: NewPreorder): Promise<string> {
  const { data, error } = await db.rpc('create_preorder', { p: order });
  if (error) throw error;
  return data as string;
}

/** A captured Razorpay payment, as recorded against its order. */
export interface CapturedPayment {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountMinor: number;
  currency: string;
}

/** Marks the Razorpay order's payment succeeded and its pre-order reserved. */
export async function markPaymentSucceeded(db: Db, p: CapturedPayment): Promise<MarkPaidResult> {
  const { data, error } = await db.rpc('mark_payment_succeeded', {
    p_session_id: p.razorpayOrderId,
    p_payment_intent_id: p.razorpayPaymentId,
    p_customer_id: null,
    p_amount_minor: p.amountMinor,
    p_currency: p.currency.toLowerCase(),
  });
  if (error) throw error;
  return data as MarkPaidResult;
}

/** A pending payment on this Razorpay order failed. Paid orders are never changed. */
export async function markPaymentFailed(db: Db, razorpayOrderId: string, reason?: string | null) {
  const { error } = await db.rpc('mark_payment_unpaid', {
    p_session_id: razorpayOrderId,
    p_status: 'failed',
    p_reason: reason ?? null,
  });
  if (error) throw error;
}

/** A Razorpay refund, as recorded against its payment. */
export interface RefundUpdate {
  razorpayPaymentId: string;
  refundId: string;
  /** Razorpay's refund status: pending, processed or failed. */
  status: 'pending' | 'processed' | 'failed';
  amountMinor: number;
  currency: string;
  reason?: string | null;
}

const REFUND_STATUS = { pending: 'pending', processed: 'succeeded', failed: 'failed' } as const;

/** Adds or updates a refund and recomputes the payment's and order's refunded totals. */
export async function recordRefund(db: Db, r: RefundUpdate): Promise<RecordRefundResult> {
  const { data, error } = await db.rpc('record_refund', {
    p_payment_intent_id: r.razorpayPaymentId,
    p_refund_id: r.refundId,
    p_status: REFUND_STATUS[r.status] ?? 'pending',
    p_amount_minor: r.amountMinor,
    p_currency: r.currency.toLowerCase(),
    p_reason: r.reason ?? null,
  });
  if (error) throw error;
  return data as RecordRefundResult;
}

/** A webhook event, as logged in webhook_events. */
export interface WebhookEvent {
  id: string;
  type: string;
  livemode: boolean;
  payload: unknown;
}

/** Logs a webhook event. Returns false if it was already handled, so retries do nothing twice. */
export async function beginWebhookEvent(db: Db, event: WebhookEvent): Promise<boolean> {
  const { data, error } = await db.rpc('begin_webhook_event', {
    p_id: event.id,
    p_type: event.type,
    p_livemode: event.livemode,
    p_payload: event.payload,
  });
  if (error) throw error;
  return data as boolean;
}

/** Marks a webhook event handled, or records why it failed (Razorpay will retry it). */
export async function finishWebhookEvent(db: Db, eventId: string, failure?: unknown) {
  const message = failure === undefined ? null : failure instanceof Error ? failure.message : JSON.stringify(failure);
  const { error } = await db.rpc('finish_webhook_event', { p_id: eventId, p_error: message });
  if (error) console.error('[webhook] Could not update the event log', eventId, error);
}
