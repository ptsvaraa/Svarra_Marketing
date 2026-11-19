import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { FOLD_FEATURE_ICONS, type FoldFeatureIcon } from '../../data/svaraaFold';

interface FeatureStackProps {
  /** Renders a feature's line icon. */
  icon: (icon: FoldFeatureIcon) => ReactNode;
  /** Skip the scale-down of cards beneath the top one. */
  reduceMotion: boolean;
}

/** How far each card sits below the one before it once stacked, in px. */
const PEEK = 14;

/**
 * The six features as cards that pin and pile up as the page scrolls, each one sliding over
 * the last while those beneath ease back, in the style of Apple's product pages.
 */
export function FeatureStack({ icon, reduceMotion }: FeatureStackProps) {
  const ref = useRef<HTMLUListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const n = FOLD_FEATURE_ICONS.length;

  return (
    <ul
      ref={ref}
      aria-label="Svaraa Fold features"
      className="relative flex flex-col gap-[28vh] pb-[12vh] [--stack-top:5.5rem] lg:[--stack-top:6.5rem]"
    >
      {FOLD_FEATURE_ICONS.map((f, i) => (
        <FeatureCard key={f.id} feature={f} index={i} count={n} progress={scrollYProgress} icon={icon(f)} reduceMotion={reduceMotion} />
      ))}
    </ul>
  );
}

interface FeatureCardProps {
  feature: FoldFeatureIcon;
  index: number;
  count: number;
  progress: MotionValue<number>;
  icon: ReactNode;
  reduceMotion: boolean;
}

function FeatureCard({ feature, index, count, progress, icon, reduceMotion }: FeatureCardProps) {
  // Once the next card starts to arrive, this one eases back a little, more the deeper it sits.
  const depth = count - 1 - index;
  const scale = useTransform(progress, [index / count, 1], [1, reduceMotion ? 1 : 1 - depth * 0.035]);
  const dim = useTransform(progress, [(index + 1) / count, 1], [0, reduceMotion || depth === 0 ? 0 : 0.35]);

  return (
    <motion.li className="sticky origin-top" style={{ top: `calc(var(--stack-top) + ${index * PEEK}px)`, scale }}>
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-[radial-gradient(120%_90%_at_100%_0%,var(--c-tint),transparent_60%),linear-gradient(var(--c-canvas),var(--c-canvas))] p-6 shadow-[0_18px_50px_-24px_var(--c-shadow)] sm:p-8">
        {/* Soft gold glow in the corner. */}
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-gold/25 opacity-60 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            {icon}
          </span>
          <span className="font-serif text-5xl leading-none text-primary/25 tabular-nums" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <h3 className="relative mt-6 font-serif text-[1.9rem] leading-tight text-heading sm:text-[2.2rem]">
          {feature.lines[0]} <em className="text-accent">{feature.lines[1]}</em>
        </h3>
        <p className="relative mt-3 max-w-md text-base leading-relaxed text-muted">{feature.brief}</p>
        {feature.note && <p className="relative mt-3 text-xs text-subtle">{feature.note}</p>}

        {/* Cards beneath the top one dim slightly. */}
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-canvas" style={{ opacity: dim }} />
      </div>
    </motion.li>
  );
}
