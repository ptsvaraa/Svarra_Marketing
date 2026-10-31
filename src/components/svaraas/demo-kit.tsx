import type { ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import type { ConversationLang } from '../../data/svaraas';
import { cn } from '../../lib/cn';
import { SvaraaMark } from '../brand/SvaraaMark';
import { Reveal } from '../ui/Reveal';

/** Props every per-tab demo receives from the simulation. */
export interface DemoProps {
  beat: number;
  isPlaying: boolean;
  isComplete: boolean;
  goTo: (beat: number) => void;
  togglePlayback: () => void;
  /** Language of the conversation (chat bubbles and spoken prompts). Everything else stays in English. */
  lang: ConversationLang;
}

export type MessageState = 'hidden' | 'typing' | 'shown';

/** A reply appears at `at`, and shows a typing indicator during the beat before it. */
export function replyState(beat: number, at: number, isPlaying: boolean): MessageState {
  if (beat >= at) return 'shown';
  if (beat === at - 1 && isPlaying) return 'typing';
  return 'hidden';
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-label="Svaraa is responding">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot size-1.5 rounded-full bg-current"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

interface ChatMessageProps {
  speaker: 'person' | 'svaraa';
  name: string;
  time: string;
  /** Overrides the time in the meta line, e.g. "Speaking…". */
  status?: ReactNode;
  avatar?: ReactNode;
  state?: MessageState;
  className?: string;
  children: ReactNode;
}

export function ChatMessage({
  speaker,
  name,
  time,
  status,
  avatar,
  state = 'shown',
  className,
  children,
}: ChatMessageProps) {
  const isSvaraa = speaker === 'svaraa';
  const typing = state === 'typing';

  return (
    <Reveal show={state !== 'hidden'} className={cn('flex items-start gap-3', className)}>
      <span
        className={cn(
          'mt-5 inline-flex size-10 shrink-0 items-center justify-center rounded-full',
          isSvaraa ? 'bg-tint text-primary' : 'bg-ink/5 text-muted',
        )}
        aria-hidden="true"
      >
        {avatar ?? (isSvaraa ? <SvaraaMark className="size-6" /> : <UserRound className="size-5" />)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs text-muted">
          <span className={cn('font-medium', isSvaraa ? 'text-primary' : 'text-ink')}>{name}</span>
          <span aria-hidden="true"> · </span>
          <span className={cn(status ? 'text-gold' : undefined)}>{typing ? 'Thinking…' : (status ?? time)}</span>
        </p>
        <div
          className={cn(
            'inline-grid max-w-full rounded-2xl rounded-tl-md px-4 py-2.5 text-[0.95rem] leading-relaxed',
            isSvaraa ? 'bg-accent/10 text-primary dark:bg-tint' : 'bg-ink/5 text-ink',
          )}
        >
          {/* Text and dots share one grid cell, so the bubble is sized for the final text. */}
          <div className={cn('[grid-area:1/1]', typing && 'invisible')}>{children}</div>
          {typing && (
            <div className="flex items-center [grid-area:1/1]">
              <TypingDots />
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export function SectionLabel({ icon, children, aside }: { icon?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h4 className="flex items-center gap-2 font-serif text-lg text-heading">
        {icon}
        {children}
      </h4>
      {aside}
    </div>
  );
}
