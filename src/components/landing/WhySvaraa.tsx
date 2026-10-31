import { motion } from 'framer-motion';
import { Check, X, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { LotusDivider } from '../brand/LotusDivider';

interface Column {
  id: string;
  title: string;
  subtitle: string;
  points: readonly string[];
  icon: LucideIcon;
  tone: 'danger' | 'success';
}

const COLUMNS: readonly Column[] = [
  {
    id: 'struggle',
    title: 'Ageing Alone, Worrying Apart',
    subtitle: 'The Daily Struggle',
    icon: X,
    tone: 'danger',
    points: [
      'Missed medicines and forgotten appointments, with no one nearby to remind them.',
      'A fall at home can go unnoticed for hours when family lives in another city or country.',
      'Smartphones and apps are too complex for older hands, eyes and ears.',
      'Long, quiet days with little conversation, companionship or mental engagement.',
    ],
  },
  {
    id: 'solution',
    title: 'The Svaraa Solution',
    subtitle: 'Care You Can Hear and Feel',
    icon: Check,
    tone: 'success',
    points: [
      'Spoken reminders for medicines, prayers and appointments, which keep working even when the phone is out of range.',
      'Fall detection and one-button SOS that alerts family contacts in turn until someone responds “I’m on it.”',
      'A simple pendant with one gold button, voice and gentle vibration, in Tamil, Hindi and English.',
      'A warm voice companion for conversation, devotional music, riddles and remembering life’s little details.',
    ],
  },
];

// Static class maps so Tailwind can see every class at build time.
const TONE = {
  danger: { panel: 'bg-danger-soft', tile: 'bg-danger/12 text-danger', text: 'text-danger' },
  success: { panel: 'bg-success-soft', tile: 'bg-success/12 text-success', text: 'text-success' },
} as const;

export function WhySvaraa() {
  return (
    <section id="why" aria-labelledby="why-title" className="scroll-mt-6 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Why Svaraa</p>
          <h2
            id="why-title"
            className="mt-4 font-serif text-4xl leading-tight tracking-tight text-balance text-heading sm:text-5xl"
          >
            Turn Everyday Worry into <em className="text-accent">Connected Care</em>
          </h2>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mt-12 grid max-w-5xl gap-5 sm:mt-14 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6 lg:gap-8"
        >
          {COLUMNS.map((col, i) => {
            const tone = TONE[col.tone];
            const Icon = col.icon;
            return (
              <article
                key={col.id}
                aria-labelledby={`why-${col.id}`}
                className={cn(
                  'rounded-[24px] border border-line px-6 py-8 shadow-[0_18px_40px_-30px_var(--c-shadow)] sm:px-8 sm:py-9',
                  tone.panel,
                  // The lotus divider takes the middle column on wide screens.
                  i === 1 && 'md:col-start-3',
                )}
              >
                <div className="text-center">
                  <span className={cn('mx-auto inline-flex size-14 items-center justify-center rounded-full', tone.tile)}>
                    <Icon className="size-6" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <h3 id={`why-${col.id}`} className={cn('mt-5 font-serif text-2xl text-balance', tone.text)}>
                    {col.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-medium tracking-[0.14em] text-muted uppercase">{col.subtitle}</p>
                </div>
                <ul className="mx-auto mt-7 max-w-md space-y-4">
                  {col.points.map((point) => (
                    <li key={point} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink">
                      <Icon className={cn('mt-1 size-5 shrink-0', tone.text)} strokeWidth={2.25} aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
          <LotusDivider className="max-md:hidden md:col-start-2 md:row-start-1" />
        </motion.div>
      </div>
    </section>
  );
}
