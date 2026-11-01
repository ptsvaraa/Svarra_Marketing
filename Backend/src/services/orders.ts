/**
 * Orders in Supabase: every read and write the controllers make, through the
 * database functions in supabase/migrations/0002_commerce.sql. Each function
 * runs in one transaction, so an order is never half-saved, and the payment
 * ones are safe to call repeatedly for the same Stripe object.
 */
import type Stripe from 'stripe';
import type { MarkPaidResult, NewPreorder, RecordRefundResult } from '../models/order.js';
import { feeLines, PREORDER_PRICE_USD, PRIVACY_POLICY_VERSION, PRODUCT_SKU } from '../shared/preorder.js';
import { normalisePhone, type PreorderDetails } from '../shared/preorderValidation.js';
import type { getDb } from './db.js';

type Db = NonNullable<ReturnType<typeof getDb>>;

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === 'string' ? value : (value?.id ?? null));

/** The database row for a validated pre-order form, charged through the given Checkout session. */
export function buildPreorder(details: PreorderDetails, reference: string, sessionId: string): NewPreorder {
  return {
    reference,
    buyer_type: details.buyerType,
    quantity: details.quantity,
    wearer: details.wearer || null,
    currency: 'usd',
    unit_price_minor: PREORDER_PRICE_USD * 100,
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
    items: feeLines(details.buyerType, details.quantity).map((l) => ({
      sku: PRODUCT_SKU,
      kind: l.id,
      description: l.label,
      unit_amount_minor: l.unitUsd * 100,
      quantity: l.quantity,
    })),
    payment: { provider_session_id: sessionId },
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

/** Marks a Checkout session's payment succeeded and its order reserved. */
export async function markPaymentSucceeded(db: Db, session: Stripe.Checkout.Session): Promise<MarkPaidResult> {
  const { data, error } = await db.rpc('mark_payment_succeeded', {
    p_session_id: session.id,
    p_payment_intent_id: idOf(session.payment_intent),
    p_customer_id: idOf(session.customer),
    p_amount_minor: session.amount_total ?? 0,
    p_currency: session.currency ?? 'usd',
  });
  if (error) throw error;
  return data as MarkPaidResult;
}

/** A pending payment failed or its checkout expired. Paid orders are never changed. */
export async function markPaymentUnpaid(db: Db, sessionId: string, status: 'failed' | 'expired', reason?: string) {
  const { error } = await db.rpc('mark_payment_unpaid', { p_session_id: sessionId, p_status: status, p_reason: reason ?? null });
  if (error) throw error;
}

/** Adds or updates a refund and recomputes the payment's and order's refunded totals. */
export async function recordRefund(db: Db, refund: Stripe.Refund): Promise<RecordRefundResult> {
  const paymentIntent = idOf(refund.payment_intent);
  if (!paymentIntent) return 'not_found';
  const { data, error } = await db.rpc('record_refund', {
    p_payment_intent_id: paymentIntent,
    p_refund_id: refund.id,
    p_status: refund.status ?? 'pending',
    p_amount_minor: refund.amount,
    p_currency: refund.currency,
    p_reason: refund.reason ?? null,
  });
  if (error) throw error;
  return data as RecordRefundResult;
}

/** Logs a webhook event. Returns false if it was already handled, so retries do nothing twice. */
export async function beginWebhookEvent(db: Db, event: Stripe.Event): Promise<boolean> {
  const { data, error } = await db.rpc('begin_webhook_event', {
    p_id: event.id,
    p_type: event.type,
    p_livemode: event.livemode,
    p_payload: event,
  });
  if (error) throw error;
  return data as boolean;
}

/** Marks a webhook event handled, or records why it failed (Stripe will retry it). */
export async function finishWebhookEvent(db: Db, eventId: string, failure?: unknown) {
  const message = failure === undefined ? null : failure instanceof Error ? failure.message : JSON.stringify(failure);
  const { error } = await db.rpc('finish_webhook_event', { p_id: eventId, p_error: message });
  if (error) console.error('[webhook] Could not update the event log', eventId, error);
}
