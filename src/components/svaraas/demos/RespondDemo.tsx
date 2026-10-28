import { useState } from 'react';
import { CalendarClock, CalendarDays, CircleCheck, Clock, Info } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Pill } from '../../ui/Pill';
import { Reveal } from '../../ui/Reveal';
import { Waveform } from '../../ui/Waveform';
import { ChatMessage, replyState, type DemoProps } from '../demo-kit';

const TIMES = ['9:00 am', '9:30 am', '10:00 am'] as const;

export function RespondDemo({ beat, isPlaying, goTo }: DemoProps) {
  const [timeIndex, setTimeIndex] = useState(0);
  const confirmed = beat >= 3;
  const speaking = beat === 1 && isPlaying;

  return (
    <div className="flex flex-col gap-4">
      <ChatMessage
        speaker="person"
        name="Amma"
        time="7:30 am"
        avatar={<CalendarDays className="size-5" />}
      >
        Svaraa, remind me to call Priya after our walk.
      </ChatMessage>

      <ChatMessage
        speaker="svaraa"
        name="Svaraa AI"
        time="7:30 am"
        status={speaking ? 'Speaking…' : undefined}
        state={replyState(beat, 1, isPlaying)}
      >
        <span className="block">Shall I add a reminder for 9:00 am?</span>
        <Waveform bars={26} active={speaking} className="mt-2 h-6" seed={2.2} />
      </ChatMessage>

      <Reveal show={beat >= 2}>
        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <CalendarClock className="mt-0.5 size-9 shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-medium text-heading">Call Priya</p>
                  <p className="text-sm text-muted">Today · {TIMES[timeIndex]}</p>
                </div>
                {confirmed ? (
                  <Pill tone="success" icon={<CircleCheck className="size-3.5" aria-hidden="true" />}>
                    Added to today
                  </Pill>
                ) : (
                  <Pill tone="warn" icon={<Clock className="size-3.5" aria-hidden="true" />}>
                    Awaiting confirmation
                  </Pill>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => goTo(3)} disabled={confirmed}>
                  {confirmed ? 'Reminder confirmed' : 'Confirm reminder'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTimeIndex((i) => (i + 1) % TIMES.length)}
                  disabled={confirmed}
                >
                  Change time
                </Button>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted" aria-live="polite">
                <Info className="size-3.5 shrink-0" aria-hidden="true" />
                {confirmed
                  ? `Added for ${TIMES[timeIndex]}. Priya can see it in the family app.`
                  : 'Nothing is added until Amma confirms.'}
              </p>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
