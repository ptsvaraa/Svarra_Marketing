import { cn } from '../../lib/cn';
import { SvaraaMark } from './SvaraaMark';

/**
 * A vertical gold rule with the lotus mark in the middle, used between two columns.
 * The mark follows the navbar logo: aubergine in light mode, gold in dark mode.
 */
export function LotusDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center self-stretch', className)} aria-hidden="true">
      <span className="w-px flex-1 bg-gold/40" />
      <SvaraaMark className="my-4 size-12 text-primary dark:text-gold" />
      <span className="w-px flex-1 bg-gold/40" />
    </div>
  );
}
