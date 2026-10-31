/**
 * Pre-order details and their validation. Kept free of browser-only code so the
 * Stripe server function (api/) runs exactly the same checks before charging.
 */
// `.js` extension: this file also runs as native ESM in the Vercel server functions.
import { INDIAN_STATES, quantityRange, type BuyerType } from '../data/preorder.js';

export interface PreorderDetails {
  buyerType: BuyerType;
  /** Business orders only. */
  organisation: string;
  /** Business orders only, optional: 15-character GSTIN for invoicing. */
  gstin: string;
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  quantity: number;
  wearer: string;
  consent: boolean;
}

export type PreorderErrors = Partial<Record<keyof PreorderDetails, string>>;

const PHONE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE = /^[1-9]\d{5}$/;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Accepts "98765 43210", "+91 98765-43210" or "098765…" and keeps the 10 digits. */
export const normalisePhone = (value: string) => value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');

export function validatePreorder(d: PreorderDetails): PreorderErrors {
  const e: PreorderErrors = {};
  if (d.buyerType === 'business') {
    if (d.organisation.trim().length < 2) e.organisation = 'Enter your organisation’s name.';
    if (d.gstin.trim() && !GSTIN.test(d.gstin.trim().toUpperCase())) e.gstin = 'Enter a valid 15-character GSTIN, or leave it blank.';
  }
  if (d.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  if (!PHONE.test(normalisePhone(d.phone))) e.phone = 'Enter a 10-digit Indian mobile number.';
  if (!EMAIL.test(d.email.trim())) e.email = 'Enter a valid email address.';
  if (!d.addressLine1.trim()) e.addressLine1 = 'Enter your flat or house number and building.';
  if (!d.addressLine2.trim()) e.addressLine2 = 'Enter your street, area or locality.';
  if (!d.city.trim()) e.city = 'Enter your city or town.';
  if (!(INDIAN_STATES as readonly string[]).includes(d.state)) e.state = 'Choose your state.';
  if (!PINCODE.test(d.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode.';
  const { min, max } = quantityRange(d.buyerType);
  if (!Number.isInteger(d.quantity) || d.quantity < min || d.quantity > max) {
    e.quantity = `Choose between ${min} and ${max}.`;
  }
  if (!d.consent) e.consent = 'Please agree so we can contact you about delivery.';
  return e;
}

/** A short, readable reference shown to the customer, e.g. "SVR-7K3QX9". */
export function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'SVR-' + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
