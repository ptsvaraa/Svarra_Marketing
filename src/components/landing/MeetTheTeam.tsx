import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { SvaraaMark } from '../brand/SvaraaMark';

const PILLARS = [
  {
    id: 'why',
    eyebrow: 'Why we build Svaraa',
    body: 'We believe technology for older adults should feel familiar, not complicated. It should speak their language, respect their routines and fit quietly into everyday life. That belief shapes every decision we make, from the voice Svaraa speaks in to the way it reaches family.',
  },
  {
    id: 'how',
    eyebrow: 'How we work',
    body: 'We design with families, not just for them. Every feature is shaped by real conversations with older adults, caretakers and guardians, and tested in real homes before it reaches yours.',
  },
] as const;

export function MeetTheTeam() {
  return (
    <section id="team" aria-labelledby="team-title" className="scroll-mt-6 px-4 pt-20 pb-16 sm:px-6 sm:pt-28 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">Meet the team</p>
          <h2
            id="team-title"
            className="mt-5 font-serif text-4xl leading-tight tracking-tight text-balance text-heading sm:text-5xl"
          >
            Raised on bhajans at dawn,
            <em className="block text-accent">trained on the hardest problems in computing.</em>
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-pretty text-muted">
            We are a small team of Indian-origin graduates from the Ivy League and IIT. Svaraa is where both halves
            meet: the culture we come from and the technology we’ve spent years learning to build.
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mt-14 grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-12"
        >
          {PILLARS.map((pillar, i) => (
            <article
              key={pillar.id}
              aria-labelledby={`team-${pillar.id}`}
              className={cn(
                'glass rounded-[24px] p-7 sm:p-8',
                // The mark sits between the two columns on wide screens.
                i === 1 && 'md:col-start-3',
              )}
            >
              <h3 id={`team-${pillar.id}`} className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
                {pillar.eyebrow}
              </h3>
              <p className="mt-4 font-serif text-xl leading-relaxed text-heading">{pillar.body}</p>
            </article>
          ))}
          <div
            className="hidden self-stretch md:col-start-2 md:row-start-1 md:flex md:flex-col md:items-center"
            aria-hidden="true"
          >
            <span className="w-px flex-1 bg-gold/40" />
            <SvaraaMark className="my-4 size-12 text-gold" />
            <span className="w-px flex-1 bg-gold/40" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
