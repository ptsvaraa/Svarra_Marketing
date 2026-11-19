/**
 * Razorpay for the controllers: the few REST calls we need, and signature checks.
 * Configured by RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (see src/config/env.ts).
 * API reference: https://razorpay.com/docs/api/
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

const API = 'https://api.razorpay.com/v1';

/** Order notes: Razorpay allows up to 15 keys of up to 256 characters each. */
export type RazorpayNotes = Record<string, string>;

export interface RazorpayOrder {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string | null;
  status: 'created' | 'attempted' | 'paid';
  notes: RazorpayNotes | [];
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method: string;
  email: string | null;
  contact: string | null;
  error_description: string | null;
  notes: RazorpayNotes | [];
}

export interface RazorpayRefund {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'failed';
  notes: RazorpayNotes | [];
}

/** An error reply from the Razorpay API. */
export class RazorpayError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface RazorpayClient {
  keyId: string;
  createOrder(order: { amount: number; currency: string; receipt: string; notes: RazorpayNotes }): Promise<RazorpayOrder>;
  fetchOrder(id: string): Promise<RazorpayOrder>;
  fetchPayment(id: string): Promise<RazorpayPayment>;
  capturePayment(id: string, amount: number, currency: string): Promise<RazorpayPayment>;
}

/** The Razorpay client, or null until both API keys are configured. */
export function getRazorpay(): RazorpayClient | null {
  const keyId = env.razorpayKeyId;
  const secret = env.razorpayKeySecret;
  if (!keyId || !secret) return null;
  const auth = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

  async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: auth, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as { error?: { description?: string } } | null;
    if (!res.ok) throw new RazorpayError(res.status, data?.error?.description ?? `Razorpay ${method} ${path} failed (${res.status})`);
    return data as T;
  }

  return {
    keyId,
    createOrder: (order) => call('POST', '/orders', { ...order, partial_payment: false }),
    fetchOrder: (id) => call('GET', `/orders/${encodeURIComponent(id)}`),
    fetchPayment: (id) => call('GET', `/payments/${encodeURIComponent(id)}`),
    capturePayment: (id, amount, currency) => call('POST', `/payments/${encodeURIComponent(id)}/capture`, { amount, currency }),
  };
}

/** Constant-time check that `signature` is the hex HMAC-SHA256 of `message` under `secret`. */
function hmacMatches(message: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(message).digest();
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Checks the signature Razorpay Checkout returns after a payment: HMAC of "order_id|payment_id" with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = env.razorpayKeySecret;
  return !!secret && hmacMatches(`${orderId}|${paymentId}`, signature, secret);
}

/** Checks a webhook's X-Razorpay-Signature: HMAC of the raw body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = env.razorpayWebhookSecret;
  return !!secret && hmacMatches(rawBody, signature, secret);
}

/** Order notes as a plain object (Razorpay returns [] when there are none). */
export const notesOf = (notes: RazorpayNotes | [] | undefined): RazorpayNotes => (Array.isArray(notes) ? {} : (notes ?? {}));
