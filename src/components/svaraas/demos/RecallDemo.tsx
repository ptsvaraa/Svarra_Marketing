import { useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  CircleCheck,
  FileText,
  Info,
  Pause,
  Phone,
  Play,
  Sprout,
  SquareCheckBig,
  Users,
  Volume2,
  VolumeOff,
} from 'lucide-react';
import { cn } from '../../../lib/cn';
import { formatClock, useElapsedSeconds } from '../../../hooks/useElapsedSeconds';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Pill } from '../../ui/Pill';
import { Reveal } from '../../ui/Reveal';
import { Waveform } from '../../ui/Waveform';
import { ChatMessage, SectionLabel, replyState, type DemoProps } from '../demo-kit';

const BRIEFING_LENGTH = 90;

const PLAN = [
  { time: '9:00 am', title: 'Call Priya', Icon: Phone },
  { time: '11:00 am', title: 'Garden walk', Icon: Sprout },
  { time: '5:00 pm', title: 'Family catch-up', Icon: Users },
] as const;

type Decision = 'pending' | 'confirmed' | 'declined';

export function RecallDemo({ beat, isPlaying, isComplete, goTo, togglePlayback }: DemoProps) {
  const [decision, setDecision] = useState<Decision>('pending');
  const [readAloud, setReadAloud] = useState(true);

  const briefingLive = beat >= 1 && !isComplete;
  const elapsed = useElapsedSeconds(briefingLive && isPlaying);
  // Compress the 90 s briefing into the demo so the bar visibly moves.
  const position = isComplete ? BRIEFING_LENGTH : Math.min(BRIEFING_LENGTH, 18 + elapsed * 4);

  // If the demo moves on without a choice, the family confirms it in their app.
  const outcome: Decision = decision === 'pending' && beat >= 4 ? 'confirmed' : decision;

  const decide = (d: Exclude<Decision, 'pending'>) => {
    setDecision(d);
    goTo(4);
  };

  return (
    <div className="flex flex-col gap-4">
      <ChatMessage speaker="person" name="Amma" time="10:32 AM">
        Svaraa, what does today look like?
      </ChatMessage>
      <ChatMessage speaker="svaraa" name="Svaraa AI" time="10:32 AM" state={replyState(beat, 1, isPlaying)}>
        Your morning briefing is ready. Shall we go through your plans?
      </ChatMessage>

      <Reveal show={beat >= 1}>
        <Card className="flex flex-wrap items-center gap-3 py-3 sm:py-3">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={isComplete}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            aria-label={isPlaying ? 'Pause briefing' : 'Play briefing'}
          >
            {isPlaying ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
          </button>
          <Waveform
            bars={48}
            active={briefingLive && isPlaying}
            progress={position / BRIEFING_LENGTH}
            seed={3.7}
            className="min-w-0 flex-1"
          />
          <span className="text-xs tabular-nums text-muted">
            {formatClock(position)} / {formatClock(BRIEFING_LENGTH)}
          </span>
          <button
            type="button"
            aria-pressed={readAloud}
            onClick={() => setReadAloud((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary"
          >
            {readAloud ? <Volume2 className="size-3.5" aria-hidden="true" /> : <VolumeOff className="size-3.5" aria-hidden="true" />}
            {readAloud ? 'Read aloud' : 'Text only'}
          </button>
        </Card>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-2">
        <Reveal show={beat >= 2}>
          <Card className="h-full">
            <SectionLabel icon={<CalendarDays className="size-5 text-primary" aria-hidden="true" />}>
              Today&rsquo;s plan
            </SectionLabel>
            <ul className="divide-y divide-line">
              {PLAN.map(({ time, title, Icon }) => (
                <li
                  key={title}
                  className="grid grid-cols-[4rem_1.25rem_minmax(0,1fr)_auto] items-center gap-2.5 py-2.5 text-sm sm:grid-cols-[4.5rem_1.25rem_minmax(0,1fr)_auto] sm:gap-3"
                >
                  <span className="tabular-nums text-ink">{time}</span>
                  <Icon className="size-4 text-gold" aria-hidden="true" />
                  <span className="truncate text-ink">{title}</span>
                  <ChevronRight className="size-4 text-subtle" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal show={beat >= 3}>
          <Card className="h-full bg-warn-soft/60">
            <SectionLabel
              icon={<SquareCheckBig className="size-5 text-primary" aria-hidden="true" />}
              aside={
                outcome === 'confirmed' ? (
                  <Pill tone="success">Confirmed</Pill>
                ) : outcome === 'declined' ? (
                  <Pill tone="neutral">Not now</Pill>
                ) : (
                  <Pill tone="warn">Proposed</Pill>
                )
              }
            >
              Proposed task
            </SectionLabel>
            <div className="rounded-xl bg-glass-strong p-3.5">
              <div className="flex gap-3">
                <FileText className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
                <div className="min-w-0">
                  <p className={cn('font-medium text-heading', outcome === 'declined' && 'line-through opacity-60')}>
                    Pick up the scan report
                  </p>
                  <p className="text-xs text-muted">Dr. Menon&rsquo;s clinic</p>
                  <p className="mt-1.5 text-xs text-muted">Suggested based on your upcoming appointment tomorrow.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide('confirmed')} disabled={outcome !== 'pending'}>
                  Confirm task
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide('declined')} disabled={outcome !== 'pending'}>
                  Not now
                </Button>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted" aria-live="polite">
              {outcome === 'confirmed' ? (
                <>
                  <CircleCheck className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                  {decision === 'confirmed' ? 'Added to Priya’s list for tomorrow.' : 'Confirmed by Priya in the family app.'}
                </>
              ) : outcome === 'declined' ? (
                <>
                  <Info className="size-3.5 shrink-0" aria-hidden="true" />
                  Okay. Svaraa will leave it for now.
                </>
              ) : (
                <>
                  <Info className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
                  Proposed actions wait for confirmation.
                </>
              )}
            </p>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
