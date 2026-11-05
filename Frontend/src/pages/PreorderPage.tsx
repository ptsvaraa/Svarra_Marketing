import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BadgePercent,
  Bell,
  Check,
  Crown,
  Package,
  Truck,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import {
  BALANCE_ON_DELIVERY_USD,
  formatFee,
  IN_THE_BOX,
  LIST_PRICE_USD,
  MAX_QUANTITY,
  PREORDER_DISCOUNT_PERCENT,
  PREORDER_FAQ,
  PREORDER_PRICE_USD,
  RESERVATION_FEE_USD,
  SAVING_USD,
} from '../data/preorder';
import { ReserveHero } from '../components/preorder/ReserveHero';
import { PreorderForm } from '../components/preorder/PreorderForm';

const PERKS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Crown, title: 'First-edition access', body: 'The first Svaraa Fold pendants are made in a limited batch.' },
  { icon: Bell, title: 'Hear first', body: 'Delivery timelines and launch news reach you before anyone else.' },
  {
    icon: BadgePercent,
    title: `${PREORDER_DISCOUNT_PERCENT}% founding discount`,
    body: `Pre-order at ${formatFee(PREORDER_PRICE_USD)} instead of ${formatFee(LIST_PRICE_USD)}.`,
  },
  {
    icon: Ticket,
    title: `${formatFee(RESERVATION_FEE_USD)} holds your place`,
    body: 'A small reservation fee secures your spot in the first edition.',
  },
];

/** How the pre-order price is paid: a little today, the rest once delivery begins. */
const PAYMENT_STEPS: { icon: LucideIcon; when: string; amount: number; note: string }[] = [
  {
    icon: Ticket,
    when: 'Today',
    amount: RESERVATION_FEE_USD,
    note: 'Reservation fee. Holds your place in the first edition.',
  },
  {
    icon: Truck,
    when: 'Once we start delivery',
    amount: BALANCE_ON_DELIVERY_USD,
    note: 'The balance, plus applicable taxes and delivery charges.',
  },
];

function PriceCard() {
  return (
    <motion.div
      {...fade}
      aria-labelledby="price-title"
      role="region"
      className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
    >
      {/* Soft gold glow in the corner, echoing the pendant stage. */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-gold)_22%,transparent)_0%,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p id="price-title" className="text-xs font-medium tracking-[0.32em] text-gold uppercase">
          Founding price
        </p>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
          {PREORDER_DISCOUNT_PERCENT}% off for pre-orders
        </span>
      </div>

      <div className="relative mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="font-serif text-6xl leading-none tracking-tight text-heading tabular-nums">
          {formatFee(PREORDER_PRICE_USD)}
        </p>
        <div className="pb-1.5">
          <p className="text-lg text-subtle tabular-nums">
            <span className="sr-only">Usual price </span>
            <s className="decoration-gold/70">{formatFee(LIST_PRICE_USD)}</s>
          </p>
          <p className="text-sm text-muted">per pendant</p>
        </div>
      </div>
      <p className="relative mt-3 text-sm text-success">You save {formatFee(SAVING_USD)} on every pendant.</p>

      <span
        className="relative mt-7 block h-px bg-gradient-to-r from-gold/60 via-gold/25 to-transparent"
        aria-hidden="true"
      />

      <p className="relative mt-6 text-sm font-medium text-heading">How you pay</p>
      <ol className="relative mt-4 flex flex-col">
        {PAYMENT_STEPS.map(({ icon: Icon, when, amount, note }, i) => (
          <li key={when} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Gold thread joining the two steps. */}
            {i < PAYMENT_STEPS.length - 1 && (
              <span className="absolute top-11 bottom-1 left-[1.375rem] w-px bg-gold/35" aria-hidden="true" />
            )}
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-4 pt-1">
              <div>
                <p className="text-xs tracking-[0.18em] text-muted uppercase">{when}</p>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-ink">{note}</p>
              </div>
              <p className="font-serif text-3xl leading-none text-heading tabular-nums">{formatFee(amount)}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="relative mt-7 border-t border-line pt-4 text-xs leading-relaxed text-subtle">
        Prices in US dollars. {formatFee(RESERVATION_FEE_USD)} + {formatFee(BALANCE_ON_DELIVERY_USD)} ={' '}
        {formatFee(PREORDER_PRICE_USD)} per pendant, before taxes and delivery. Up to {MAX_QUANTITY} pendants per
        household.
      </p>
    </motion.div>
  );
}

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const;

export function PreorderPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Pre-order Svaraa Fold · First Edition';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <>
      <ReserveHero headingId="preorder-title" headingLevel="h1" ctaHref="#reserve" />

      {/* Details + form */}
      <section className="mx-auto max-w-[1320px] px-4 pt-16 pb-20 sm:px-6 sm:pt-20 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
          <div className="flex flex-col gap-14">
            <motion.div {...fade}>
              <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Why reserve now</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-heading">
                The first edition is <em className="text-accent">limited.</em>
              </h2>
              <ul className="mt-8 flex flex-col gap-5">
                {PERKS.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-medium text-heading">{title}</h3>
                      <p className="mt-0.5 text-[0.95rem] leading-relaxed text-muted">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <PriceCard />

            <motion.div {...fade} className="glass rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Package className="size-5 text-primary" aria-hidden="true" />
                <h2 className="font-serif text-2xl text-heading">What&rsquo;s in the box</h2>
              </div>
              <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {IN_THE_BOX.map((item) => (
                  <li key={item.name} className="flex gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
                    <div>
                      <p className="text-[0.95rem] font-medium text-heading">{item.name}</p>
                      <p className="text-sm text-muted">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...fade}>
              <h2 className="font-serif text-2xl text-heading">Questions, answered</h2>
              <div className="mt-5 divide-y divide-line border-y border-line">
                {PREORDER_FAQ.map((f) => (
                  <details key={f.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium text-heading focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span
                        className="text-xl leading-none text-primary transition-transform duration-200 group-open:rotate-45"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 pr-8 text-[0.95rem] leading-relaxed text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stays in view beside the long content on desktop. */}
          <div id="reserve" className="scroll-mt-24 lg:sticky lg:top-24">
            <div className="glass rounded-[28px] p-6 shadow-[0_30px_60px_-36px_var(--c-shadow)] sm:p-8">
              <div className="mb-8 flex items-start justify-between gap-4 border-b border-line pb-6">
                <div>
                  <h2 className="font-serif text-3xl text-heading">Reserve your Svaraa</h2>
                  <p className="mt-1.5 text-sm text-muted">
                    Takes about two minutes. {formatFee(RESERVATION_FEE_USD)} per pendant today,{' '}
                    {formatFee(BALANCE_ON_DELIVERY_USD)} at delivery.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
                  First edition
                </span>
              </div>
              <PreorderForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
