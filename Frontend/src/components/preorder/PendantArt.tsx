import { memo, useId } from 'react';
import { SVARAA_MARK_CENTRE_R, SVARAA_MARK_PETALS } from '../brand/svaraaMarkPath';

/** Speaker perforations: two curved rows of holes in the slot near the top edge. */
const HOLES = (() => {
  const holes: { x: number; y: number }[] = [];
  for (const [r, count] of [[73, 17], [79, 19]] as const) {
    for (let i = 0; i < count; i++) {
      const a = -0.5 + (1 * i) / (count - 1);
      holes.push({ x: Math.sin(a) * r, y: -Math.cos(a) * r });
    }
  }
  return holes;
})();

/** Status lights: one in the lotus's top petal, four in a row below it. */
const LIGHTS = [
  { x: 0, y: -52 },
  ...[-24, -8, 8, 24].map((x) => ({ x, y: 70 })),
];

/** The lotus mark's petals reach 452 units from its centre; this draws them 62 units across. */
const MARK_SCALE = 62 / 452;
const MARK_Y = -8;

/**
 * The Svaraa Fold pendant, drawn as vector art so it stays crisp at any size: folded and
 * hanging from its gold cord, with the matte-black face, gold lotus mark, centre button,
 * speaker slot and status lights, as in the 3D model.
 */
export const PendantArt = memo(function PendantArt({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const g = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${g(name)})`;

  return (
    <svg
      viewBox="-135 -168 270 280"
      className={className}
      role="img"
      aria-label="The Svaraa Fold pendant: a matte-black face with the gold Svaraa lotus, centre button and glowing lights, on a gold cord."
    >
      <defs>
        <radialGradient id={g('body')} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#2f2f34" />
          <stop offset="0.55" stopColor="#18181b" />
          <stop offset="1" stopColor="#0b0b0d" />
        </radialGradient>
        <linearGradient id={g('rim')} x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#5a5a62" />
          <stop offset="0.5" stopColor="#1d1d21" />
          <stop offset="1" stopColor="#3a3a40" />
        </linearGradient>
        <linearGradient id={g('gold')} x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe39a" />
          <stop offset="0.5" stopColor="#f4bb35" />
          <stop offset="1" stopColor="#c98a1c" />
        </linearGradient>
        <linearGradient id={g('cord')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9831f" />
          <stop offset="0.5" stopColor="#f6d27a" />
          <stop offset="1" stopColor="#b9831f" />
        </linearGradient>
        <radialGradient id={g('dome')} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#fff2c4" />
          <stop offset="0.45" stopColor="#f6bf3a" />
          <stop offset="1" stopColor="#a8700f" />
        </radialGradient>
        <radialGradient id={g('sheen')} cx="30%" cy="18%" r="60%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={g('glow')} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Gold braided cord, through the folded bridge loop */}
      <g fill="none" stroke={url('cord')} strokeWidth="5.5" strokeLinecap="round">
        <path d="M-9-121C-30-138-58-152-92-166" />
        <path d="M9-121C30-138 58-152 92-166" />
      </g>
      <path d="M-24-93C-24-121 24-121 24-93" fill="none" stroke="#141417" strokeWidth="17" strokeLinecap="round" />
      <path d="M-24-96C-24-119 24-119 24-96" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="2" strokeLinecap="round" />

      {/* Body: a soft matte-black pebble */}
      <circle r="102" fill={url('rim')} />
      <circle r="98" fill={url('body')} />

      {/* Speaker slot */}
      <path d="M-40.4-65.4A76.5 76.5 0 0 1 40.4-65.4" fill="none" stroke="#060607" strokeWidth="15" strokeLinecap="round" />
      {HOLES.map((h, i) => (
        <circle key={i} cx={h.x} cy={h.y + 0.5} r="1.25" fill="#34343a" />
      ))}

      {/* The Svaraa lotus mark, in gold */}
      <g transform={`translate(0 ${MARK_Y}) scale(${MARK_SCALE})`}>
        <path d={SVARAA_MARK_PETALS} fill={url('gold')} fillRule="evenodd" />
        <circle r={SVARAA_MARK_CENTRE_R} fill={url('gold')} />
      </g>

      {/* Centre button: a polished gold dome */}
      <circle cy={MARK_Y} r="14" fill="#7a5210" opacity="0.6" />
      <circle cy={MARK_Y - 0.6} r="12.5" fill={url('dome')} />

      {/* Status lights */}
      <g filter={url('glow')} fill="#ffcf4d">
        {LIGHTS.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={i === 0 ? 3.4 : 3} />
        ))}
      </g>

      <circle r="98" fill={url('sheen')} />
    </svg>
  );
});
