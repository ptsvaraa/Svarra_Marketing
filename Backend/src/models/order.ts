/** Shapes passed to and from the database functions in supabase/migrations/0002_commerce.sql. */

/** Argument of public.create_preorder: a whole pre-order, saved in one transaction. */
export interface NewPreorder {
  reference: string;
  buyer_type: 'individual' | 'business';
  quantity: number;
  wearer: string | null;
  currency: string;
  /** Pre-order price per pendant, as agreed at checkout. */
  unit_price_minor: number;
  metadata?: Record<string, string>;
  customer: { email: string; full_name: string; phone: string };
  organisation: { legal_name: string; gstin: string | null } | null;
  address: { line1: string; line2: string | null; city: string; state: string; postal_code: string; country: string };
  items: { sku: string; kind: 'reservation' | 'hold' | 'booking'; description: string; unit_amount_minor: number; quantity: number }[];
  /** The Stripe Checkout session that pays for it. */
  payment: { provider_session_id: string } | null;
  consent: { purpose: string; granted: boolean; policy_version: string; source: string };
}

/** Result of public.mark_payment_succeeded. */
export type MarkPaidResult = 'paid_now' | 'already_paid' | 'not_found';

/** Result of public.record_refund. */
export type RecordRefundResult = 'ok' | 'not_found';
