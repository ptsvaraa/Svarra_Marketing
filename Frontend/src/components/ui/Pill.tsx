import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type Tone = 'success' | 'warn' | 'danger' | 'neutral' | 'primary';

const TONES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-ink/5 text-muted',
  primary: 'bg-primary/10 text-primary',
};

export function Pill({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-300',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** A small "live" dot with a soft ping, used for in-progress indicators. */
export function LiveDot({ tone = 'success', active = true }: { tone?: 'success' | 'warn' | 'muted'; active?: boolean }) {
  const color = tone === 'success' ? 'bg-success' : tone === 'warn' ? 'bg-warn' : 'bg-subtle';
  return (
    <span className="relative inline-flex size-2.5 shrink-0" aria-hidden="true">
      {active && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', color)} />}
      <span className={cn('relative inline-flex size-2.5 rounded-full', color)} />
    </span>
  );
}
