import { memo } from 'react';

const OUTER = [0, 45, 90, 135, 180, 225, 270, 315];
const INNER = OUTER.map((deg) => deg + 22.5);

/** The Svaraa lotus mark, drawn in `currentColor` with a gold centre. */
export const SvaraaMark = memo(function SvaraaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-44 -44 88 88" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round">
        {OUTER.map((deg) => (
          <path key={deg} d="M0-41C13-27 13-13 0 0-13-13-13-27 0-41Z" transform={`rotate(${deg})`} />
        ))}
        {INNER.map((deg) => (
          <path key={deg} d="M0-28C8-19 8-10 0-3-8-10-8-19 0-28Z" transform={`rotate(${deg})`} />
        ))}
      </g>
      <circle r="6.5" fill="var(--c-gold)" />
    </svg>
  );
});
