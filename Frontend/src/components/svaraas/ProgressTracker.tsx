import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

type StepState = 'done' | 'current' | 'upcoming';

const SUBLABEL: Record<StepState, string> = {
  done: 'Completed',
  current: 'In progress',
  upcoming: 'Pending',
};

interface ProgressTrackerProps {
  steps: readonly string[];
  /** Index of the active step. Ignored once `complete`. */
  active: number;
  complete: boolean;
  /** Only animate the current step's pulse while the demo is running. */
  live: boolean;
}

export const ProgressTracker = memo(function ProgressTracker({ steps, active, complete, live }: ProgressTrackerProps) {
  const last = steps.length - 1;
  const fill = complete ? 1 : last > 0 ? Math.min(active, last) / last : 0;
  // The rail runs between the centres of the first and last columns.
  const inset = `${50 / steps.length}%`;

  return (
    <ol
      className="relative grid"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      aria-label="Demo progress"
    >
      <span className="absolute top-[11px] h-0.5 rounded-full bg-line" style={{ left: inset, right: inset }} aria-hidden="true" />
      <motion.span
        className="absolute top-[11px] h-0.5 origin-left rounded-full bg-primary"
        style={{ left: inset, right: inset }}
        initial={false}
        animate={{ scaleX: fill }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      />
      {steps.map((label, i) => {
        const state: StepState = complete || i < active ? 'done' : i === active ? 'current' : 'upcoming';
        return (
          <li
            key={label}
            className="relative flex flex-col items-center gap-2 px-1 text-center"
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span
              className={cn(
                'relative flex size-6 items-center justify-center rounded-full transition-colors duration-300',
                state === 'done' && 'bg-primary text-on-primary',
                state === 'current' && 'border-2 border-primary bg-canvas',
                state === 'upcoming' && 'border-2 border-line bg-canvas',
              )}
            >
              {state === 'done' && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
              {state === 'current' && (
                <>
                  {live && <span className="absolute -inset-1 animate-ping rounded-full bg-primary/20" aria-hidden="true" />}
                  <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
                </>
              )}
            </span>
            <span
              className={cn(
                'text-xs leading-tight sm:text-sm',
                state === 'current' ? 'font-semibold text-primary' : state === 'done' ? 'text-ink' : 'text-subtle',
              )}
            >
              {label}
              <span className="sr-only"> ({SUBLABEL[state]})</span>
            </span>
            <span
              className={cn(
                'hidden text-[0.7rem] sm:block',
                state === 'current' ? 'text-gold' : 'text-subtle',
              )}
              aria-hidden="true"
            >
              {SUBLABEL[state]}
            </span>
          </li>
        );
      })}
    </ol>
  );
});
