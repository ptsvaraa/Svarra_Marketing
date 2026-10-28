import { useState } from 'react';
import { CalendarClock, ChevronRight, Music, Pause, Play, Radio, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { formatClock, useElapsedSeconds } from '../../../hooks/useElapsedSeconds';
import { Card, IconTile } from '../../ui/Card';
import { Pill } from '../../ui/Pill';
import { Reveal } from '../../ui/Reveal';
import { Waveform } from '../../ui/Waveform';
import { ChatMessage, replyState, type DemoProps } from '../demo-kit';

const TRACKS = {
  prayer: { title: 'Morning prayer', length: 360, start: 84 },
  ambient: { title: 'Ambient calm', length: 900, start: 0 },
} as const;

type TrackKey = keyof typeof TRACKS;

const SKIP = 15;

export function ReciteDemo({ beat, isPlaying, isComplete, togglePlayback }: DemoProps) {
  const [trackKey, setTrackKey] = useState<TrackKey>('prayer');
  const [offset, setOffset] = useState(0);
  const [volume, setVolume] = useState(70);

  const playerLive = beat >= 2 && !isComplete;
  const audible = playerLive && isPlaying;
  const elapsed = useElapsedSeconds(audible);
  const track = TRACKS[trackKey];
  const position = Math.min(track.length, Math.max(0, track.start + elapsed + offset));

  const selectTrack = (key: TrackKey) => {
    setTrackKey(key);
    setOffset(-elapsed);
  };

  return (
    <div className="flex flex-col gap-4">
      <ChatMessage speaker="person" name="Amma" time="6:00 am">
        Svaraa, play my morning prayer.
      </ChatMessage>
      <ChatMessage speaker="svaraa" name="Svaraa AI" time="6:00 am" state={replyState(beat, 1, isPlaying)}>
        Of course, Amma. Let&rsquo;s begin with a quiet moment.
      </ChatMessage>

      <Reveal show={beat >= 2}>
        <Card className="bg-tint/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTile className="bg-accent/10">
                <Music className="size-5" />
              </IconTile>
              <div>
                <p className="font-serif text-xl text-heading">{track.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <Radio className={cn('size-3.5', audible ? 'text-gold' : 'text-subtle')} aria-hidden="true" />
                  {isComplete ? 'Finished · routine saved' : audible ? 'Playing on pendant' : 'Paused on pendant'}
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-full border border-line bg-glass-strong p-1" role="group" aria-label="Sound type">
              {(Object.keys(TRACKS) as TrackKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={trackKey === key}
                  onClick={() => selectTrack(key)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary',
                    trackKey === key ? 'bg-primary text-on-primary' : 'text-muted hover:text-primary',
                  )}
                >
                  {key === 'prayer' ? 'Prayer' : 'Ambient calm'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <Waveform bars={52} active={audible} progress={position / track.length} seed={trackKey === 'prayer' ? 1.3 : 4.1} />
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full origin-left rounded-full bg-gold transition-transform duration-1000 ease-linear"
                  style={{ transform: `scaleX(${position / track.length})` }}
                />
              </div>
              <p className="mt-1.5 text-xs tabular-nums text-muted">
                {formatClock(position)} / {formatClock(track.length)}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setOffset((o) => o - SKIP)}
                className="rounded-full p-2 text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Back 15 seconds"
              >
                <RotateCcw className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={isComplete}
                className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_10px_24px_-12px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                aria-label={isPlaying ? 'Pause prayer' : 'Play prayer'}
              >
                {isPlaying ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5 translate-x-px" fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={() => setOffset((o) => o + SKIP)}
                className="rounded-full p-2 text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Forward 15 seconds"
              >
                <RotateCw className="size-5" aria-hidden="true" />
              </button>
              <label className="ml-1 flex items-center gap-2 text-primary">
                <Volume2 className="size-5 shrink-0" aria-hidden="true" />
                <span className="sr-only">Pendant volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 accent-[var(--c-gold)] sm:w-24"
                />
              </label>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal show={beat >= 3}>
        <Card className="flex flex-wrap items-center gap-3 py-3 sm:py-3.5">
          <CalendarClock className="size-5 shrink-0 text-gold" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm text-ink">
            <span className="font-semibold text-heading">Next</span>
            <span aria-hidden="true"> · </span>
            Evening prayer at 6:30 pm
          </p>
          <Pill tone="success">Routine saved · Daily</Pill>
          <ChevronRight className="size-4 text-subtle" aria-hidden="true" />
        </Card>
      </Reveal>
    </div>
  );
}
