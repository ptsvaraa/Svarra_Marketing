import type { ReactNode } from 'react';
import { Flower2, Info } from 'lucide-react';
import type { SimStatus } from '../../hooks/useSimulation';
import { SvaraaMark } from '../brand/SvaraaMark';
import { LiveDot } from '../ui/Pill';
import { Waveform } from '../ui/Waveform';

const ACTIVITY: Record<SimStatus, string> = {
  idle: 'Waiting to start',
  playing: 'Listening · Responding · Caring',
  paused: 'Paused',
  complete: 'Session complete',
};

interface LiveDemoFrameProps {
  label: string;
  status: SimStatus;
  headerBadge?: string;
  footnote?: string;
  tracker: ReactNode;
  children: ReactNode;
}

export function LiveDemoFrame({ label, status, headerBadge, footnote, tracker, children }: LiveDemoFrameProps) {
  return (
    <section
      aria-label={`${label} live demo`}
      className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-glass-strong"
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-gradient-to-r from-tint via-tint/60 to-transparent px-5 py-4 sm:px-6">
        <SvaraaMark className="size-9 text-gold" />
        <p className="font-serif text-2xl text-heading">Svaraa AI</p>
        <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <LiveDot active={status === 'playing'} />
          Live demo
        </span>
        {headerBadge && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
            <Flower2 className="size-3.5" aria-hidden="true" />
            {headerBadge}
          </span>
        )}
        <div className="ml-auto hidden items-center gap-2.5 text-xs text-muted md:flex">
          <Waveform bars={9} active={status === 'playing'} className="h-5 gap-[2px]" seed={7} />
          {ACTIVITY[status]}
        </div>
      </header>

      <div className="flex-1 p-3 sm:p-6">{children}</div>

      <footer className="flex flex-col gap-4 border-t border-line px-4 py-5 sm:px-6 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">{tracker}</div>
        {footnote && (
          <p className="flex items-start gap-2 text-xs text-muted lg:max-w-56 lg:border-l lg:border-line lg:pl-5">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {footnote}
          </p>
        )}
      </footer>
    </section>
  );
}
