/**
 * Browser side of the pre-order flow. Payment is taken in Razorpay Checkout, which
 * opens over the page: the backend (Backend/) creates the Razorpay order and checks
 * the payment afterwards, so the key secret never reaches the browser.
 */
import type { Currency } from '../data/preorder';
import { API_URL } from './api';
import type { PreorderDetails } from './preorderValidation';

export { normalisePhone, validatePreorder, type PreorderDetails, type PreorderErrors } from './preorderValidation';


const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Thrown when payments aren't connected yet (no keys, or the backend isn't running). */
export class PreorderUnavailableError extends Error {}

/** Thrown when the buyer closes the Razorpay window without paying. */
export class CheckoutCancelledError extends Error {}

export interface CheckoutResult {
  paid: boolean;
  reference: string | null;
  email: string | null;
  /** Amount paid, in whole rupees or dollars. */
  amount: number | null;
  currency: Currency | null;
}

/** What /api/create-order returns: everything Razorpay Checkout needs. */
interface CreatedOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  reference: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
}

/** What Razorpay Checkout hands back after a successful payment. */
interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptLoad: Promise<void> | null = null;

/** Loads Razorpay's Checkout script once, on first use. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptLoad ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CHECKOUT_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptLoad = null;
      s.remove();
      reject(new Error('Could not load Razorpay Checkout'));
    };
    document.head.appendChild(s);
  });
  return scriptLoad;
}

async function post<T>(path: string, body: unknown): Promise<{ res: Response; data: T | null }> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error');
  }
  return { res, data: (await res.json().catch(() => null)) as T | null };
}

/** Asks our server to check the payment's signature with Razorpay and record the reservation. */
async function verifyPayment(payment: RazorpaySuccess): Promise<CheckoutResult> {
  const { res, data } = await post<CheckoutResult>('/api/verify-payment', payment);
  if (!res.ok || !data) throw new Error(`Could not confirm payment (${res.status})`);
  return data;
}

/**
 * Creates the Razorpay order, opens Razorpay Checkout over the page and resolves once the
 * payment is confirmed by our server. `onVerifying` fires while that confirmation runs.
 * Rejects with CheckoutCancelledError if the buyer closes the window without paying.
 */
export async function startCheckout(
  details: PreorderDetails,
  currency: Currency,
  onVerifying?: () => void,
): Promise<CheckoutResult> {
  const [{ res, data: order }] = await Promise.all([
    post<CreatedOrder & { error?: string }>('/api/create-order', { ...details, currency }),
    // Fetch the Checkout script at the same time; a failure here surfaces when it's needed.
    loadCheckout().catch(() => undefined),
  ]);
  // 503: keys not set yet. 404/405: no API at that address.
  if (res.status === 503 || res.status === 404 || res.status === 405) {
    throw new PreorderUnavailableError(`Checkout unavailable (${res.status})`);
  }
  if (!res.ok || !order?.orderId) throw new Error(order?.error ?? `Checkout failed (${res.status})`);

  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Razorpay Checkout is unavailable');

  return new Promise<CheckoutResult>((resolve, reject) => {
    let settled = false;
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: order.prefill,
      notes: { reference: order.reference },
      theme: { color: '#c9962f' },
      handler: (payment: RazorpaySuccess) => {
        settled = true;
        onVerifying?.();
        verifyPayment(payment).then(resolve, reject);
      },
      modal: {
        // Closing the window without paying. Failed attempts stay inside it, where the buyer can retry.
        ondismiss: () => {
          if (!settled) reject(new CheckoutCancelledError('Checkout closed'));
        },
      },
    });
    rzp.on('payment.failed', (r) => console.warn('[checkout] Payment attempt failed', r.error?.description));
    rzp.open();
  });
}
