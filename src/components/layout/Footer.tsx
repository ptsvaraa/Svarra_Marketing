import { Instagram, Linkedin, Mail, Youtube, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { SvaraaMark } from '../brand/SvaraaMark';

interface FooterLink {
  label: string;
  /** Leave undefined until the page exists; the item then renders as plain text, never a dead link. */
  href?: string;
}

interface SocialLink {
  label: string;
  icon: LucideIcon;
  href?: string;
}

// ── Fill these in as pages and accounts go live. ──
const CONTACT_EMAIL: string | undefined = undefined;

const COLUMNS: readonly { title: string; links: readonly FooterLink[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'About Svaraa', href: '#about' },
      { label: 'The 7 Svaraas', href: '#svaraas' },
      { label: 'Why Svaraa', href: '#why' },
      { label: 'Svaraa Lite in 3D', href: '#product' },
      { label: 'Team', href: '#team' },
    ],
  },
  {
    title: 'Resources',
    links: [{ label: 'Blog' }, { label: 'FAQs' }, { label: 'Help & Support' }, { label: 'Contact Us' }],
  },
  {
    title: 'Legal',
    links: [{ label: 'Privacy Policy' }, { label: 'Terms & Conditions' }, { label: 'Cookie Policy' }],
  },
];

const SOCIALS: readonly SocialLink[] = [
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'YouTube', icon: Youtube },
];

const LEGAL_SHORTCUTS = ['Privacy Policy', 'Terms & Conditions'] as const;

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

function FooterAnchor({ link, className }: { link: FooterLink; className?: string }) {
  if (!link.href) {
    return <span className={cn('cursor-default text-subtle', className)}>{link.label}</span>;
  }
  const external = isExternal(link.href);
  return (
    <a
      href={link.href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(
        'rounded text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className,
      )}
    >
      {link.label}
    </a>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const legal = COLUMNS.find((c) => c.title === 'Legal')?.links ?? [];

  return (
    <footer className="mt-8 border-t border-line">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <div className="max-w-sm">
            <a
              href="#top"
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Svaraa home"
            >
              <SvaraaMark className="size-9 text-primary dark:text-gold" />
              <span className="font-serif text-3xl leading-none text-heading dark:text-gold">svaraa</span>
            </a>
            <p className="mt-5 leading-relaxed text-muted">
              An AI-powered, voice-first wearable platform for older adults and the families who care for them.
            </p>
            {CONTACT_EMAIL && (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-5 inline-flex items-center gap-2.5 rounded text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Mail className="size-4 text-accent" aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
            )}
            <ul className="mt-6 flex gap-3" aria-label="Svaraa on social media">
              {SOCIALS.map(({ label, icon: Icon, href }) => {
                const tile = 'inline-flex size-10 items-center justify-center rounded-full border border-line bg-glass-strong';
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${label} (opens in a new tab)`}
                        className={cn(tile, 'text-muted transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary')}
                      >
                        <Icon className="size-[18px]" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className={cn(tile, 'text-subtle')} title={`${label} coming soon`}>
                        <Icon className="size-[18px]" aria-hidden="true" />
                        <span className="sr-only">{label} (coming soon)</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:contents">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-sm font-semibold tracking-[0.18em] text-heading uppercase">{col.title}</h2>
                <ul className="mt-5 space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-7 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Svaraa. All rights reserved.</p>
          <p className="flex items-center gap-3 text-subtle">
            <span className="h-px w-8 bg-gold/50" aria-hidden="true" />
            Thoughtfully designed. Currently in development.
          </p>
          <ul className="flex gap-6">
            {legal
              .filter((l) => (LEGAL_SHORTCUTS as readonly string[]).includes(l.label))
              .map((link) => (
                <li key={link.label}>
                  <FooterAnchor link={link} />
                </li>
              ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
