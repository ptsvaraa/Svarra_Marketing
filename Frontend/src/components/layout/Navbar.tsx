import { useEffect, useId, useState } from 'react';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { PREORDER_OPEN } from '../../data/preorder';
import { cn } from '../../lib/cn';
import { SvaraaMark } from '../brand/SvaraaMark';

const LINKS = [
  // Rooted at "/" so they also work from the pre-order page.
  { href: '/#about', label: 'About Svaraa' },
  { href: '/#svaraas', label: 'The 7 Svaraas' },
  { href: '/#why', label: 'Why Svaraa' },
  { href: '/#product', label: 'Product' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#team', label: 'Team' },
] as const;

/** Where the Pre-Order button goes. Set to undefined to show it as a placeholder that goes nowhere. */
const PREORDER_HREF: string | undefined = '/pre-order';

const preorderClass =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium whitespace-nowrap text-on-primary shadow-[0_10px_24px_-14px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-10 sm:px-4';

/** Square icon button; each use adds its own display, so it can hide at some widths. */
const iconButtonClass =
  'size-9 shrink-0 items-center justify-center rounded-xl border border-line text-primary transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary sm:size-10';

export function Navbar() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const menuId = useId();

  // Close the menu with Escape, and when the screen grows wide enough to show the links inline.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const wide = window.matchMedia('(min-width: 1280px)');
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  const themeLabel = dark ? 'Switch to light theme' : 'Switch to dark theme';
  const ThemeIcon = dark ? Sun : Moon;

  return (
    // Sticky rather than fixed: it stays in the flow, so nothing below needs a spacer.
    // Full-bleed bar flush with the top edge; the inner nav keeps the page's content width.
    <header className="sticky top-0 z-50 isolate">
      {/*
        The frosted glass sits on its own layer behind the bar, not on the sticky bar itself:
        iPhone Safari clips or squashes sticky elements that carry a backdrop blur while its
        address bar slides in and out on scroll.
      */}
      <div aria-hidden="true" className="glass pointer-events-none absolute inset-0 -z-10 border-x-0 border-t-0" />
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10"
      >
        <a
          href="/#top"
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-primary sm:gap-2.5"
          aria-label="Svaraa home"
        >
          <SvaraaMark className="size-9 shrink-0 text-primary sm:size-11 dark:text-gold" />
          <span className="flex min-w-0 flex-col">
            <span className="font-serif text-2xl leading-none text-heading sm:text-3xl dark:text-gold">svaraa</span>
            {/* The tagline steps aside on the narrowest phones so the buttons fit. */}
            <span className="mt-1 truncate text-[0.62rem] leading-none font-semibold text-heading max-[359px]:hidden sm:text-xs dark:text-gold/85">
              AI Cognitive Companion
            </span>
          </span>
        </a>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 xl:gap-5">
          <ul className="hidden items-center gap-5 xl:flex 2xl:gap-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-lg px-2 py-1 text-[0.95rem] whitespace-nowrap text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {!PREORDER_OPEN ? null : PREORDER_HREF ? (
            <a href={PREORDER_HREF} className={preorderClass}>
              Pre-Order
              <ArrowRight className="hidden size-4 min-[400px]:block" aria-hidden="true" />
            </a>
          ) : (
            <button type="button" aria-disabled="true" title="Pre-orders open soon" className={preorderClass}>
              Pre-Order
              <ArrowRight className="hidden size-4 min-[400px]:block" aria-hidden="true" />
              <span className="sr-only"> (coming soon)</span>
            </button>
          )}
          {/* Theme switch: here from small tablets up; inside the menu on phones. */}
          <button type="button" onClick={toggle} aria-label={themeLabel} className={cn(iconButtonClass, 'hidden sm:inline-flex')}>
            <ThemeIcon className="size-5" aria-hidden="true" />
          </button>
          {/* Menu for the page links until the screen is wide enough to show them all inline. */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={cn(iconButtonClass, 'inline-flex xl:hidden')}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id={menuId} className="absolute inset-x-0 top-full border-b border-line bg-canvas shadow-[0_24px_40px_-24px_var(--c-shadow)] xl:hidden">
          <ul className="mx-auto flex max-w-[1320px] flex-col px-4 py-2 sm:px-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-lg px-2 text-base text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-2 sm:hidden">
              <button
                type="button"
                onClick={toggle}
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-base text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <ThemeIcon className="size-5 text-primary" aria-hidden="true" />
                {dark ? 'Light theme' : 'Dark theme'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
