import { useEffect, useId, useRef, useState } from 'react';
import { Mic, MicOff, Minus, Pause, Play, Plus, Power, RotateCcw, Siren } from 'lucide-react';
import {
  FOLD_DEFAULT_VIEW,
  foldViewById,
  type FoldFeatureIcon,
} from '../../data/svaraaFold';
import { cn } from '../../lib/cn';
import { FeatureStack } from './FeatureStack';
import { startSiren } from '../../lib/siren';
import type { FoldLightState, FoldScene } from './foldScene';

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'unsupported';
type Overrides = { explode: number; fold: number } | null;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Shape of the pill buttons under the viewer; `small` is the compact size beside the title. */
const pillClass = (small = false) =>
  cn(
    'inline-flex items-center rounded-xl border font-medium whitespace-nowrap transition-colors',
    small ? 'min-h-9 gap-1.5 px-3 text-xs' : 'min-h-10 gap-2 px-4 text-sm',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
  );

/** Pill button; `on` fills it for a toggle that is switched on. */
const toggleClass = (on: boolean, small = false) =>
  cn(
    pillClass(small),
    on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-glass-strong text-heading hover:border-primary/40',
  );

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
  /** Slider values for the pinned view; null falls back to the view's own defaults. */
  const [overrides, setOverrides] = useState<Overrides>(null);
  const [reduceMotion] = useState(prefersReducedMotion);
  const [auto, setAuto] = useState(() => !reduceMotion);
  const [status, setStatus] = useState<ViewerStatus>('idle');
  const [lights, setLights] = useState<FoldLightState>({ power: true, recording: false, sos: false, battery: 100 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FoldScene | null>(null);
  const explodeId = useId();
  const foldId = useId();
  const chargeId = useId();

  const shown = foldViewById(selectedId);
  // Sliders work in 0–100; view defaults are stored as 0–1.
  const explode = overrides ? overrides.explode : shown.explode * 100;
  const fold = overrides ? overrides.fold : shown.fold * 100;

  const pick = (id: string) => {
    setSelectedId(id);
    setOverrides(null);
  };

  /** Opening one way closes the other, as in the design. */
  const onSlider = (which: 'explode' | 'fold', value: number) => {
    const base = { explode, fold };
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

  useEffect(() => {
    sceneRef.current?.setLights(lights);
  }, [lights, status]);

  // The siren sounds while SOS is on, and stops when it's turned off or the section unmounts.
  useEffect(() => {
    if (!lights.sos) return;
    return startSiren();
  }, [lights.sos]);

  /** Back to the folded pendant (Explode 0, Fold 100) with the camera reset. */
  const resetAll = () => {
    pick(FOLD_DEFAULT_VIEW);
    sceneRef.current?.resetView();
  };

  // Recording and SOS switch the pendant on; switching it off stops both.
  const togglePower = () => setLights((l) => (l.power ? { ...l, power: false, recording: false, sos: false } : { ...l, power: true }));
  const toggleRecording = () => setLights((l) => ({ ...l, power: true, recording: !l.recording }));
  const toggleSos = () => setLights((l) => ({ ...l, power: true, sos: !l.sos }));

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
            Drag to orbit, pinch or use the zoom buttons to zoom, and double-click to reset. Scroll on to see what
            each feature does.
          </p>
        </header>

        <div className="mt-10 grid items-start gap-6 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          {/* 3D viewer */}
          <section
            aria-label="3D viewer"
            className="glass flex min-w-0 flex-col overflow-hidden rounded-[24px] lg:sticky lg:top-[6.5rem]"
          >
            <div ref={stageRef} className="relative h-[340px] bg-tint sm:h-[420px] lg:h-[clamp(260px,40vh,470px)]">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Interactive 3D model: ${shown.label}`}
                className="block size-full cursor-grab touch-pan-y select-none"
              />
              {status !== 'ready' && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted" role="status">
                  {status === 'unsupported'
                    ? '3D preview needs WebGL, which this browser has turned off.'
                    : 'Loading 3D model…'}
                </div>
              )}
              <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-primary px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.12em] text-on-primary uppercase">
                3D view
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
                    className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-glass-strong text-heading transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 pt-5 pb-6 sm:px-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <h3 aria-live="polite" className="font-serif text-[1.75rem] leading-tight text-heading">
                    {shown.label}
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      aria-pressed={auto}
                      onClick={() => setAuto((a) => !a)}
                      className={toggleClass(auto, true)}
                    >
                      {auto ? <Pause className="size-3.5" aria-hidden="true" /> : <Play className="size-3.5" aria-hidden="true" />}
                      Auto-rotate: {auto ? 'on' : 'off'}
                    </button>
                    <button type="button" onClick={resetAll} className={toggleClass(false, true)}>
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      Reset view
                    </button>
                  </div>
                </div>
                <p aria-live="polite" className="mt-1 text-sm leading-relaxed text-muted">
                  {shown.description}
                </p>
              </div>

              {shown.model === 'svaraa' && (
                <div className="flex flex-col gap-2">
                  {[
                    { id: explodeId, label: 'Explode', value: explode, key: 'explode' as const },
                    { id: foldId, label: 'Fold', value: fold, key: 'fold' as const },
                    // Battery level, shown on the four lights below the lotus (one per 25%).
                    { id: chargeId, label: 'Charge', value: lights.battery, key: 'charge' as const },
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
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (s.key === 'charge') setLights((l) => ({ ...l, battery: v }));
                          else onSlider(s.key, v);
                        }}
                        className="h-6 flex-1 accent-[var(--c-primary)]"
                      />
                      <span className="w-10 text-right text-sm text-muted tabular-nums">{Math.round(s.value)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Try the pendant's lights: power, recording and SOS. */}
              {/* Narrow phones: Pendant and Recording side by side, SOS as a full-width bar below them. */}
              <div className="grid grid-cols-2 gap-2 min-[440px]:flex min-[440px]:flex-wrap" role="group" aria-label="Pendant lights">
                <button type="button" aria-pressed={lights.power} onClick={togglePower} className={cn(toggleClass(lights.power), 'justify-center')}>
                  <Power className="size-4" aria-hidden="true" />
                  Pendant: {lights.power ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  aria-pressed={lights.recording}
                  onClick={toggleRecording}
                  className={cn(toggleClass(lights.recording), 'justify-center')}
                >
                  {lights.recording ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
                  Recording: {lights.recording ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  aria-pressed={lights.sos}
                  onClick={toggleSos}
                  className={cn(
                    pillClass(),
                    'col-span-2 justify-center',
                    lights.sos
                      ? 'border-danger bg-danger text-white'
                      : 'border-danger/40 bg-danger-soft text-danger hover:border-danger',
                  )}
                >
                  <Siren className="size-4" aria-hidden="true" />
                  {lights.sos ? 'Stop SOS' : 'SOS'}
                </button>
              </div>
            </div>
          </section>

          {/* Feature cards that stack as the page scrolls */}
          <div className="min-w-0">
            <FeatureStack icon={(icon) => <IconGlyph icon={icon} />} reduceMotion={reduceMotion} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-subtle">Concept design.</p>
      </div>
    </section>
  );
}
