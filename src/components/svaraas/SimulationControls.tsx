import { useId } from 'react';
import { ChevronDown, CircleCheck, Clock, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/cn';
import { LANGUAGES, type LanguageCode, type Svaraa } from '../../data/svaraas';
import type { Simulation, SimStatus } from '../../hooks/useSimulation';
import { Button } from '../ui/Button';
import { LiveDot } from '../ui/Pill';

const STATUS_COPY: Record<SimStatus, string> = {
  idle: 'Ready to start',
  playing: 'Demo in progress',
  paused: 'Paused',
  complete: 'Demo complete',
};

interface SimulationControlsProps {
  svaraa: Svaraa;
  sim: Simulation;
  audioOn: boolean;
  onAudioChange: (on: boolean) => void;
  speechSupported: boolean;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export function SimulationControls({
  svaraa,
  sim,
  audioOn,
  onAudioChange,
  speechSupported,
  language,
  onLanguageChange,
}: SimulationControlsProps) {
  const languageId = useId();
  const { status } = sim;
  const startLabel = status === 'paused' ? 'Resume' : status === 'complete' ? 'Replay' : svaraa.simulation.startLabel;

  return (
    <div className="flex flex-col rounded-3xl border border-line bg-glass-strong p-6 sm:p-7">
      {svaraa.simulation.eyebrow && (
        <p className="mb-2 text-xs font-medium tracking-[0.18em] text-gold uppercase">{svaraa.simulation.eyebrow}</p>
      )}
      <h4 className="font-serif text-3xl leading-tight text-heading">{svaraa.label} simulation</h4>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <p className="flex items-center gap-2.5 text-muted" role="status" aria-live="polite">
          {status === 'complete' ? (
            <CircleCheck className="size-4 text-success" aria-hidden="true" />
          ) : (
            <LiveDot tone={status === 'paused' ? 'warn' : status === 'idle' ? 'muted' : 'success'} active={status === 'playing'} />
          )}
          {STATUS_COPY[status]}
        </p>
        {svaraa.simulation.estimate && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="size-3.5" aria-hidden="true" />
            {svaraa.simulation.estimate}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <Button
          variant={sim.isPlaying ? 'muted' : 'primary'}
          onClick={sim.play}
          disabled={sim.isPlaying}
          className="px-2"
        >
          <Play className="size-4" aria-hidden="true" />
          {startLabel}
        </Button>
        <Button
          variant={sim.isPlaying ? 'primary' : 'muted'}
          onClick={sim.pause}
          disabled={!sim.isPlaying}
          className="px-2"
        >
          <Pause className="size-4" aria-hidden="true" />
          Pause
        </Button>
        <Button variant="outline" onClick={sim.reset} disabled={status === 'idle' && sim.beat === 0} className="px-2">
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-line py-5">
        <button
          type="button"
          role="switch"
          aria-checked={audioOn}
          onClick={() => onAudioChange(!audioOn)}
          disabled={!speechSupported}
          title={speechSupported ? undefined : 'Voice playback is not supported in this browser'}
          className="group flex items-center gap-2.5 rounded-full text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-50"
        >
          {audioOn ? <Volume2 className="size-5 text-gold" aria-hidden="true" /> : <VolumeX className="size-5 text-subtle" aria-hidden="true" />}
          <span>Audio {audioOn ? 'on' : 'off'}</span>
          <span
            className={cn(
              'relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200',
              audioOn ? 'bg-primary' : 'bg-ink/15',
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                'size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                audioOn ? 'translate-x-[18px]' : 'translate-x-0.5',
              )}
            />
          </span>
        </button>

        <div className="flex min-w-[13rem] flex-1 items-center gap-2.5">
          <label htmlFor={languageId} className="text-sm text-muted">
            Language:
          </label>
          <div className="relative min-w-0 flex-1">
            <select
              id={languageId}
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="h-10 w-full appearance-none rounded-xl border border-line bg-glass-strong pr-9 pl-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="font-serif text-xl text-heading">What this demonstrates</p>
        <ul className="mt-3 flex flex-col gap-3">
          {svaraa.checklist.map((item) => (
            <li key={item} className="flex items-center gap-3 text-[0.95rem] text-ink">
              <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-auto pt-8 text-xs text-subtle">Illustrative product demo.</p>
    </div>
  );
}
