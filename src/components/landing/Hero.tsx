import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { SVARAAS, type SvaraaId } from '../../data/svaraas';
import { cn } from '../../lib/cn';
import { imageSrc, imageSrcSet, IMAGE_HEIGHT, IMAGE_WIDTH, preloadImages } from '../../lib/images';
import { SvaraaTabs, tabId } from '../svaraas/SvaraaTabs';

const TAB_PREFIX = 'hero';
const PANEL_ID = 'hero-showcase';
const HERO_SIZES = '(min-width: 1024px) 620px, calc(100vw - 2rem)';

interface HeroProps {
  selected: SvaraaId;
  onSelect: (id: SvaraaId) => void;
  /** Opens the live demo for the svaraa currently shown in the hero. */
  onOpenDemo: (id: SvaraaId) => void;
}

export function Hero({ selected, onSelect, onOpenDemo }: HeroProps) {
  const svaraa = SVARAAS.find((s) => s.id === selected) ?? SVARAAS[0]!;

  // Warm the other photos on idle so switching tabs crossfades without a blank frame.
  useEffect(() => preloadImages(SVARAAS.map((s) => s.image.name), HERO_SIZES), []);

  return (
    <section id="about" aria-labelledby="hero-title" className="scroll-mt-6">
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:px-10 lg:pt-20 xl:grid-cols-2 xl:items-stretch xl:pb-28">
        {/* On wide screens this column ends at the CTA buttons, and the photo stretches to that same line. */}
        <div className="xl:relative">
          <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Introducing Svaraa</p>
          <h1
            id="hero-title"
            className="mt-6 font-serif text-5xl leading-[1.05] tracking-tight text-heading sm:text-6xl lg:text-7xl"
          >
            Care, in harmony.
            <em className="block text-accent">Life, on their terms.</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            An AI-powered, voice-first wearable platform for older adults and those who care for them.
          </p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Bringing families, caretakers and guardians together in one thoughtful ecosystem of care and wellbeing.
          </p>
          {/* One row on wide screens, so the photo always ends at the same line. */}
          <div className="mt-9 flex flex-wrap gap-4 xl:flex-nowrap">
            <a
              href="#svaraas"
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-primary px-7 text-[1.05rem] font-medium text-on-primary shadow-[0_14px_30px_-16px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Explore the 7 Svaraas
              <ArrowRight className="size-5" aria-hidden="true" />
            </a>
            <a
              href="#svaraas"
              onClick={() => onOpenDemo(svaraa.id)}
              className="inline-flex h-14 items-center gap-3 rounded-xl border border-primary/40 bg-glass-strong px-7 text-[1.05rem] font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Play className="size-4" fill="currentColor" aria-hidden="true" />
              {/* Every label is stacked in one cell so the button is always as wide as the longest one.
                  Otherwise "Repository" widens it, the buttons wrap, and the photo beside them grows. */}
              <span className="grid">
                {SVARAAS.map((s) => (
                  <span key={s.id} className={cn('col-start-1 row-start-1', s.id !== svaraa.id && 'invisible')}>
                    Watch the {s.label} demo
                  </span>
                ))}
              </span>
            </a>
          </div>
          <p className="mt-6 text-sm text-subtle xl:absolute xl:top-full xl:left-0">
            Thoughtfully designed. Currently in development.
          </p>
        </div>

        <div className="min-w-0 xl:flex xl:flex-col">
          <SvaraaTabs
            items={SVARAAS}
            selected={selected}
            onSelect={onSelect}
            idPrefix={TAB_PREFIX}
            panelId={PANEL_ID}
            label="Svaraa capabilities"
            // Spread across the photo width on wide screens, so "Recite" lines up with its left edge.
            className="mb-4 lg:justify-end xl:flex-nowrap xl:justify-between"
          />
          <div
            id={PANEL_ID}
            role="tabpanel"
            aria-labelledby={tabId(TAB_PREFIX, selected)}
            className="xl:relative xl:flex xl:min-h-0 xl:flex-1 xl:flex-col"
          >
            <div className="glass rounded-[28px] p-1.5 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-tint xl:aspect-auto xl:flex-1">
                {/* Images stack and crossfade; absolute positioning keeps the box size fixed. */}
                <AnimatePresence initial={false}>
                  <motion.img
                    key={svaraa.id}
                    src={imageSrc(svaraa.image.name)}
                    srcSet={imageSrcSet(svaraa.image.name)}
                    sizes={HERO_SIZES}
                    width={IMAGE_WIDTH}
                    height={IMAGE_HEIGHT}
                    alt={svaraa.image.alt}
                    decoding="async"
                    fetchPriority={svaraa.id === 'recite' ? 'high' : 'auto'}
                    className="absolute inset-0 size-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </AnimatePresence>
              </div>
            </div>
            {/* Caption sits under the photo. On wide screens it hangs below the column, like the note under the
                buttons, so the photo still ends level with them. */}
            <p className="mt-4 px-1 font-serif text-lg leading-snug text-heading italic sm:text-xl xl:absolute xl:top-full xl:right-0 xl:left-0">
              <span className="mr-2 font-sans text-xs font-medium tracking-[0.2em] text-gold not-italic uppercase">
                {svaraa.ordinal} · {svaraa.label}
              </span>
              {svaraa.subheadline}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
