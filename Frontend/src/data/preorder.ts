/*
 * Pre-order rules and copy for the page and form. The backend enforces the same
 * quantity limits and fees before charging (Backend/src/shared/preorder.ts); if
 * you change one there, change it here too.
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

export const WEARERS = [
  { value: 'self', label: 'Myself' },
  { value: 'parent', label: 'My parent' },
  { value: 'family', label: 'Another loved one' },
] as const;

/** Most pendants an individual (one household) can reserve. */
export const MAX_QUANTITY = 4;

export const BUYER_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Enterprise & Business' },
] as const;

export type BuyerType = (typeof BUYER_TYPES)[number]['value'];

/** Business orders: at least 10 pendants, at most 100 online. Larger orders go through the team first. */
export const BUSINESS_MIN_QUANTITY = 10;
export const BUSINESS_MAX_QUANTITY = 100;

/** Inbox for bulk orders above BUSINESS_MAX_QUANTITY. Confirm this address before launch. */
export const BUSINESS_CONTACT_EMAIL = 'srk@svaraa.ai';

/** Allowed quantity range for each kind of buyer. */
export const quantityRange = (buyer: BuyerType) =>
  buyer === 'business' ? { min: BUSINESS_MIN_QUANTITY, max: BUSINESS_MAX_QUANTITY } : { min: 1, max: MAX_QUANTITY };

/** Product name shown on the Razorpay payment window and receipts. */
export const PRODUCT_NAME = 'Svaraa Fold';

/** Reservation fee per pendant, in US dollars. */
export const RESERVATION_FEE_USD = 9;

/** Refund promise for everything paid today; matches "If we cancel" in the Terms. */
export const REFUND_PROMISE = 'Fully refundable if we can’t fulfil your order.';

/**
 * Whether pre-orders are open. While false, the /pre-order page is hidden (that URL shows the
 * home page) and every button that leads to it is hidden too. Set to true to bring it back.
 */
export const PREORDER_OPEN = true;

/**
 * Currencies a reservation can be paid in: rupees in India (UPI, Indian cards, netbanking,
 * wallets) or US dollars from abroad (international cards). Lower case, as stored.
 */
export const CURRENCIES = ['inr', 'usd'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** "$9", "$1,089" or "₹799", "₹9,599" (Indian digit grouping). */
export const formatFee = (amount: number, currency: Currency = 'usd') =>
  currency === 'inr' ? `₹${amount.toLocaleString('en-IN')}` : `$${amount.toLocaleString('en-US')}`;

/**
 * Pendant pricing. The pre-order price is the list price less the pre-order discount,
 * paid in two parts: the reservation fee today and the balance once delivery starts.
 *   $180 list − 40% = $108 = $9 today + $99 at delivery (plus taxes and delivery charges).
 */
export const LIST_PRICE_USD = 180;
export const PREORDER_DISCOUNT_PERCENT = 40;
export const PREORDER_PRICE_USD = (LIST_PRICE_USD * (100 - PREORDER_DISCOUNT_PERCENT)) / 100;
export const BALANCE_ON_DELIVERY_USD = PREORDER_PRICE_USD - RESERVATION_FEE_USD;
export const SAVING_USD = LIST_PRICE_USD - PREORDER_PRICE_USD;

/** Business orders: one fee to hold the organisation's place, plus a booking amount per pendant. */
export const BUSINESS_HOLD_FEE_USD = 9;
export const BUSINESS_BOOKING_PER_PENDANT_USD = 9;

/**
 * Rupee prices, for buyers paying in India. Fixed amounts chosen for India, not converted
 * from the dollar prices. PLACEHOLDERS: confirm before launch.
 *   ₹15,999 list → ₹9,599 pre-order = ₹799 today + ₹8,800 at delivery (plus taxes and delivery charges).
 */
export const RESERVATION_FEE_INR = 799;
export const LIST_PRICE_INR = 15999;
export const PREORDER_PRICE_INR = 9599;
export const BALANCE_ON_DELIVERY_INR = PREORDER_PRICE_INR - RESERVATION_FEE_INR;
export const BUSINESS_HOLD_FEE_INR = 799;
export const BUSINESS_BOOKING_PER_PENDANT_INR = 799;

/** Every price in each currency, in whole rupees or dollars. */
export const PRICES: Readonly<
  Record<Currency, { list: number; preorder: number; reservation: number; balance: number; hold: number; booking: number }>
> = {
  usd: {
    list: LIST_PRICE_USD,
    preorder: PREORDER_PRICE_USD,
    reservation: RESERVATION_FEE_USD,
    balance: BALANCE_ON_DELIVERY_USD,
    hold: BUSINESS_HOLD_FEE_USD,
    booking: BUSINESS_BOOKING_PER_PENDANT_USD,
  },
  inr: {
    list: LIST_PRICE_INR,
    preorder: PREORDER_PRICE_INR,
    reservation: RESERVATION_FEE_INR,
    balance: BALANCE_ON_DELIVERY_INR,
    hold: BUSINESS_HOLD_FEE_INR,
    booking: BUSINESS_BOOKING_PER_PENDANT_INR,
  },
};

export interface FeeLine {
  id: 'reservation' | 'hold' | 'booking';
  label: string;
  description: string;
  /** Price of one, in whole units of the line's currency. */
  unit: number;
  quantity: number;
}

/**
 * What a reservation costs, line by line, in the chosen currency. The form shows these lines
 * and the server charges exactly them through Razorpay, so the two can never disagree.
 *   Individual: $9 (₹799) per pendant.
 *   Business:   $9 (₹799) to hold your place + $9 (₹799) booking amount per pendant.
 */
export function feeLines(buyer: BuyerType, quantity: number, currency: Currency = 'usd'): FeeLine[] {
  const p = PRICES[currency];
  if (buyer === 'business') {
    return [
      {
        id: 'hold',
        label: 'Hold your place',
        description: 'Holds your organisation’s place in the limited first edition.',
        unit: p.hold,
        quantity: 1,
      },
      {
        id: 'booking',
        label: 'Booking amount',
        description: 'Booking amount per pendant.',
        unit: p.booking,
        quantity,
      },
    ];
  }
  return [
    {
      id: 'reservation',
      label: 'Reservation fee',
      description: 'Reservation fee that holds your place in the limited first edition.',
      unit: p.reservation,
      quantity,
    },
  ];
}

export const feeTotal = (lines: readonly FeeLine[]) => lines.reduce((sum, l) => sum + l.unit * l.quantity, 0);

/** Whole rupees or dollars to the smallest unit (paise or cents), as payment providers expect. */
export const toMinor = (amount: number) => Math.round(amount * 100);

/** Contents of the Svaraa Lite box, from the product design sheet. */
export const IN_THE_BOX = [
  { name: 'Svaraa Fold pendant', detail: 'Aubergine face, one flush button, dusty-rose silicone sleeve' },
  { name: 'Breakaway lanyard', detail: 'Soft braided cord with breakaway clasp' },
  { name: 'Magnetic charging puck', detail: 'Low-profile cradle with alignment magnets' },
  { name: 'Braided USB-C cable', detail: 'Powers the charging puck' },
] as const;

export const PREORDER_FAQ = [
  {
    q: 'What is the full price of Svaraa Fold?',
    a: `Svaraa Fold will be $${LIST_PRICE_USD}. Pre-orders get ${PREORDER_DISCOUNT_PERCENT}% off, so you pay $${PREORDER_PRICE_USD} per pendant: $${RESERVATION_FEE_USD} today to reserve, and the remaining $${BALANCE_ON_DELIVERY_USD} once we start delivery, excluding taxes and delivery charges. Paying in rupees, it is ${formatFee(PREORDER_PRICE_INR, 'inr')} per pendant (list ${formatFee(LIST_PRICE_INR, 'inr')}): ${formatFee(RESERVATION_FEE_INR, 'inr')} today and ${formatFee(BALANCE_ON_DELIVERY_INR, 'inr')} at delivery.`,
  },
  {
    q: 'How much does it cost to reserve?',
    a: `Reserving costs ${formatFee(RESERVATION_FEE_USD)} (${formatFee(RESERVATION_FEE_INR, 'inr')}) per pendant. Business orders of ${BUSINESS_MIN_QUANTITY} to ${BUSINESS_MAX_QUANTITY} pendants pay ${formatFee(BUSINESS_HOLD_FEE_USD)} (${formatFee(BUSINESS_HOLD_FEE_INR, 'inr')}) to hold their place plus a ${formatFee(BUSINESS_BOOKING_PER_PENDANT_USD)} (${formatFee(BUSINESS_BOOKING_PER_PENDANT_INR, 'inr')}) booking amount per pendant. After you fill in this form, you pay securely through Razorpay: in rupees by UPI, card, netbanking or wallet, or in US dollars by international card. Your place in the first edition is held as soon as it goes through. The rest of the pre-order price is due once we start delivery.`,
  },
  {
    q: 'Is the reservation fee refundable?',
    a: `Yes. If we can’t fulfil your order for any reason, we refund everything you paid today in full: the ${formatFee(RESERVATION_FEE_USD)} (${formatFee(RESERVATION_FEE_INR, 'inr')}) reservation fee, or for businesses the hold fee and booking amounts. The refund goes back to the way you paid, in the same currency.`,
  },
  {
    q: 'When will my Svaraa arrive?',
    a: 'Delivery timelines will be shared with everyone who reserves, by email and phone, before the first edition ships.',
  },
  {
    q: 'Can I change my delivery details later?',
    a: 'Yes. Reply to your confirmation or contact us, and we will update your address or contact details before your Svaraa ships.',
  },
  {
    q: 'Which languages does Svaraa speak?',
    a: 'Svaraa speaks Hindi, English and Tamil, so the wearer can use the language they are most comfortable with.',
  },
] as const;
