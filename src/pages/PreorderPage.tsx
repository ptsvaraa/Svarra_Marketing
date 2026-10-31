import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  BatteryCharging,
  Bell,
  Check,
  Crown,
  Languages,
  MicOff,
  Package,
  ShieldCheck,
  Sparkles,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { formatFee, IN_THE_BOX, PREORDER_FAQ, RESERVATION_FEE_USD } from '../data/preorder';
import { cn } from '../lib/cn';
import { PendantArt } from '../components/preorder/PendantArt';
import { PreorderForm } from '../components/preorder/PreorderForm';

/** Product facts, from the Why Svaraa content and the Svaraa Lite design sheet. */
const HIGHLIGHTS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Sparkles, title: 'One gold button', body: 'Voice and gentle vibration. No screens, no apps to learn.' },
  { icon: ShieldCheck, title: 'Fall detection & SOS', body: 'Alerts family contacts in turn until someone responds.' },
  { icon: Languages, title: 'Speaks their language', body: 'Hindi, English and Tamil, in a warm, familiar voice.' },
  { icon: BatteryCharging, title: 'Magnetic charging', body: 'Sets onto its puck; no fiddly ports for older hands.' },
];

/** Feature tags that float around the pendant in the hero. Each sets its own display, so some can hide on phones. */
const FLOATING: { icon: LucideIcon; label: string; className: string }[] = [
  { icon: ShieldCheck, label: 'Hold the gold button for SOS', className: 'inline-flex top-[10%] left-0 sm:left-[2%]' },
  { icon: Bell, label: 'Offline reminders', className: 'inline-flex top-[27%] right-0 sm:top-[20%]' },
  { icon: MicOff, label: 'Physical mic', className: 'bottom-[22%] left-0 hidden sm:inline-flex' },
];

const PERKS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Crown, title: 'First-edition access', body: 'The first Svaraa Fold pendants are made in a limited batch.' },
  { icon: Bell, title: 'Hear first', body: 'Delivery timelines and launch news reach you before anyone else.' },
  { icon: Ticket, title: `${formatFee(RESERVATION_FEE_USD)} holds your place`, body: 'A small reservation fee secures your spot in the first edition.' },
];

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
      {/* Hero */}
      <section aria-labelledby="preorder-title" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-10 lg:pt-20 lg:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-medium tracking-[0.22em] text-gold uppercase">
              <Crown className="size-3.5" aria-hidden="true" />
              Limited first edition
            </p>
            <h1
              id="preorder-title"
              className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-heading sm:text-6xl lg:text-7xl"
            >
              Reserve
              <em className="block text-accent">Svaraa Fold.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
              A gentle voice for them. A family close by. Be among the first to bring home the pendant that reminds,
              responds and reaches family when it matters.
            </p>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink">
              {[`Reserve for just ${formatFee(RESERVATION_FEE_USD)}`, 'Limited first-edition batch', 'Delivery details confirmed with you'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-success" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <a
              href="#reserve"
              className="mt-9 inline-flex h-14 items-center gap-3 rounded-xl bg-primary px-7 text-[1.05rem] font-medium text-on-primary shadow-[0_14px_30px_-16px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Reserve yours
              <ArrowDown className="size-5" aria-hidden="true" />
            </a>
          </div>

          {/* Product stage: the pendant as vector art on a soft glow, with its key features around it. */}
          <div className="relative mx-auto flex aspect-square w-full max-w-[560px] items-center justify-center">
            <div
              className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-gold)_28%,transparent)_0%,transparent_68%)]"
              aria-hidden="true"
            />
            {/* Rings are stronger in light mode, where pale gold barely shows on the cream background. */}
            <div className="absolute inset-[12%] rounded-full border-[1.5px] border-gold/55 dark:border dark:border-gold/25" aria-hidden="true" />
            <div className="absolute inset-[2%] rounded-full border border-dashed border-gold/45 dark:border-gold/20" aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[58%] drop-shadow-[0_40px_45px_rgba(74,21,50,0.35)]"
            >
              <PendantArt className="w-full" />
            </motion.div>

            {FLOATING.map(({ icon: Icon, label, className }, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'glass absolute items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium whitespace-nowrap text-heading shadow-[0_14px_30px_-18px_var(--c-shadow)] sm:text-sm',
                  className,
                )}
              >
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </motion.span>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
              className="glass absolute right-0 bottom-[2%] rounded-2xl px-5 py-3.5 text-right shadow-[0_20px_40px_-22px_var(--c-shadow)] sm:right-[4%]"
            >
              <p className="text-xs tracking-[0.18em] text-muted uppercase">Reserve today</p>
              <p className="font-serif text-3xl leading-tight text-heading">
                {formatFee(RESERVATION_FEE_USD)}
                <span className="ml-1.5 font-sans text-sm text-muted">to hold yours</span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section aria-label="Svaraa Fold highlights" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
        <motion.ul {...fade} className="grid gap-4 border-y border-line py-10 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-lg text-heading">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </motion.ul>
      </section>

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
                  <p className="mt-1.5 text-sm text-muted">Takes about two minutes. {formatFee(RESERVATION_FEE_USD)} per pendant to reserve.</p>
                </div>
                <span className="shrink-0 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">First edition</span>
              </div>
              <PreorderForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
