/**
 * Pre-order rules the server enforces before charging: who may order how many,
 * and what each reservation costs. Stripe is charged exactly feeLines().
 *
 * The frontend has the same rules in Frontend/src/data/preorder.ts, to show the
 * price and check the form before it is sent. If you change a quantity limit or a
 * fee, change it in both files. This copy is the one that decides what is charged.
 */
/** Indian states and union territories, for the delivery address. */
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

/** Most pendants an individual (one household) can reserve. */
export const MAX_QUANTITY = 4;

export const BUYER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Enterprise & Business' },
] as const;

export type BuyerType = (typeof BUYER_TYPES)[number]['value'];

/** Business orders: at least 10 pendants, at most 20 online. Larger orders go through the team first. */
export const BUSINESS_MIN_QUANTITY = 10;
export const BUSINESS_MAX_QUANTITY = 20;

/** Inbox for bulk orders above BUSINESS_MAX_QUANTITY. Confirm this address before launch. */
export const BUSINESS_CONTACT_EMAIL = 'sales@svaraa.ai';

/** Allowed quantity range for each kind of buyer. */
export const quantityRange = (buyer: BuyerType) =>
  buyer === 'business' ? { min: BUSINESS_MIN_QUANTITY, max: BUSINESS_MAX_QUANTITY } : { min: 1, max: MAX_QUANTITY };

/** Product name shown on the Stripe payment page and receipts. */
export const PRODUCT_NAME = 'Svaraa Fold';

/** The product's SKU in the database's products table (seeded by 0002_commerce.sql). */
export const PRODUCT_SKU = 'SVARAA-FOLD';

/**
 * Version of the privacy policy the buyer agrees to, saved with their consent.
 * Keep in step with LAST_UPDATED in Frontend/src/legal/company.ts.
 */
export const PRIVACY_POLICY_VERSION = '30 October 2026';

/** Reservation fee per pendant, in US dollars. */
export const RESERVATION_FEE_USD = 5;

export const formatFee = (usd: number) => `$${usd}`;

/**
 * Pendant pricing. The pre-order price is the list price less the pre-order discount,
 * paid in two parts: the reservation fee today and the balance once delivery starts.
 *   $130 list − 20% = $104 = $5 today + $99 at delivery (plus taxes and delivery charges).
 */
export const LIST_PRICE_USD = 130;
export const PREORDER_DISCOUNT_PERCENT = 20;
export const PREORDER_PRICE_USD = (LIST_PRICE_USD * (100 - PREORDER_DISCOUNT_PERCENT)) / 100;
export const BALANCE_ON_DELIVERY_USD = PREORDER_PRICE_USD - RESERVATION_FEE_USD;
export const SAVING_USD = LIST_PRICE_USD - PREORDER_PRICE_USD;

/** Business orders: one fee to hold the organisation's place, plus a booking amount per pendant. */
export const BUSINESS_HOLD_FEE_USD = 5;
export const BUSINESS_BOOKING_PER_PENDANT_USD = 5;

export interface FeeLine {
  id: 'reservation' | 'hold' | 'booking';
  label: string;
  description: string;
  unitUsd: number;
  quantity: number;
}

/**
 * What a reservation costs, line by line. The form shows these lines and the
 * Stripe server charges exactly them, so the two can never disagree.
 *   Individual: $5 per pendant.
 *   Business:   $5 to hold your place + $5 booking amount per pendant (20 pendants = $105).
 */
export function feeLines(buyer: BuyerType, quantity: number): FeeLine[] {
  if (buyer === 'business') {
    return [
      {
        id: 'hold',
        label: 'Hold your place',
        description: 'Holds your organisation’s place in the limited first edition.',
        unitUsd: BUSINESS_HOLD_FEE_USD,
        quantity: 1,
      },
      {
        id: 'booking',
        label: 'Booking amount',
        description: 'Booking amount per pendant.',
        unitUsd: BUSINESS_BOOKING_PER_PENDANT_USD,
        quantity,
      },
    ];
  }
  return [
    {
      id: 'reservation',
      label: 'Reservation fee',
      description: 'Reservation fee that holds your place in the limited first edition.',
      unitUsd: RESERVATION_FEE_USD,
      quantity,
    },
  ];
}

export const feeTotal = (lines: readonly FeeLine[]) => lines.reduce((sum, l) => sum + l.unitUsd * l.quantity, 0);
