import { ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { SvaraaMark } from '../brand/SvaraaMark';

const LINKS = [
  // Rooted at "/" so they also work from the pre-order page.
  { href: '/#about', label: 'About Svaraa' },
  { href: '/#svaraas', label: 'The 7 Svaraas' },
  { href: '/#why', label: 'Why Svaraa' },
  { href: '/#product', label: 'Product' },
  { href: '/#team', label: 'Team' },
] as const;

/** Where the Pre-Order button goes. Set to undefined to show it as a placeholder that goes nowhere. */
const PREORDER_HREF: string | undefined = '/pre-order';

const preorderClass =
  'inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium whitespace-nowrap text-on-primary shadow-[0_10px_24px_-14px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function Navbar() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    // Sticky rather than fixed: it stays in the flow, so nothing below needs a spacer.
    // Full-bleed bar flush with the top edge; the inner nav keeps the page's content width.
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10"
      >
        <a href="/#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-primary" aria-label="Svaraa home">
          <SvaraaMark className="size-9 text-primary dark:text-gold" />
          <span className="font-serif text-3xl leading-none text-heading dark:text-gold">svaraa</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-6">
          <ul className="hidden items-center gap-4 lg:flex xl:gap-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-lg px-2 py-1 text-[0.95rem] text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {PREORDER_HREF ? (
            <a href={PREORDER_HREF} className={preorderClass}>
              Pre-Order
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          ) : (
            <button type="button" aria-disabled="true" title="Pre-orders open soon" className={preorderClass}>
              Pre-Order
              <ArrowRight className="size-4" aria-hidden="true" />
              <span className="sr-only"> (coming soon)</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-line text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
          >
            {dark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>
    </header>
  );
}
