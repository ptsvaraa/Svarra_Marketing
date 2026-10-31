import { Archive, ArrowRight, BellRing, Check, MessageCircle, Music, Puzzle, ShieldAlert, Sunrise, type LucideIcon } from 'lucide-react';
import { SVARAAS, type SvaraaId } from '../../data/svaraas';
import { cn } from '../../lib/cn';

const ICONS: Record<SvaraaId, LucideIcon> = {
  recite: Music,
  respond: MessageCircle,
  remind: BellRing,
  rescue: ShieldAlert,
  recall: Sunrise,
  repository: Archive,
  riddle: Puzzle,
};

interface SvaraaCardsProps {
  /** Opens this svaraa's live demo; the card's link scrolls down to it. */
  onOpenDemo: (id: SvaraaId) => void;
}

function CardList({ clone = false, onOpenDemo }: SvaraaCardsProps & { clone?: boolean }) {
  return (
    <ul
      className={cn('flex shrink-0 gap-5 pr-5 sm:gap-6 sm:pr-6', clone && 'marquee-clone')}
      // The clone only exists to make the loop seamless; hide it from assistive tech and tab order.
      aria-hidden={clone || undefined}
    >
      {SVARAAS.map((s) => {
        const Icon = ICONS[s.id];
        return (
          <li key={s.id} className="flex shrink-0">
            <a
              href="#svaraas"
              onClick={() => onOpenDemo(s.id)}
              tabIndex={clone ? -1 : undefined}
              aria-label={`${s.label}: ${s.subheadline} Open the live demo.`}
              className="group flex w-[290px] flex-col rounded-3xl border border-line bg-glass-strong p-6 shadow-[0_18px_40px_-28px_var(--c-shadow)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_48px_-26px_var(--c-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-[330px] sm:p-7"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="font-serif text-2xl text-gold">{s.ordinal}</span>
              </div>
              <h3 className="mt-6 font-serif text-2xl text-heading">{s.label}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.subheadline}</p>
              <ul className="mt-5 space-y-2">
                {s.checklist.slice(0, 3).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary">
                See it live
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** An auto-scrolling row of the seven capabilities; each card opens its live demo below. */
export function SvaraaCards({ onOpenDemo }: SvaraaCardsProps) {
  return (
    <section aria-labelledby="svaraa-cards-title" className="pt-10 sm:pt-14">
      <header className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">The 7 Svaraas</p>
        <h2 id="svaraa-cards-title" className="mt-4 font-serif text-4xl leading-tight tracking-tight text-balance text-heading sm:text-5xl">
          Seven ways Svaraa <em className="text-accent">cares.</em>
        </h2>
      </header>

      <div className="mx-auto mt-10 max-w-[1320px] sm:px-6 lg:px-10">
        {/* Pauses on hover or keyboard focus; with reduced motion it becomes a still row to scroll by hand. */}
        <div className="marquee-viewport no-scrollbar overflow-hidden py-4">
          <div className="marquee-track flex w-max items-stretch" style={{ animationDuration: '50s' }}>
            <CardList onOpenDemo={onOpenDemo} />
            <CardList clone onOpenDemo={onOpenDemo} />
          </div>
        </div>
      </div>
    </section>
  );
}
