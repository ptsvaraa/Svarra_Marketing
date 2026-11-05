import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  Check,
  ChevronRight,
  Crown,
  Gem,
  HeartHandshake,
  Hospital,
  Network,
  ShieldPlus,
  Sparkles,
  Sprout,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';

type Plan = {
  id: string;
  name: string;
  price: number;
  icon: LucideIcon;
  tagline: string;
  /** The tier this one builds on, shown as "Everything in X, plus". */
  builds?: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    icon: Sprout,
    tagline: 'The essentials that keep them safe.',
    features: [
      'SOS on the gold button',
      'Fall detection alerts',
      'Up to 2 family contacts',
      'Daily medicine reminders',
      'One language',
    ],
  },
  {
    id: 'go',
    name: 'Go',
    price: 19,
    icon: Sparkles,
    tagline: 'A daily companion that listens.',
    builds: 'Free',
    features: [
      'Voice conversations with Svaraa',
      'Hindi, English and Tamil',
      'Up to 5 family contacts',
      'Family app with daily check-ins',
      'Unlimited custom reminders',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 49,
    icon: Crown,
    tagline: 'All seven Svaraas, for the whole family.',
    builds: 'Go',
    features: [
      'All 7 Svaraas unlocked',
      'Memory keeper for stories and life experiences',
      'Weekly wellbeing summary for family',
      'Location sharing during SOS',
      'Priority support',
    ],
    featured: true,
  },
  {
    id: 'platinum',
    name: 'Diamond',
    price: 59,
    icon: Gem,
    tagline: 'Round-the-clock care, with people behind it.',
    builds: 'Gold',
    features: [
      '24/7 live care team response',
      'Unlimited family contacts',
      'Doctor and caregiver sharing',
      'Monthly health trends report',
      'Dedicated care manager',
    ],
  },
];

const SALES_EMAIL = 'kannan@svaraa.ai';
const SALES_HREF = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent('Svaraa Enterprise enquiry')}`;

/** What every enterprise partnership comes with. */
const ENTERPRISE_INCLUDED: string[] = [
  'Volume pricing on pendants and plans, with flexible per-resident or per-member billing',
  'A care dashboard to see every wearer, their reminders and alerts in one place',
  'SOS and fall alerts call straight through to their caretaker and the loved ones who matter most',
  'Custom voice, languages, branding and content for your residents or members',
  'Data privacy by design: encryption at rest and in transit, consent-led sharing, and no selling of data',
  'Onboarding, staff training, a dedicated account manager and priority support',
];

/** The kinds of organisations Svaraa partners with. */
const PROGRAMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Hospital,
    title: 'Senior living facilities',
    body: 'Give every resident a pendant, with alerts that reach your care staff the moment help is needed.',
  },
  {
    icon: HeartHandshake,
    title: 'Elderly care agencies',
    body: 'Keep your caregivers and families in the loop between visits, with reminders and check-ins.',
  },
  {
    icon: ShieldPlus,
    title: 'Insurance programs',
    body: 'Offer Svaraa to policyholders to support safer, healthier ageing and fewer emergencies.',
  },
  {
    icon: Network,
    title: 'Channel partners',
    body: 'Distribute or resell Svaraa through your stores, clinics or networks, with partner pricing.',
  },
];

type Audience = 'individual' | 'enterprise';

const AUDIENCES: { value: Audience; label: string; icon: LucideIcon }[] = [
  { value: 'individual', label: 'Individual', icon: User },
  { value: 'enterprise', label: 'Enterprise', icon: Building2 },
];

/** Individual / Enterprise switch, styled like the "Reserving as" toggle on the pre-order form. */
function AudienceToggle({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Plans for"
      className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2 rounded-2xl border border-line bg-glass-strong p-1.5"
    >
      {AUDIENCES.map(({ value: v, label, icon: Icon }) => {
        const on = value === v;
        return (
          <label
            key={v}
            className={cn(
              'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
              on ? 'bg-primary font-medium text-on-primary shadow-sm' : 'text-ink hover:bg-primary/5',
            )}
          >
            <input
              type="radio"
              name="pricing-audience"
              value={v}
              checked={on}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </label>
        );
      })}
    </div>
  );
}

function EnterprisePlan() {
  return (
    <div className="flex flex-col gap-12">
      <article
        aria-labelledby="plan-enterprise"
        className="glass relative grid overflow-hidden rounded-3xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      >
        {/* Soft gold glow in the corner, as on the founding price card. */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--c-gold)_20%,transparent)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col p-6 sm:p-8 lg:border-r lg:border-line lg:p-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/15 text-gold">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <h3 id="plan-enterprise" className="font-serif text-3xl text-heading">
              Enterprise
            </h3>
          </div>
          <p className="mt-4 leading-relaxed text-muted">
            Svaraa for organisations that care for older adults at scale: care homes, agencies, insurers and partners.
          </p>

          <a
            href={SALES_HREF}
            className="mt-7 inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-[0.95rem] font-medium text-on-primary shadow-[0_14px_30px_-16px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Contact sales
            <ChevronRight className="size-4" aria-hidden="true" />
          </a>

          <p className="mt-8 font-serif text-2xl text-heading">Custom pricing</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink">
            Talk to our partnerships team about pricing for your organisation. Write to us at{' '}
            <a
              href={SALES_HREF}
              className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
            >
              {SALES_EMAIL}
            </a>
            .
          </p>
        </div>

        <div className="relative border-t border-line p-6 sm:p-8 lg:border-t-0 lg:p-10">
          <p className="font-medium text-heading">What&rsquo;s included</p>
          <ul className="mt-5 flex flex-col gap-4">
            {ENTERPRISE_INCLUDED.map((f) => (
              <li key={f} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink">
                <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </article>

      <div>
        <p className="text-center text-xs font-medium tracking-[0.32em] text-gold uppercase">Partnership programs</p>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="glass flex flex-col rounded-3xl p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h4 className="mt-4 font-serif text-xl text-heading">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const;

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const { icon: Icon, featured } = plan;
  const headingId = `plan-${plan.id}`;
  return (
    <motion.article
      {...fade}
      transition={{ ...fade.transition, delay: index * 0.08 }}
      aria-labelledby={headingId}
      className={cn(
        'glass relative flex flex-col rounded-3xl p-6 sm:p-7',
        featured && 'border-gold/60 shadow-[0_30px_60px_-34px_var(--c-shadow)] ring-1 ring-gold/40 lg:-translate-y-3',
      )}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-gold/50 bg-gold px-3 py-1 text-[0.7rem] font-medium tracking-[0.18em] whitespace-nowrap text-on-primary uppercase">
          Value for money
        </span>
      )}

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
            featured ? 'border border-gold/40 bg-gold/15 text-gold' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h3 id={headingId} className="font-serif text-2xl text-heading">
          {plan.name}
        </h3>
      </div>
      {/* Two lines reserved so prices line up across cards. */}
      <p className="mt-3 min-h-[2lh] text-sm leading-relaxed text-muted">{plan.tagline}</p>

      <p className="mt-6 flex items-end gap-1.5">
        <span className="font-serif text-5xl leading-none tracking-tight text-heading tabular-nums">${plan.price}</span>
        <span className="pb-1 text-sm text-muted">/ month</span>
      </p>

      <span
        className="mt-6 block h-px bg-gradient-to-r from-gold/60 via-gold/25 to-transparent"
        aria-hidden="true"
      />

      {plan.builds && <p className="mt-5 text-sm font-medium text-heading">Everything in {plan.builds}, plus</p>}
      <ul className={cn('flex flex-1 flex-col gap-3', plan.builds ? 'mt-3' : 'mt-5')}>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[0.95rem] leading-snug text-ink">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>

    </motion.article>
  );
}

export function Pricing() {
  const [audience, setAudience] = useState<Audience>('individual');
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-24 px-4 pt-20 pb-8 sm:px-6 sm:pt-28 lg:px-10"
    >
      <div className="mx-auto max-w-[1320px]">
        <motion.div {...fade} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Pricing</p>
          <h2
            id="pricing-title"
            className="mt-5 font-serif text-4xl leading-tight tracking-tight text-balance text-heading sm:text-5xl"
          >
            A plan for everyday <em className="text-accent">wellbeing.</em>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Every pendant works on the Free plan. Upgrade any time for more access to the 7 Svaraas &rsquo;s voice, care and
            family features.
          </p>
        </motion.div>

        <motion.div {...fade} className="mt-10">
          <AudienceToggle value={audience} onChange={setAudience} />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={audience}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-12"
          >
            {audience === 'individual' ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                  {PLANS.map((plan, i) => (
                    <PlanCard key={plan.id} plan={plan} index={i} />
                  ))}
                </div>
                <p className="mt-8 text-center text-xs text-subtle">
                  Concept design of prices in US dollars per pendant, billed monthly. Cancel or change plans any time.
                </p>
              </>
            ) : (
              <EnterprisePlan />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
