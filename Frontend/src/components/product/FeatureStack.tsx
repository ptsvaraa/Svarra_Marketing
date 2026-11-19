import { createRef, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { FOLD_FEATURE_ICONS, type FoldFeatureIcon } from '../../data/svaraaFold';
import { cn } from '../../lib/cn';

interface FeatureStackProps {
  /** Renders a feature's line icon. */
  icon: (icon: FoldFeatureIcon) => ReactNode;
  /** Skip the scale-down of cards beneath the top one. */
  reduceMotion: boolean;
}

/** How far each card sits below the one before it once stacked, in px. */
const PEEK = 12;
/** Roughly where the stack pins below the top of the screen (the navbar's height plus a gap), in px. */
const STACK_TOP = 96;

const gold = (percent: number) => `color-mix(in oklab, var(--c-gold) ${percent}%, transparent)`;

/**
 * The six features as cards that pin and pile up as the page scrolls, each one sliding over
 * the last while those beneath ease back, in the style of Apple's product pages. A buried
 * card fades its content out as the next one covers it, so only its gold edge shows.
 */
export function FeatureStack({ icon, reduceMotion }: FeatureStackProps) {
  const ref = useRef<HTMLUListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const cards = useMemo(() => FOLD_FEATURE_ICONS.map(() => createRef<HTMLLIElement>()), []);
  const n = FOLD_FEATURE_ICONS.length;

  return (
    <ul
      ref={ref}
      aria-label="Svaraa Fold features"
      // The bottom padding leaves room for the last card to scroll up into its place on the pile
      // and hold there for a moment, on any screen height.
      // (screen height − where the last card pins − the shortest card's height, plus a short hold).
      className="relative flex flex-col gap-[22vh] pb-[calc(100svh-var(--stack-top)-60px-19rem+8vh)] [--stack-top:5.25rem] sm:gap-[26vh] sm:pb-[calc(100svh-var(--stack-top)-60px-20.5rem+8vh)] lg:[--stack-top:6.5rem]"
    >
      {FOLD_FEATURE_ICONS.map((f, i) => (
        <FeatureCard
          key={f.id}
          feature={f}
          index={i}
          count={n}
          selfRef={cards[i]!}
          nextRef={cards[i + 1]}
          progress={scrollYProgress}
          icon={icon(f)}
          reduceMotion={reduceMotion}
        />
      ))}
    </ul>
  );
}

interface FeatureCardProps {
  feature: FoldFeatureIcon;
  index: number;
  count: number;
  selfRef: RefObject<HTMLLIElement | null>;
  /** The card that slides over this one; none for the last. */
  nextRef?: RefObject<HTMLLIElement | null>;
  progress: MotionValue<number>;
  icon: ReactNode;
  reduceMotion: boolean;
}

function FeatureCard({ feature, index, count, selfRef, nextRef, progress, icon, reduceMotion }: FeatureCardProps) {
  const depth = count - 1 - index;
  // Cards beneath the top one ease back a little, more the deeper they sit.
  const scale = useTransform(progress, [index / count, 1], [1, reduceMotion ? 1 : 1 - depth * 0.03]);
  // Track the next card's top edge as it travels up over this one: 0 when it is 220px below this
  // card's pinned top, 1 when it has nearly reached it. Measured on screen, so it holds on any device.
  const top = STACK_TOP + index * PEEK;
  const { scrollYProgress: covered } = useScroll({
    target: nextRef ?? selfRef,
    offset: [`start ${top + 220}px`, `start ${top + 24}px`],
  });
  const contentOpacity = useTransform(covered, [0, 1], [1, nextRef ? 0 : 1]);
  const dim = useTransform(covered, [0, 1], [0, nextRef && !reduceMotion ? 0.45 : 0]);
  const number = String(index + 1).padStart(2, '0');

  return (
    <motion.li
      ref={selfRef}
      className="sticky origin-top"
      style={{ top: `calc(var(--stack-top) + ${index * PEEK}px)`, scale }}
    >
      {/* Gold gradient border: a 1px frame around the card body. */}
      <article
        className="relative rounded-[30px] p-px shadow-[0_30px_70px_-34px_var(--c-shadow)]"
        style={{ background: `linear-gradient(140deg, ${gold(75)}, ${gold(10)} 32%, ${gold(6)} 62%, ${gold(55)})` }}
        aria-labelledby={`feature-${feature.id}`}
      >
        <div className="relative flex min-h-[19rem] flex-col overflow-hidden rounded-[29px] bg-canvas p-6 sm:min-h-[20.5rem] sm:p-9">
          {/* Light: a warm glow top right, a faint plum one bottom left. */}
          <span aria-hidden="true" className="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-gold/20 blur-3xl" />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          {/* The feature's icon again, large and faint, as a watermark. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -bottom-10 size-44 -rotate-12 text-gold opacity-[0.08] sm:size-56 [&_svg]:size-full"
          >
            {icon}
          </span>

          <motion.div className="relative flex flex-1 flex-col" style={{ opacity: contentOpacity }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold/12 text-gold ring-1 ring-gold/30 sm:size-14">
                  {icon}
                </span>
                <span className="text-[0.68rem] font-medium tracking-[0.24em] text-gold uppercase">Feature {number}</span>
              </div>
              {/* Big outlined number. */}
              <span
                aria-hidden="true"
                className="font-serif text-6xl leading-[0.8] text-transparent tabular-nums sm:text-7xl"
                style={{ WebkitTextStroke: `1px ${gold(60)}` }}
              >
                {number}
              </span>
            </div>

            <h3
              id={`feature-${feature.id}`}
              className="mt-7 font-serif text-[1.8rem] leading-[1.1] tracking-tight text-heading sm:mt-9 sm:text-[2.4rem]"
            >
              {feature.lines[0]} <em className="text-accent">{feature.lines[1]}</em>
            </h3>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted sm:text-base">{feature.brief}</p>
            {feature.note && (
              <p className="mt-4 self-start rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs leading-snug text-muted">
                {feature.note}
              </p>
            )}

            {/* Where this card sits in the six. */}
            <div className="mt-auto flex gap-1.5 pt-7" aria-hidden="true">
              {Array.from({ length: count }, (_, i) => (
                <span key={i} className={cn('h-1 w-7 rounded-full', i <= index ? 'bg-gold' : 'bg-line')} />
              ))}
            </div>
          </motion.div>

          {/* Covered cards dim, leaving just their gold edge. */}
          <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-canvas" style={{ opacity: dim }} />
        </div>
      </article>
    </motion.li>
  );
}
