import { useEffect, useId, useRef, useState } from 'react';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import {
  FOLD_DEFAULT_VIEW,
  FOLD_FEATURE_ICONS,
  FOLD_PHOTOS,
  FOLD_VIEWS,
  foldViewById,
  type FoldFeatureIcon,
  type FoldPhoto,
  type FoldView,
} from '../../data/svaraaFold';
import { cn } from '../../lib/cn';
import type { FoldScene } from './foldScene';

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'unsupported';
type Overrides = { explode: number; fold: number } | null;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function IconGlyph({ icon }: { icon: FoldFeatureIcon }) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon.shapes.map((s, i) =>
        s.type === 'path' ? (
          <path key={i} d={s.d} />
        ) : s.type === 'rect' ? (
          <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} />
        ) : (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />
        ),
      )}
    </svg>
  );
}

export function FoldExplorer() {
  const [selectedId, setSelectedId] = useState<string>(FOLD_DEFAULT_VIEW);
  const [hoverId, setHoverId] = useState<string | null>(null);
  /** Slider values for the pinned view; null falls back to the view's own defaults. */
  const [overrides, setOverrides] = useState<Overrides>(null);
  const [auto, setAuto] = useState(() => !prefersReducedMotion());
  const [status, setStatus] = useState<ViewerStatus>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FoldScene | null>(null);
  const explodeId = useId();
  const foldId = useId();

  const shownId = hoverId ?? selectedId;
  const shown = foldViewById(shownId);
  const hovering = hoverId !== null && hoverId !== selectedId;
  const own = shownId === selectedId && overrides !== null;
  // Sliders work in 0–100; view defaults are stored as 0–1.
  const explode = own ? overrides.explode : shown.explode * 100;
  const fold = own ? overrides.fold : shown.fold * 100;

  const pick = (id: string) => {
    setSelectedId(id);
    setHoverId(null);
    setOverrides(null);
  };
  const preview = (id: string) => setHoverId(id);
  const unpreview = (id: string) => setHoverId((cur) => (cur === id ? null : cur));
  const hoverProps = (v: FoldView) => ({
    onMouseEnter: () => preview(v.id),
    onMouseLeave: () => unpreview(v.id),
    onFocus: () => preview(v.id),
    onBlur: () => unpreview(v.id),
    onClick: () => pick(v.id),
  });

  /** Moving a slider pins the view being shown. Opening one way closes the other, as in the design. */
  const onSlider = (which: 'explode' | 'fold', value: number) => {
    const base = { explode, fold };
    if (shownId !== selectedId) {
      setSelectedId(shownId);
      setHoverId(null);
    }
    setOverrides(
      which === 'explode'
        ? { explode: value, fold: value > 0 ? 0 : base.fold }
        : { fold: value, explode: value > 0 ? 0 : base.explode },
    );
  };

  // Load three.js and build the scene only once the viewer is near the screen.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let cancelled = false;
    let scene: FoldScene | null = null;
    let onScreen = false;
    const sync = () => scene?.setRunning(onScreen && document.visibilityState === 'visible');

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = !!entry?.isIntersecting;
        if (onScreen && !scene && !cancelled) {
          setStatus('loading');
          import('./foldScene')
            .then(({ FoldScene }) => {
              if (cancelled) return;
              try {
                scene = new FoldScene(canvas);
              } catch {
                setStatus('unsupported');
                return;
              }
              sceneRef.current = scene;
              setStatus('ready');
              sync();
            })
            .catch(() => !cancelled && setStatus('unsupported'));
        }
        sync();
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(stage);
    document.addEventListener('visibilitychange', sync);

    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.show(shown, { explode: explode / 100, fold: fold / 100 });
  }, [shown, explode, fold, status]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(auto);
  }, [auto, status]);

  const photoTile = (photo: FoldPhoto, className: string) => {
    const info = FOLD_PHOTOS[photo];
    const views = FOLD_VIEWS.filter((v) => v.source === photo);
    return (
      <div
        className={cn('relative overflow-hidden bg-tint', className)}
        style={{ aspectRatio: `${info.aspect[0]} / ${info.aspect[1]}` }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/${info.file}`}
          alt={info.alt}
          width={info.aspect[0]}
          height={info.aspect[1]}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        {views.flatMap((v) =>
          (v.hotspots ?? []).map(([l, t, w, h], i) => {
            const active = v.id === shownId;
            const pinned = v.id === selectedId;
            return (
              <button
                key={`${v.id}-${i}`}
                type="button"
                aria-label={`View ${v.label} in 3D`}
                aria-pressed={pinned}
                {...hoverProps(v)}
                className={cn(
                  'absolute rounded-xl border-2 transition-colors duration-150 focus-visible:outline-none',
                  active ? 'border-primary bg-primary/10' : pinned ? 'border-primary/55' : 'border-transparent hover:border-primary/40',
                )}
                style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}
              >
                {active && (
                  <span className="pointer-events-none absolute bottom-2.5 left-1/2 hidden -translate-x-1/2 rounded-full bg-primary px-3 py-1.5 text-xs font-medium whitespace-nowrap text-on-primary shadow-lg sm:block">
                    {v.label} · 3D
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    );
  };

  return (
    <section id="product" aria-labelledby="product-title" className="scroll-mt-6 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div>
            <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Svaraa Fold · Fold-over pendant</p>
            <h2 id="product-title" className="mt-4 font-serif text-4xl leading-tight tracking-tight text-heading sm:text-5xl">
              Explore the fold-over pendant <em className="text-accent">in 3D</em>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted">
            Hover the pendant, a feature or the charging kit to preview it in 3D, and click to pin it. Drag to orbit,
            pinch or use the zoom buttons to zoom, and double-click to reset.
          </p>
        </header>

        <div className="mt-10 grid items-start gap-6 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          {/* 3D viewer */}
          <section aria-label="3D viewer" className="glass flex min-w-0 flex-col overflow-hidden rounded-[24px] lg:order-none">
            <div ref={stageRef} className="relative h-[340px] bg-tint sm:h-[420px] lg:h-[470px]">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Interactive 3D model: ${shown.label}`}
                className="block size-full cursor-grab touch-pan-y select-none"
              />
              {status !== 'ready' && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted" role="status">
                  {status === 'unsupported'
                    ? '3D preview needs WebGL, which this browser has turned off. The photos still show every part.'
                    : 'Loading 3D model…'}
                </div>
              )}
              <span
                className={cn(
                  'pointer-events-none absolute top-4 left-4 rounded-full px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.12em] uppercase',
                  hovering ? 'bg-accent text-white' : 'bg-primary text-on-primary',
                )}
              >
                {hovering ? 'Previewing' : '3D view'}
              </span>
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                {[
                  { label: 'Zoom in', icon: Plus, run: () => sceneRef.current?.zoomBy(1 / 1.2) },
                  { label: 'Zoom out', icon: Minus, run: () => sceneRef.current?.zoomBy(1.2) },
                  { label: 'Reset view', icon: RotateCcw, run: () => sceneRef.current?.resetView() },
                ].map(({ label, icon: Icon, run }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    onClick={run}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-glass-strong text-heading transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5 pb-6 sm:px-6">
              <div aria-live="polite">
                <h3 className="font-serif text-[1.75rem] leading-tight text-heading">{shown.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{shown.description}</p>
              </div>

              {shown.model === 'svaraa' && (
                <div className="flex flex-col gap-2">
                  {[
                    { id: explodeId, label: 'Explode', value: explode, key: 'explode' as const },
                    { id: foldId, label: 'Fold', value: fold, key: 'fold' as const },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center gap-3">
                      <label htmlFor={s.id} className="w-16 text-sm font-medium text-heading">
                        {s.label}
                      </label>
                      <input
                        id={s.id}
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(s.value)}
                        onChange={(e) => onSlider(s.key, Number(e.target.value))}
                        className="h-6 flex-1 accent-[var(--c-primary)]"
                      />
                      <span className="w-10 text-right text-sm text-muted tabular-nums">{Math.round(s.value)}%</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={auto}
                  onClick={() => setAuto((a) => !a)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    auto ? 'border-primary bg-primary text-on-primary' : 'border-line bg-glass-strong text-heading hover:border-primary/40',
                  )}
                >
                  {auto ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                  Auto-rotate: {auto ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetView()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-glass-strong px-4 text-sm font-medium text-heading transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Reset view
                </button>
              </div>
            </div>
          </section>

          {/* Photos with hotspots, and the feature icons */}
          <div className="flex min-w-0 flex-col gap-2">
            {photoTile('hero', 'rounded-[20px]')}
            <div className="flex gap-2">
              <div style={{ flex: '306 1 0' }} className="min-w-0">
                {photoTile('flat', 'rounded-2xl')}
              </div>
              <div style={{ flex: '386 1 0' }} className="min-w-0">
                {photoTile('kit', 'rounded-2xl')}
              </div>
            </div>

            <div
              role="group"
              aria-label="Svaraa Fold features"
              className="glass mt-2 grid grid-cols-3 gap-1 rounded-2xl p-2 sm:grid-cols-6"
            >
              {FOLD_FEATURE_ICONS.map((icon) => {
                const v = foldViewById(icon.id);
                const pinned = v.id === selectedId;
                const active = v.id === shownId;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    aria-label={`View ${v.label} in 3D`}
                    aria-pressed={pinned}
                    {...hoverProps(v)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl px-1 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                      active && !pinned && 'bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'relative inline-flex size-12 items-center justify-center rounded-full transition-colors',
                        pinned
                          ? 'bg-primary text-on-primary'
                          : active
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary/10 text-primary',
                      )}
                    >
                      <IconGlyph icon={icon} />
                      <span className="absolute top-0.5 right-0 size-2.5 rounded-full border-2 border-canvas bg-accent" aria-hidden="true" />
                    </span>
                    <span className="text-center text-xs leading-snug text-ink">
                      {icon.lines[0]}
                      <br />
                      {icon.lines[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-subtle">Concept design.</p>
      </div>
    </section>
  );
}
