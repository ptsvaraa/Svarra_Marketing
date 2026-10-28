import { memo, useMemo } from 'react';
import { cn } from '../../lib/cn';

interface WaveformProps {
  bars?: number;
  active: boolean;
  /** 0–1. Bars before this point use the played colour. Omit for a uniform wave. */
  progress?: number;
  seed?: number;
  className?: string;
  barClassName?: string;
}

/** Deterministic bar heights so the shape is stable across renders. */
function shape(bars: number, seed: number): number[] {
  return Array.from({ length: bars }, (_, i) => {
    const v = Math.abs(Math.sin(i * 0.83 + seed) * Math.cos(i * 0.29 + seed * 1.7));
    return 0.22 + 0.78 * v;
  });
}

export const Waveform = memo(function Waveform({
  bars = 40,
  active,
  progress,
  seed = 1,
  className,
  barClassName,
}: WaveformProps) {
  const heights = useMemo(() => shape(bars, seed), [bars, seed]);
  const played = progress === undefined ? bars : Math.round(progress * bars);

  return (
    <div
      className={cn('flex h-9 items-center gap-[3px] overflow-hidden', className)}
      data-active={active}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            'wave-bar w-[3px] shrink-0 rounded-full transition-colors duration-500',
            i < played ? 'bg-gold' : 'bg-subtle/40',
            barClassName,
          )}
          style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${-(i % 11) * 0.11}s` }}
        />
      ))}
    </div>
  );
});
