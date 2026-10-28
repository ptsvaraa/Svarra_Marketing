import { useState, type ComponentType } from 'react';
import {
  AudioLines,
  CalendarDays,
  CircleCheck,
  Clock,
  Flower2,
  GlassWater,
  MessageCircle,
  Pill as PillIcon,
  Users,
  type LucideProps,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Pill, type Tone } from '../../ui/Pill';
import { Reveal } from '../../ui/Reveal';
import { ChatMessage, SectionLabel, type DemoProps } from '../demo-kit';

interface Row {
  time: string;
  title: string;
  Icon: ComponentType<LucideProps>;
  status: { tone: Tone; label: string; Icon: ComponentType<LucideProps> };
}

const UP_NEXT = { tone: 'warn', label: 'Up next', Icon: Clock } as const;
const SCHEDULED = { tone: 'neutral', label: 'Scheduled', Icon: CalendarDays } as const;

function reminders(beat: number, snoozed: boolean): Row[] {
  const taken = beat >= 2;
  return [
    {
      time: '8:00 am',
      title: 'Morning medicine',
      Icon: PillIcon,
      status: taken
        ? { tone: 'success', label: 'Taken', Icon: CircleCheck }
        : snoozed
          ? { tone: 'primary', label: 'Snoozed · 8:05', Icon: Clock }
          : UP_NEXT,
    },
    { time: '10:00 am', title: 'Drink water', Icon: GlassWater, status: taken ? UP_NEXT : SCHEDULED },
    { time: '6:30 pm', title: 'Evening prayer', Icon: Flower2, status: SCHEDULED },
  ];
}

export function RemindDemo({ beat, goTo }: DemoProps) {
  const [snoozed, setSnoozed] = useState(false);
  const acknowledged = beat >= 2;
  const familyUpdated = beat >= 3;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-0 sm:p-0">
        <div className="px-4 pt-4 sm:px-5">
          <SectionLabel aside={<span className="text-xs text-muted">Mon, 14 Apr</span>}>
            Today&rsquo;s reminders · Amma
          </SectionLabel>
        </div>
        <ul className="divide-y divide-line border-t border-line">
          {reminders(beat, snoozed).map(({ time, title, Icon, status }) => (
            <li
              key={title}
              className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[4.5rem_1.5rem_minmax(0,1fr)_auto] sm:px-5"
            >
              <span className="text-sm whitespace-nowrap tabular-nums text-ink">{time}</span>
              <Icon className="hidden size-5 text-gold sm:block" strokeWidth={1.6} aria-hidden="true" />
              <span className="text-sm text-ink sm:truncate">{title}</span>
              <Pill tone={status.tone} icon={<status.Icon className="size-3.5" aria-hidden="true" />}>
                {status.label}
              </Pill>
            </li>
          ))}
        </ul>
      </Card>

      <Reveal show={beat >= 1}>
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <ChatMessage
              speaker="svaraa"
              name="Svaraa AI"
              time="8:00 am"
              className="flex-1"
            >
              <span className="flex items-start gap-3">
                <AudioLines className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <span>Amma, it&rsquo;s time for your scheduled medicine. Have some water, too.</span>
              </span>
            </ChatMessage>
            <div className="flex flex-wrap gap-2 xl:mt-6 xl:flex-col">
              <Button size="sm" onClick={() => goTo(2)} disabled={acknowledged}>
                <CircleCheck className="size-4" aria-hidden="true" />
                Mark as taken
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSnoozed(true)} disabled={acknowledged || snoozed}>
                <Clock className="size-4" aria-hidden="true" />
                {snoozed ? 'Snoozed' : 'Snooze 5 min'}
              </Button>
            </div>
          </div>

          <ChatMessage
            speaker="person"
            name="Amma"
            time="8:01 am"
            avatar={<MessageCircle className="size-5" />}
            state={acknowledged ? 'shown' : 'hidden'}
          >
            I&rsquo;ve taken it.
          </ChatMessage>

          <Reveal show={acknowledged}>
            <p
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-success-soft px-4 py-3 text-sm text-success"
              aria-live="polite"
            >
              {familyUpdated ? (
                <>
                  <Users className="size-4 shrink-0" aria-hidden="true" />
                  <span className="font-medium">Family updated</span>
                  <span className="text-success/80">· Priya and Ravi can see it&rsquo;s been taken</span>
                </>
              ) : (
                <>
                  <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
                  <span className="font-medium">Morning medicine acknowledged</span>
                  <span className="text-success/80">· Just now</span>
                </>
              )}
            </p>
          </Reveal>
        </Card>
      </Reveal>
    </div>
  );
}
