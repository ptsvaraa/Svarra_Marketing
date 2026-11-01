import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Inner surface used inside the live demo. Solid-ish, no blur, for performance. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-glass-strong p-4 sm:p-5', className)}>
      {children}
    </div>
  );
}

export function IconTile({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-tint text-primary',
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
