import { memo } from 'react';
import { SVARAA_MARK_CENTRE_R, SVARAA_MARK_PETALS } from './svaraaMarkPath';

/** The Svaraa lotus mark, drawn in `currentColor` with a gold centre. */
export const SvaraaMark = memo(function SvaraaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-445 -470 890 890" className={className} aria-hidden="true" focusable="false">
      <path d={SVARAA_MARK_PETALS} fill="currentColor" fillRule="evenodd" />
      <circle r={SVARAA_MARK_CENTRE_R} fill="var(--c-gold)" />
    </svg>
  );
});
