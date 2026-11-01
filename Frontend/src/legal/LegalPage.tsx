import { useEffect, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { LAST_UPDATED, LEGAL_IS_DRAFT, LEGAL_PATHS } from './company';

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}

export interface LegalDoc {
  title: string;
  /** Short line under the title. */
  summary: string;
  sections: readonly LegalSection[];
}

const OTHER_DOCS = [
  { href: LEGAL_PATHS.privacy, label: 'Privacy Policy' },
  { href: LEGAL_PATHS.terms, label: 'Terms & Conditions' },
  { href: LEGAL_PATHS.cookies, label: 'Cookie Policy' },
] as const;

/** Shared layout for the legal pages: title, contents sidebar, and readable long-form text. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${doc.title} · Svaraa`;
    return () => {
      document.title = previous;
    };
  }, [doc.title]);

  const current = window.location.pathname.replace(/\/+$/, '');

  return (
    <article className="mx-auto max-w-[1320px] px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:px-10">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.32em] text-gold uppercase">
          <FileText className="size-3.5" aria-hidden="true" />
          Legal
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-heading sm:text-5xl">{doc.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{doc.summary}</p>
        <p className="mt-4 text-sm text-subtle">Last updated: {LAST_UPDATED}</p>
        {LEGAL_IS_DRAFT && (
          <p role="note" className="mt-6 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-ink">
            This document is a draft under review and may change before Svaraa launches.
          </p>
        )}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="On this page">
            <p className="text-xs font-semibold tracking-[0.18em] text-heading uppercase">On this page</p>
            <ol className="mt-4 space-y-2 border-l border-line text-sm">
              {doc.sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l border-transparent py-0.5 pl-4 text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <nav aria-label="Other legal documents" className="mt-8 max-lg:hidden">
            <p className="text-xs font-semibold tracking-[0.18em] text-heading uppercase">Also see</p>
            <ul className="mt-3 space-y-2 text-sm">
              {OTHER_DOCS.filter((d) => d.href !== current).map((d) => (
                <li key={d.href}>
                  <a href={d.href} className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
                    {d.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="legal-prose min-w-0 max-w-3xl">
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
              <h2 id={`${s.id}-h`}>
                {i + 1}. {s.heading}
              </h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
