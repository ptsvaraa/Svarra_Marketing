import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AudioLines, Brain, Check, ChevronRight, CircleCheck, Lightbulb } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { Card } from '../../ui/Card';
import { Reveal } from '../../ui/Reveal';
import type { ConversationLang } from '../../../data/svaraas';
import type { DemoProps } from '../demo-kit';

const OPTIONS = [7, 8, 10] as const;
const ANSWER = 8;

const PROMPTS = {
  en: [
    'Let’s begin with a gentle seated stretch. Raise your arms slowly, and breathe.',
    'Well done. Now, shall we give your mind a little puzzle?',
    'Well done. Now, shall we give your mind a little puzzle?',
    'Lovely. Let’s take a quiet breathing moment.',
    'That was a wonderful session, Amma.',
  ],
  hi: [
    'चलिए, बैठे-बैठे हल्के खिंचाव से शुरू करते हैं। धीरे-धीरे हाथ ऊपर उठाइए, और साँस लीजिए।',
    'बहुत बढ़िया। अब दिमाग़ के लिए एक छोटी-सी पहेली हो जाए? दो, चार, छह, इसके बाद क्या आएगा?',
    'बहुत बढ़िया। अब दिमाग़ के लिए एक छोटी-सी पहेली हो जाए? दो, चार, छह, इसके बाद क्या आएगा?',
    'सुंदर। चलिए, थोड़ी देर शांति से साँस लेते हैं।',
    'आज का अभ्यास बहुत अच्छा रहा, अम्मा।',
  ],
} as const satisfies Record<ConversationLang, readonly [string, string, string, string, string]>;

type ActivityState = 'upcoming' | 'active' | 'done';

function Activity({ index, title, state }: { index: string; title: string; state: ActivityState }) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl border border-line bg-glass-strong px-4 py-3">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
          state === 'done' && 'bg-success text-white',
          state === 'active' && 'bg-gold/20 ring-2 ring-gold',
          state === 'upcoming' && 'border-2 border-line',
        )}
        aria-hidden="true"
      >
        {state === 'done' ? <Check className="size-4" strokeWidth={3} /> : state === 'active' ? <span className="size-2.5 rounded-full bg-gold" /> : null}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-ink">
          {index} · {title}
        </p>
        <p className={cn('text-xs', state === 'done' ? 'text-success' : state === 'active' ? 'text-gold' : 'text-subtle')}>
          {state === 'done' ? 'Complete' : state === 'active' ? 'In progress' : 'Up next'}
        </p>
      </div>
    </div>
  );
}

export function RiddleDemo({ beat, isPlaying, isComplete, goTo, lang }: DemoProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = beat >= 2;
  const breathing = beat === 3;
  const prompts = PROMPTS[lang];
  const prompt = prompts[Math.min(beat, prompts.length - 1)];

  const choose = (n: number) => {
    setPicked(n);
    goTo(2);
  };

  const feedback =
    picked === null
      ? 'The answer is 8. Each number grows by two.'
      : picked === ANSWER
        ? 'That’s right!'
        : 'Nice try. It’s 8, each number grows by two.';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Activity index="01" title="Seated stretch" state={beat >= 1 ? 'done' : 'active'} />
        <span className="hidden h-px w-8 shrink-0 bg-line sm:block" aria-hidden="true" />
        <Activity index="02" title="Number pattern" state={beat >= 3 ? 'done' : beat >= 1 ? 'active' : 'upcoming'} />
      </div>

      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-accent" aria-hidden="true">
          <AudioLines className="size-5" />
        </span>
        <div className="grid min-h-[3.25rem] flex-1 items-center rounded-2xl rounded-tl-md bg-accent/10 px-4 py-2.5 text-primary dark:bg-tint" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={prompt}
              lang={lang}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[0.95rem] leading-relaxed"
            >
              {prompt}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <Reveal show={beat >= 1}>
        <Card className="text-center">
          <p className="flex items-center justify-center gap-2 font-serif text-xl text-heading">
            <Brain className="size-5 text-primary" aria-hidden="true" />
            What comes next?
          </p>
          <p className="mt-1 font-serif text-4xl tracking-wide text-heading" aria-label="2, 4, 6, what comes next?">
            2 · 4 · 6 · ?
          </p>
          <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-3" role="group" aria-label="Answer options">
            {OPTIONS.map((n) => {
              const isAnswer = answered && n === ANSWER;
              const isWrongPick = answered && picked === n && n !== ANSWER;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => choose(n)}
                  disabled={answered}
                  aria-pressed={picked === n}
                  className={cn(
                    'h-14 rounded-xl border font-serif text-2xl transition-[background-color,border-color,color] duration-300',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    isAnswer
                      ? 'border-success bg-success-soft text-success'
                      : isWrongPick
                        ? 'border-line bg-ink/5 text-subtle line-through'
                        : 'border-line bg-tint/60 text-heading enabled:hover:border-primary/40 enabled:hover:bg-tint',
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex h-5 items-center justify-center gap-1.5 text-sm font-medium text-success" aria-live="polite">
            {answered && (
              <>
                {picked === null || picked === ANSWER ? (
                  <CircleCheck className="size-4" aria-hidden="true" />
                ) : (
                  <Lightbulb className="size-4 text-gold" aria-hidden="true" />
                )}
                <span className={cn(picked !== null && picked !== ANSWER && 'text-muted')}>{feedback}</span>
              </>
            )}
          </p>
        </Card>
      </Reveal>

      <Card className="flex items-center gap-4 py-3 sm:py-3">
        <div className="relative flex size-14 shrink-0 items-center justify-center" data-active={breathing && isPlaying} aria-hidden="true">
          <span className="breathe absolute inset-0 rounded-full border-2 border-accent/30" />
          <span className="breathe absolute inset-2 rounded-full border-2 border-accent/50 [animation-delay:-0.6s]" />
          <span className="breathe absolute inset-4 rounded-full border-2 border-accent/70 [animation-delay:-1.2s]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">
            <span className="font-medium text-heading">{isComplete ? 'Done' : breathing ? 'Now' : 'Next'}</span>
            <span aria-hidden="true"> · </span>A quiet breathing moment
          </p>
          <p className="text-xs text-muted">
            {breathing ? 'Breathe in slowly… and out.' : 'Take a few calm breaths to settle and feel good.'}
          </p>
        </div>
        <ChevronRight className="size-4 text-subtle" aria-hidden="true" />
      </Card>
    </div>
  );
}
