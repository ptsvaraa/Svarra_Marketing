import { memo, useId } from 'react';

const OUTER = [0, 45, 90, 135, 180, 225, 270, 315];
const INNER = OUTER.map((deg) => deg + 22.5);

/** Speaker perforations: a crescent of holes near the top edge, as on the design sheet. */
const HOLES = (() => {
  const holes: { x: number; y: number }[] = [];
  for (let row = 0; row < 4; row++) {
    const r = 78 - row * 6.5;
    const count = 15 - row * 2;
    for (let i = 0; i < count; i++) {
      const a = -0.55 + (1.1 * i) / (count - 1);
      holes.push({ x: Math.sin(a) * r, y: -Math.cos(a) * r });
    }
  }
  return holes;
})();

/**
 * The Svaraa Fold pendant, drawn as vector art so it stays crisp at any size:
 * dusty-rose silicone sleeve, aubergine face, gold lotus and a flush centre button.
 */
export const PendantArt = memo(function PendantArt({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const g = (name: string) => `${uid}-${name}`;

  return (
    <svg viewBox="-110 -110 220 220" className={className} role="img" aria-label="The Svaraa Fold pendant: an aubergine face with a gold lotus, set in a dusty-rose sleeve.">
      <defs>
        <radialGradient id={g('sleeve')} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#e6bdb2" />
          <stop offset="0.55" stopColor="#c8968b" />
          <stop offset="1" stopColor="#9c6c63" />
        </radialGradient>
        <radialGradient id={g('face')} cx="38%" cy="30%" r="85%">
          <stop offset="0" stopColor="#6a3a4d" />
          <stop offset="0.6" stopColor="#4e2a38" />
          <stop offset="1" stopColor="#331a24" />
        </radialGradient>
        <linearGradient id={g('gold')} x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#f2cf8e" />
          <stop offset="1" stopColor="#c99449" />
        </linearGradient>
        <radialGradient id={g('sheen')} cx="30%" cy="20%" r="60%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sleeve and its loop at the top */}
      <rect x="-14" y="-108" width="28" height="12" rx="6" fill="#b58479" />
      <rect x="-8" y="-105" width="16" height="5" rx="2.5" fill="#5a3640" />
      <circle r="100" fill={`url(#${g('sleeve')})`} />
      <circle r="100" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1" />

      {/* Face */}
      <circle r="86" fill={`url(#${g('face')})`} />
      <circle r="86" fill="none" stroke="#2a1219" strokeOpacity="0.5" strokeWidth="1.5" />
      {HOLES.map((h, i) => (
        <circle key={i} cx={h.x} cy={h.y} r="1.7" fill="#1f0f16" />
      ))}

      {/* Gold lotus */}
      <g transform="scale(1.45)" fill="none" stroke={`url(#${g('gold')})`} strokeWidth="1.5" strokeLinejoin="round">
        {OUTER.map((deg) => (
          <path key={deg} d="M0-41C13-27 13-13 0 0-13-13-13-27 0-41Z" transform={`rotate(${deg})`} />
        ))}
        {INNER.map((deg) => (
          <path key={deg} d="M0-28C8-19 8-10 0-3-8-10-8-19 0-28Z" transform={`rotate(${deg})`} />
        ))}
      </g>

      <circle r="100" fill={`url(#${g('sheen')})`} />
      {/* Flat gold centre, like the logo's; drawn after the sheen so it stays a clean, even gold. */}
      <circle r="17" fill={`url(#${g('gold')})`} />
    </svg>
  );
});
