import { cn } from '../../lib/cn';

interface Org {
  name: string;
  href: string;
  logo: string;
  /** Intrinsic size of the file, so the browser reserves space before it loads. */
  width: number;
  height: number;
  /** Per-logo height so wide wordmarks and stacked lockups look balanced. */
  className: string;
}

// Official logos, from Wikimedia Commons and the schools' own sites.
const ORGS: readonly Org[] = [
  { name: 'Columbia Business School', href: 'https://business.columbia.edu/', logo: 'columbia-business-school.svg', width: 146, height: 61, className: 'h-11' },
  { name: 'Yale School of Management', href: 'https://som.yale.edu/', logo: 'yale-som.webp', width: 480, height: 238, className: 'h-12' },
  { name: 'University of Pennsylvania', href: 'https://www.upenn.edu/', logo: 'penn.svg', width: 248, height: 115, className: 'h-12' },
  { name: 'University of Chicago', href: 'https://www.uchicago.edu/', logo: 'uchicago.svg', width: 262, height: 53, className: 'h-7' },
  { name: 'IIT Kharagpur', href: 'https://www.iitkgp.ac.in/', logo: 'iit-kharagpur.webp', width: 513, height: 123, className: 'h-8' },
];

/**
 * With few logos, one set is narrower than the screen and the loop would show gaps,
 * so each set repeats the logos enough times to span the widest layout.
 */
const REPEATS = Math.max(1, Math.ceil(8 / ORGS.length));
const SET = Array.from({ length: REPEATS }, (_, r) => ORGS.map((org) => ({ org, copy: r }))).flat();

function LogoList({ clone = false }: { clone?: boolean }) {
  return (
    <ul
      className={cn('flex shrink-0 items-center gap-5 pr-5 sm:gap-6 sm:pr-6', clone && 'marquee-clone')}
      // The clone only exists to make the loop seamless; hide it from assistive tech and tab order.
      aria-hidden={clone || undefined}
    >
      {SET.map(({ org, copy }) => {
        // Only the first copy of each logo is exposed to assistive tech and the tab order.
        const hidden = clone || copy > 0;
        return (
          <li
            key={`${org.name}-${copy}`}
            // Repeats are hidden too when motion is reduced, leaving one still row of each logo.
            className={cn('shrink-0', copy > 0 && 'marquee-clone')}
            aria-hidden={(!clone && copy > 0) || undefined}
          >
            <a
              href={org.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={hidden ? -1 : undefined}
              aria-label={`${org.name} (opens in a new tab)`}
              className="group flex h-20 w-44 items-center justify-center rounded-2xl border border-line bg-white px-5 shadow-[0_8px_24px_-18px_var(--c-shadow)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_14px_30px_-16px_var(--c-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-48"
            >
              <img
                src={`${import.meta.env.BASE_URL}logos/${org.logo}`}
                width={org.width}
                height={org.height}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className={cn('w-auto max-w-full object-contain', org.className)}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function TrustStrip() {
  return (
    <section aria-labelledby="trust-title" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
      <div className="border-t border-line pt-8">
        <h2
          id="trust-title"
          className="mx-auto max-w-3xl text-center font-serif text-2xl leading-snug tracking-tight text-balance text-heading sm:text-[1.75rem]"
        >
          Core Team and Advisors <em className="text-accent">hail from</em>
        </h2>
        <div className="marquee-viewport no-scrollbar -mx-4 mt-6 overflow-hidden px-4 py-2 sm:mx-0 sm:px-0">
          <div className="marquee-track flex w-max">
            <LogoList />
            <LogoList clone />
          </div>
        </div>
        <p className="mt-12 flex items-center justify-center gap-4 text-sm text-muted">
          <span className="h-px w-12 bg-gold/50" aria-hidden="true" />
          Human connection. Thoughtful technology.
          <span className="h-px w-12 bg-gold/50" aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
