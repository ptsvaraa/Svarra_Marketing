import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { TEAM, type TeamMember } from '../../data/team';
import { cn } from '../../lib/cn';
import { LotusDivider } from '../brand/LotusDivider';

/** Groups the team into rows of two; an odd last person gets a row of their own. */
const ROWS: TeamMember[][] = TEAM.reduce<TeamMember[][]>((rows, member, i) => {
  if (i % 2 === 0) rows.push([member]);
  else rows[rows.length - 1]!.push(member);
  return rows;
}, []);

function ProfileCard({ member, className }: { member: TeamMember; className?: string }) {
  const headingId = `team-${member.id}`;
  return (
    // Photo beside the text on wide screens, stacked and centred on smaller ones.
    <article
      aria-labelledby={headingId}
      className={cn(
        'glass flex flex-col items-center gap-5 rounded-[24px] p-7 text-center sm:p-8 lg:flex-row lg:items-start lg:gap-6 lg:text-left',
        className,
      )}
    >
      <div className="shrink-0 rounded-full border-[1.5px] border-gold/60 p-1.5">
        <div className="size-24 overflow-hidden rounded-full bg-tint">
          {member.photo ? (
            <img
              src={`${import.meta.env.BASE_URL}team/${member.photo}`}
              alt={`Portrait of ${member.name}`}
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-subtle" aria-hidden="true">
              <UserRound className="size-10" />
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <h3 id={headingId} className="font-serif text-2xl leading-tight text-heading">
          {member.name}
        </h3>
        <p className="mt-2 text-xs font-medium tracking-[0.16em] text-gold uppercase">
          {member.role}
          {member.location && <span className="text-muted"> · {member.location}</span>}
        </p>
        <span className="mx-auto mt-3 block h-px w-8 bg-gold/70 lg:mx-0" aria-hidden="true" />
        <p className="mt-3 text-[0.95rem] leading-relaxed text-pretty text-ink">{member.bio}</p>
      </div>
    </article>
  );
}

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
            We are a small team of Indian-origin graduates from the Ivy Leagues and IITs. Svaraa is where both halves
            meet: the culture we come from and the technology we’ve spent years learning to build.
          </p>
        </header>

        <div className="mt-14 flex flex-col gap-10 md:gap-12">
          {ROWS.map((row, r) => (
            <motion.div
              key={row[0]!.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: r === 0 ? 0 : 0.05 }}
              className={cn(
                'grid items-stretch gap-10 md:gap-12',
                row.length === 2 ? 'md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'justify-items-center',
              )}
            >
              {row.length === 2 ? (
                <>
                  <ProfileCard member={row[0]!} />
                  <LotusDivider className="max-md:hidden" />
                  <ProfileCard member={row[1]!} />
                </>
              ) : (
                // Same width as a card in a pair: half of the row minus the divider column and gaps.
                <ProfileCard member={row[0]!} className="w-full md:w-[calc((100%-9rem)/2)]" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
