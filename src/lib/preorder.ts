/**
 * Browser side of the pre-order flow. Payment is taken on Stripe Checkout:
 * the server function in api/ creates the session, so the secret key never
 * reaches the browser.
 */
import type { PreorderDetails } from './preorderValidation';

export { normalisePhone, validatePreorder, type PreorderDetails, type PreorderErrors } from './preorderValidation';

/** Thrown when Stripe isn't connected yet (no keys, or no server functions running). */
export class PreorderUnavailableError extends Error {}

/** Creates a Stripe Checkout session for the reservation and returns its payment page URL. */
export async function startCheckout(details: PreorderDetails): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(details),
    });
  } catch {
    throw new Error('Network error');
  }
  // 503: keys not set yet. 404/405: the API isn't running (e.g. plain `vite` dev server).
  if (res.status === 503 || res.status === 404 || res.status === 405) {
    throw new PreorderUnavailableError(`Checkout unavailable (${res.status})`);
  }
  const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !body?.url) throw new Error(body?.error ?? `Checkout failed (${res.status})`);
  return body.url;
}

export interface CheckoutResult {
  paid: boolean;
  reference: string | null;
  email: string | null;
  amount: number | null;
}

/** Confirms with Stripe (via our server) that a returning session was actually paid. */
export async function fetchCheckoutResult(sessionId: string): Promise<CheckoutResult> {
  const res = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Could not confirm payment (${res.status})`);
  return (await res.json()) as CheckoutResult;
}

/** The form is kept for this tab only, so a cancelled payment returns to a filled-in form. */
const DRAFT_KEY = 'svaraa-preorder-draft';

export function saveDraft(details: PreorderDetails) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
  } catch {
    /* storage can be unavailable (private mode); the form just won't refill */
  }
}

export function loadDraft(): PreorderDetails | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PreorderDetails) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}
