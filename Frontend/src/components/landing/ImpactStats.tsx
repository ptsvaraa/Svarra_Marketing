import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, BellRing, Heart, ShieldCheck, Volume2, type LucideIcon } from 'lucide-react';
import { IMPACT_IS_PLACEHOLDER, IMPACT_METRICS, type ImpactMetric } from '../../data/impact';
import { SvaraaMark } from '../brand/SvaraaMark';

const ICONS: Record<ImpactMetric['id'], LucideIcon> = {
  adherence: BellRing,
  response: ShieldCheck,
  voice: Volume2,
  reassurance: Heart,
};

/** Counts up to `value` once it scrolls into view; jumps straight there with reduced motion. */
function CountUp({ value, run }: { value: number; run: boolean }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value, reduce]);

  return <>{shown}</>;
}

/**
 * Market-research highlights and a pre-order call to action, laid out side by
 * side to stay compact. Light mode uses a deep aubergine panel; dark mode uses
 * a charcoal-plum panel edged in gold, so it sits naturally on the dark page.
 */
export function ImpactStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section aria-labelledby="impact-title" className="px-4 pt-14 pb-4 sm:px-6 sm:pt-16 lg:px-10">
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#2c0a1d_0%,#4a1532_50%,#6f1d47_100%)] px-6 py-10 shadow-[0_30px_60px_-36px_rgba(74,21,50,0.7)] ring-1 ring-white/10 sm:px-10 sm:py-12 lg:px-14 dark:bg-[linear-gradient(135deg,#1d191c_0%,#262025_55%,#33242d_100%)] dark:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.8)] dark:ring-[#e2bd72]/25">
        {/* Soft gold glow and a lotus watermark */}
        <div
          className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(226,189,114,0.18)_0%,transparent_65%)] dark:bg-[radial-gradient(circle,rgba(226,189,114,0.12)_0%,transparent_65%)]"
          aria-hidden="true"
        />
        <SvaraaMark className="pointer-events-none absolute -right-16 -bottom-20 size-72 text-[#e2bd72] opacity-[0.07]" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="text-center lg:text-left">
            <p className="text-xs font-medium tracking-[0.32em] text-[#e2bd72] uppercase">Market research</p>
            <h2
              id="impact-title"
              className="mt-3 font-serif text-3xl leading-tight tracking-tight text-balance text-[#fbf7f2] sm:text-4xl"
            >
              Researched with families. <em className="text-[#e2bd72]">Built for impact.</em>
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-pretty text-[#fbf7f2]/75 lg:mx-0">
              We studied how older adults and the families who care for them manage health, safety and connection every
              day. Here is where Svaraa makes the biggest difference.
            </p>
            <a
              href="/pre-order"
              className="mt-7 inline-flex h-12 items-center gap-2.5 rounded-xl bg-[#e2bd72] px-6 font-medium text-[#2c0a1d] shadow-[0_14px_30px_-14px_rgba(226,189,114,0.7)] transition-colors hover:bg-[#ecca85] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e2bd72]"
            >
              Pre-order Svaraa Fold
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            {IMPACT_IS_PLACEHOLDER && (
              <p className="mt-5 text-xs text-[#fbf7f2]/45">
                Figures shown are placeholders until our market research report is published.
              </p>
            )}
          </div>

          <div ref={ref} className="grid grid-cols-2 gap-3 sm:gap-4">
            {IMPACT_METRICS.map((m, i) => {
              const Icon = ICONS[m.id];
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={inView ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: 'easeOut' }}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5 dark:border-[#e2bd72]/15 dark:bg-[#e2bd72]/[0.05]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e2bd72] text-[#3d1029]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <p className="font-serif text-3xl leading-none text-[#fbf7f2] tabular-nums sm:text-4xl">
                      {/* Screen readers get the final figure; the counting animation is visual only. */}
                      <span className="sr-only">{`${m.prefix ?? ''}${m.value}${m.suffix ?? ''}`}</span>
                      <span aria-hidden="true">
                        {m.prefix}
                        <CountUp value={m.value} run={inView} />
                        {m.suffix}
                      </span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-snug text-pretty text-[#fbf7f2]/75">{m.label}</p>
                  {m.source && <p className="mt-1 text-xs text-[#fbf7f2]/45">{m.source}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
