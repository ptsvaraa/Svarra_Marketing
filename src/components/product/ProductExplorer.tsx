import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { LITE_PARTS, SHEET_HEIGHT, SHEET_WIDTH, type LitePart } from '../../data/svaraaLite';
import { cn } from '../../lib/cn';
import type { LiteScene } from './liteScene';

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;
const partById = (id: string): LitePart => LITE_PARTS.find((p) => p.id === id) ?? LITE_PARTS[0]!;

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'unsupported';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ProductExplorer() {
  const [selectedId, setSelectedId] = useState('overview');
  const [hoverId, setHoverId] = useState<string | null>(null);
  /** Explode override for the pinned part; null falls back to the part's default. */
  const [explodeOverride, setExplodeOverride] = useState<number | null>(null);
  const [auto, setAuto] = useState(() => !prefersReducedMotion());
  const [status, setStatus] = useState<ViewerStatus>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<LiteScene | null>(null);
  const sliderId = useId();

  const shownId = hoverId ?? selectedId;
  const shown = partById(shownId);
  const hovering = hoverId !== null && hoverId !== selectedId;
  const explode = shownId === selectedId && explodeOverride !== null ? explodeOverride : Math.round(shown.explode * 100);
  const hotspots = useMemo(() => LITE_PARTS.filter((p) => p.rect), []);

  const pick = (id: string) => {
    setSelectedId(id);
    setHoverId(null);
    setExplodeOverride(null);
  };
  const preview = (id: string) => setHoverId(id);
  const unpreview = (id: string) => setHoverId((cur) => (cur === id ? null : cur));

  // Load three.js and build the scene only once the viewer is near the screen.
  useEffect(() => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas) return;
    let cancelled = false;
    let scene: LiteScene | null = null;
    let onScreen = false;
    const sync = () => scene?.setRunning(onScreen && document.visibilityState === 'visible');

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = !!entry?.isIntersecting;
        if (onScreen && !scene && !cancelled) {
          setStatus('loading');
          import('./liteScene')
            .then(({ LiteScene }) => {
              if (cancelled) return;
              try {
                scene = new LiteScene(canvas);
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
    io.observe(viewer);
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
    sceneRef.current?.show(shown, explode / 100);
  }, [shown, explode, status]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(auto);
  }, [auto, status]);

  const onExplode = (value: number) => {
    if (shownId !== selectedId) {
      setSelectedId(shownId);
      setHoverId(null);
    }
    setExplodeOverride(value);
  };

  return (
    <section id="product" aria-labelledby="product-title" className="scroll-mt-6 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div>
            <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Svaraa Lite · Interactive model</p>
            <h2 id="product-title" className="mt-4 font-serif text-4xl leading-tight tracking-tight text-heading sm:text-5xl">
              Explore every part <em className="text-accent">in 3D</em>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted">
            Hover any part of the sheet to preview it in 3D, click to pin it. Drag the model to orbit, pinch or use
            the zoom buttons to zoom, and double-click to reset.
          </p>
        </header>

        <div className="mt-10 grid items-start gap-6 lg:mt-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-8">
          {/* Parts sheet with hotspots */}
          <div className="min-w-0">
            <figure className="glass relative m-0 rounded-[24px] p-1.5">
              <div className="relative overflow-hidden rounded-[18px] bg-tint" style={{ aspectRatio: `${SHEET_WIDTH} / ${SHEET_HEIGHT}` }}>
                <img
                  src={`${import.meta.env.BASE_URL}images/svaraa-lite-sheet.webp`}
                  width={SHEET_WIDTH}
                  height={SHEET_HEIGHT}
                  alt="Svaraa Lite exploded pendant and accessories: face, speaker, electronics, motor, battery and housing, with the magnetic clip, wristband, lanyard, backplate, charging puck and USB-C cable."
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
                {hotspots.map((p) => {
                  const [x, y, w, h] = p.rect!;
                  const active = p.id === shownId;
                  const pinned = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`View ${p.label} in 3D`}
                      aria-pressed={pinned}
                      onMouseEnter={() => preview(p.id)}
                      onMouseLeave={() => unpreview(p.id)}
                      onFocus={() => preview(p.id)}
                      onBlur={() => unpreview(p.id)}
                      onClick={() => pick(p.id)}
                      className={cn(
                        'absolute rounded-[8px] border-2 transition-colors duration-150 sm:rounded-[14px]',
                        'focus-visible:outline-none',
                        active ? 'border-primary bg-primary/10' : pinned ? 'border-primary/55' : 'border-transparent hover:border-primary/40',
                      )}
                      style={{ left: pct(x, SHEET_WIDTH), top: pct(y, SHEET_HEIGHT), width: pct(w, SHEET_WIDTH), height: pct(h, SHEET_HEIGHT) }}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute top-1 right-1 size-2 rounded-full border-2 border-white bg-primary sm:top-1.5 sm:right-1.5 sm:size-2.5',
                          active || pinned ? 'opacity-100' : 'opacity-60',
                        )}
                      />
                      {active && (
                        <span
                          className={cn(
                            'pointer-events-none absolute left-0 z-10 hidden rounded-full bg-primary px-3 py-1.5 text-xs font-medium whitespace-nowrap text-on-primary shadow-lg sm:block',
                            y < 120 ? '-bottom-9' : '-top-9',
                          )}
                        >
                          {p.label} · 3D
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </figure>

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Svaraa Lite parts">
              {LITE_PARTS.map((p) => {
                const pinned = p.id === selectedId;
                const active = p.id === shownId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={pinned}
                    onClick={() => pick(p.id)}
                    onMouseEnter={() => preview(p.id)}
                    onMouseLeave={() => unpreview(p.id)}
                    className={cn(
                      'min-h-9 rounded-full border px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors duration-150',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      pinned
                        ? 'border-primary bg-primary text-on-primary'
                        : active
                          ? 'border-primary/40 bg-tint text-heading'
                          : 'border-line bg-glass-strong text-ink hover:border-primary/40',
                    )}
                  >
                    {p.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3D viewer */}
          <section aria-label="3D viewer" className="glass flex min-w-0 flex-col overflow-hidden rounded-[24px]">
            <div ref={viewerRef} className="relative h-[340px] bg-tint sm:h-[420px] lg:h-[470px]">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Interactive 3D model: ${shown.label}`}
                className="block size-full cursor-grab touch-pan-y select-none"
              />
              {status !== 'ready' && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted" role="status">
                  {status === 'unsupported'
                    ? '3D preview needs WebGL, which this browser has turned off. The parts sheet still shows every component.'
                    : 'Loading 3D model…'}
                </div>
              )}
              <span
                className={cn(
                  'pointer-events-none absolute top-4 left-4 rounded-full px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.12em] uppercase',
                  hovering ? 'bg-accent text-white' : 'bg-primary text-on-primary',
                )}
              >
                {hovering ? 'Previewing' : 'Pinned'}
              </span>
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => sceneRef.current?.zoomBy(1 / 1.2)}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-glass-strong text-heading transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => sceneRef.current?.zoomBy(1.2)}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-glass-strong text-heading transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
              </div>
              <span className="pointer-events-none absolute right-4 bottom-3 hidden text-xs text-muted sm:block">
                Drag to orbit · Double-click to reset
              </span>
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5 pb-6 sm:px-6">
              <div aria-live="polite">
                <h3 className="font-serif text-[1.75rem] leading-tight text-heading">{shown.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{shown.description}</p>
              </div>

              {shown.model === 'pendant' && (
                <div className="flex items-center gap-3">
                  <label htmlFor={sliderId} className="w-16 text-sm font-medium text-heading">
                    Explode
                  </label>
                  <input
                    id={sliderId}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={explode}
                    onChange={(e) => onExplode(Number(e.target.value))}
                    className="h-6 flex-1 accent-[var(--c-primary)]"
                  />
                  <span className="w-10 text-right text-sm text-muted tabular-nums">{explode}%</span>
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
        </div>
        <p className="mt-6 text-center text-xs text-subtle">Concept design.</p>
      </div>
    </section>
  );
}
