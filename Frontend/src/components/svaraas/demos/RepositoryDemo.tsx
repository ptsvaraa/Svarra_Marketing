import { useState } from 'react';
import { Bookmark, BookmarkCheck, FileCheck2, FileText, Mic, Quote, ShieldCheck, Users } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { formatClock, useElapsedSeconds } from '../../../hooks/useElapsedSeconds';
import { Button } from '../../ui/Button';
import { Card, IconTile } from '../../ui/Card';
import { LiveDot, Pill } from '../../ui/Pill';
import { Reveal } from '../../ui/Reveal';
import { Waveform } from '../../ui/Waveform';
import type { ConversationLang } from '../../../data/svaraas';
import { ChatMessage, replyState, type DemoProps } from '../demo-kit';

const STORY_LENGTH = 312;

const CHAT = {
  en: {
    request: 'Svaraa, save the story about our first home.',
    reply: 'With your permission, I’ll keep the story and its key moments.',
    transcript: 'We planted that first jasmine together. It was a small house, but it felt like a palace…',
  },
  hi: {
    request: 'स्वरा, हमारे पहले घर वाली कहानी सहेज लो।',
    reply: 'आपकी अनुमति से, मैं यह कहानी और इसके ख़ास पल सहेज लूँगी।',
    transcript: 'वह पहली चमेली हमने साथ मिलकर लगाई थी। घर छोटा था, पर महल जैसा लगता था…',
  },
} as const satisfies Record<ConversationLang, Record<string, string>>;

const TAKEAWAYS = ['A new beginning in Chennai', 'The garden Amma planted', 'Sunday mornings on the verandah'] as const;

export function RepositoryDemo({ beat, isPlaying, goTo, lang }: DemoProps) {
  const chat = CHAT[lang];
  const [reviewed, setReviewed] = useState(false);
  const capturing = beat === 2;
  const saved = beat >= 4;
  const elapsed = useElapsedSeconds(capturing && isPlaying);
  // Capture is compressed: each demo second stands for ~a minute of story.
  const captured = beat > 2 ? STORY_LENGTH : Math.min(STORY_LENGTH, elapsed * 72);

  return (
    <div className="flex flex-col gap-4">
      <Reveal show={beat >= 1}>
        <p className="flex items-center gap-2.5 rounded-xl bg-success-soft px-4 py-2.5 text-sm text-success">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          Recording consent confirmed.
        </p>
      </Reveal>

      <ChatMessage speaker="person" name="Appa" time="10:14 AM" avatar={<Mic className="size-5 text-accent" />}>
        {chat.request}
      </ChatMessage>
      <ChatMessage speaker="svaraa" name="Svaraa AI" time="10:14 AM" state={replyState(beat, 1, isPlaying)}>
        {chat.reply}
      </ChatMessage>

      <Reveal show={beat >= 2}>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <IconTile className="bg-gold/15 text-gold">
              {saved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-xl text-heading">Our first home</p>
              <p className="text-xs text-muted">Family story · Today · 5 min</p>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              {capturing && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
                  <LiveDot tone="warn" active={isPlaying} />
                  {isPlaying ? 'Capturing' : 'Paused'}
                </span>
              )}
              <Waveform bars={30} active={capturing && isPlaying} progress={captured / STORY_LENGTH} seed={5.3} className="hidden sm:flex" />
              <span className="text-xs tabular-nums text-muted">
                {formatClock(captured)} / {formatClock(STORY_LENGTH)}
              </span>
            </div>
          </div>

          <Reveal show={beat >= 3}>
            <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-2 md:gap-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-heading">Key takeaways</p>
                <ul className="flex flex-col gap-1.5 text-sm text-ink">
                  {TAKEAWAYS.map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="size-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <figure>
                <figcaption className="mb-2 text-sm font-semibold text-heading">Transcript excerpt</figcaption>
                <blockquote lang={lang} className="flex gap-2 rounded-xl bg-ink/5 p-3 font-serif text-[0.95rem] italic leading-relaxed text-ink">
                  <Quote className="size-4 shrink-0 text-gold" aria-hidden="true" />
                  {chat.transcript}
                </blockquote>
              </figure>
            </div>
          </Reveal>
        </Card>
      </Reveal>

      <Reveal show={beat >= 3}>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => goTo(4)} disabled={saved}>
            {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
            {saved ? 'Saved to Repository' : 'Save to Repository'}
          </Button>
          <Button variant="outline" onClick={() => setReviewed(true)} disabled={reviewed}>
            {reviewed ? <FileCheck2 className="size-4" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
            {reviewed ? 'Notes reviewed' : 'Review notes'}
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-glass-strong px-3 py-2 text-sm text-ink sm:ml-auto">
            <Users className="size-4 text-muted" aria-hidden="true" />
            Share with Priya
            <Pill tone={saved ? 'success' : 'warn'} className={cn('ml-1')}>
              {saved ? 'Request sent' : 'Awaiting approval'}
            </Pill>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
