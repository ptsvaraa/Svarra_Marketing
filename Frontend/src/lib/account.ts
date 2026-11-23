/** The logged-in customer's profile and reservations, from the backend's /api/me. */
import type { Currency } from '../data/preorder';
import { API_URL } from './api';

export interface AccountOrder {
  reference: string;
  status: string;
  buyerType: 'individual' | 'business';
  quantity: number;
  currency: Currency;
  /** Whole rupees or dollars. */
  pricePerPendant: number;
  paid: number;
  refunded: number;
  createdAt: string;
  paidAt: string | null;
}

export interface Profile {
  email: string;
  fullName: string | null;
  /** E.g. +919876543210, or null if not given yet. */
  phone: string | null;
  orders: AccountOrder[];
}

export class AccountError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function call(token: string, init: RequestInit = {}): Promise<Profile> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/me`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new AccountError('We couldn’t reach the server. Check your connection and try again.', 0);
  }
  const data = (await res.json().catch(() => null)) as (Profile & { error?: string; errors?: Record<string, string> }) | null;
  if (!res.ok || !data) {
    const fallback = res.status === 404 || res.status === 503 ? 'Accounts aren’t available yet. Please try again later.' : 'Something went wrong. Please try again.';
    throw new AccountError(data?.error ?? fallback, res.status, data?.errors);
  }
  return data;
}

export const fetchProfile = (token: string) => call(token);

export const updateProfile = (token: string, details: { fullName: string; phone: string }) =>
  call(token, { method: 'PATCH', body: JSON.stringify(details) });

/** How each order status reads to the customer, and its badge tone. */
export const ORDER_STATUS: Record<string, { label: string; tone: 'success' | 'warn' | 'danger' | 'neutral' }> = {
  reserved: { label: 'Reserved', tone: 'success' },
  payment_failed: { label: 'Payment failed', tone: 'danger' },
  in_production: { label: 'In production', tone: 'neutral' },
  awaiting_balance: { label: 'Balance due', tone: 'warn' },
  ready_to_ship: { label: 'Ready to ship', tone: 'neutral' },
  shipped: { label: 'Shipped', tone: 'neutral' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};
