import { memo } from 'react';
import {
  AudioLines,
  CircleAlert,
  CircleCheck,
  Clock,
  History,
  House,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useElapsedSeconds } from '../../../hooks/useElapsedSeconds';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { LiveDot, Pill, type Tone } from '../../ui/Pill';
import { SectionLabel, type DemoProps } from '../demo-kit';

const COUNTDOWN = 5;

interface ContactStatus {
  tone: Tone;
  label: string;
  Icon: LucideIcon;
  time?: string;
}

interface Contact {
  initials: string;
  name: string;
  relation: string;
  channel: string;
  statusAt: (beat: number) => ContactStatus;
}

const STANDBY: ContactStatus = { tone: 'neutral', label: 'Standby', Icon: Clock };

const CONTACTS: readonly Contact[] = [
  {
    initials: 'PR',
    name: 'Priya',
    relation: 'Daughter',
    channel: 'Mobile · Call + SMS',
    statusAt: (b) =>
      b >= 2
        ? { tone: 'success', label: 'Acknowledged', Icon: CircleCheck, time: '10:34 AM' }
        : b >= 1
          ? { tone: 'warn', label: 'Calling…', Icon: Phone, time: '10:33 AM' }
          : STANDBY,
  },
  {
    initials: 'RV',
    name: 'Ravi',
    relation: 'Son',
    channel: 'Mobile · SMS',
    statusAt: (b) =>
      b >= 1 ? { tone: 'neutral', label: 'SMS delivered', Icon: MessageSquareText, time: '10:33 AM' } : STANDBY,
  },
  {
    initials: 'LA',
    name: 'Lakshmi',
    relation: 'Caretaker',
    channel: 'Mobile · Call + SMS',
    statusAt: (b) =>
      b >= 3
        ? { tone: 'success', label: 'Arrived', Icon: CircleCheck, time: '10:37 AM' }
        : b >= 2
          ? { tone: 'warn', label: 'On the way', Icon: Clock, time: '10:35 AM' }
          : b >= 1
            ? { tone: 'neutral', label: 'SMS delivered', Icon: MessageSquareText, time: '10:33 AM' }
            : STANDBY,
  },
];

const TIMELINE = [
  { time: '10:32 AM', label: 'Check-in started', at: 0 },
  { time: '10:33 AM', label: 'Care circle notified', at: 1 },
  { time: '10:34 AM', label: 'Priya acknowledged', at: 2 },
  { time: '10:37 AM', label: 'Lakshmi arrived · drill resolved', at: 3 },
] as const;

const ASSISTANT_LINES = [
  'Amma, are you okay? Say “I’m fine” to cancel.',
  'Amma, your care circle has been alerted.',
  'Priya has acknowledged. Lakshmi is on the way.',
  'Glad you’re safe, Amma. I’ve let everyone know.',
] as const;

/** Stylised neighbourhood map. Pure SVG, so it scales crisply and themes via CSS vars. */
const HomeMap = memo(function HomeMap({ resolved }: { resolved: boolean }) {
  return (
    <div className="relative h-full min-h-48 overflow-hidden rounded-xl">
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
        <rect width="320" height="200" fill="var(--c-map-land)" />
        <g fill="var(--c-map-block)">
          <rect x="14" y="14" width="70" height="44" rx="6" />
          <rect x="100" y="10" width="54" height="52" rx="6" />
          <rect x="18" y="128" width="62" height="58" rx="6" />
          <rect x="236" y="120" width="70" height="66" rx="6" />
          <rect x="176" y="16" width="44" height="40" rx="6" />
        </g>
        <rect x="238" y="18" width="70" height="80" rx="10" fill="var(--c-map-green)" />
        <rect x="100" y="140" width="22" height="50" rx="6" fill="var(--c-map-water)" />
        <g stroke="var(--c-map-road)" strokeLinecap="round">
          <path d="M-10 86 L330 98" strokeWidth="14" />
          <path d="M92 -10 L82 210" strokeWidth="11" />
          <path d="M228 -10 L224 210" strokeWidth="11" />
          <path d="M-10 196 L330 110" strokeWidth="7" />
        </g>
      </svg>
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-glass-strong px-2.5 py-1 text-ink shadow-sm">
          <House className="size-3.5" aria-hidden="true" /> At home
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-glass-strong px-2.5 py-1 text-ink shadow-sm">
          <LiveDot active={false} /> Pendant connected
        </span>
      </div>
      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2">
        {!resolved && <span className="absolute -inset-5 animate-ping rounded-full bg-danger/20" aria-hidden="true" />}
        <span
          className={cn(
            'absolute -inset-3 rounded-full transition-colors duration-500',
            resolved ? 'bg-success/15' : 'bg-danger/15',
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'relative flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-colors duration-500',
            resolved ? 'bg-success' : 'bg-danger',
          )}
        >
          <House className="size-5" aria-hidden="true" />
          <span className="sr-only">Amma&rsquo;s location: home</span>
        </span>
      </div>
    </div>
  );
});

export function RescueDemo({ beat, isPlaying, goTo }: DemoProps) {
  const resolved = beat >= 3;
  const elapsed = useElapsedSeconds(beat === 0 && isPlaying);
  const countdown = Math.max(0, COUNTDOWN - elapsed);
  const assistantLine = ASSISTANT_LINES[Math.min(beat, ASSISTANT_LINES.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3.5 transition-colors duration-500 sm:px-5',
          resolved ? 'border-success/25 bg-success-soft' : 'border-danger/25 bg-danger-soft',
        )}
        role="status"
      >
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-500',
            resolved ? 'bg-success' : 'bg-danger',
          )}
          aria-hidden="true"
        >
          {resolved ? <ShieldCheck className="size-6" /> : <CircleAlert className="size-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('font-serif text-xl sm:text-2xl', resolved ? 'text-success' : 'text-danger')}>
            {resolved ? 'Resolved · Amma is safe' : 'Possible fall · Amma'}
          </p>
          <p className="text-sm text-muted">Home · Pendant connected</p>
        </div>
        <div className="text-right text-sm">
          <p className="tabular-nums text-muted">10:32 AM</p>
          <p className={cn('font-medium', resolved ? 'text-success' : 'text-danger')}>
            {resolved ? 'Drill resolved' : 'Drill in progress'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-1.5 sm:p-1.5">
          <HomeMap resolved={resolved} />
        </Card>

        <Card>
          <SectionLabel>Care circle</SectionLabel>
          <ul className="flex flex-col gap-3">
            {CONTACTS.map((c) => {
              const s = c.statusAt(beat);
              return (
                <li key={c.name} className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-sm font-medium text-primary" aria-hidden="true">
                    {c.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-heading">
                      {c.name} <span className="font-normal text-muted">· {c.relation}</span>
                    </p>
                    <p className="truncate text-xs text-muted">{c.channel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <Pill tone={s.tone} icon={<s.Icon className="size-3.5" aria-hidden="true" />}>
                      {s.label}
                    </Pill>
                    <span className="h-4 text-[0.7rem] tabular-nums text-subtle">{s.time}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <SectionLabel
            icon={<Sparkles className="size-4 text-gold" aria-hidden="true" />}
            aside={
              beat === 0 ? (
                <span className="text-xs font-medium tabular-nums text-danger" aria-live="off">
                  Alerting in {countdown}s
                </span>
              ) : undefined
            }
          >
            AI Assistant
          </SectionLabel>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-muted" aria-hidden="true">
              <AudioLines className="size-5" />
            </span>
            <p className="min-h-[3.25rem] flex-1 rounded-2xl rounded-tl-md bg-ink/5 px-4 py-2.5 text-sm leading-relaxed text-ink" aria-live="polite">
              {assistantLine}
            </p>
          </div>
        </Card>

        <Card>
          <SectionLabel icon={<History className="size-4 text-muted" aria-hidden="true" />}>Incident timeline</SectionLabel>
          <ol className="flex flex-col gap-2 text-sm">
            {TIMELINE.map((t) => {
              const done = beat >= t.at;
              return (
                <li key={t.label} className="grid grid-cols-[4.75rem_0.75rem_minmax(0,1fr)] items-center gap-2">
                  <span className={cn('tabular-nums', done ? 'text-muted' : 'text-subtle')}>{t.time}</span>
                  <span
                    className={cn('size-2 rounded-full transition-colors duration-300', done ? 'bg-success' : 'bg-line')}
                    aria-hidden="true"
                  />
                  <span className={cn('truncate transition-colors duration-300', done ? 'text-ink' : 'text-subtle')}>
                    {t.label}
                    {!done && <span className="sr-only"> (pending)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="danger" onClick={() => goTo(2)} disabled={beat >= 2}>
          <Phone className="size-4" aria-hidden="true" />
          I&rsquo;m on it
        </Button>
        <Button variant="outline" onClick={() => goTo(3)} disabled={resolved}>
          <CircleCheck className="size-4" aria-hidden="true" />
          Resolve drill
        </Button>
      </div>
    </div>
  );
}
