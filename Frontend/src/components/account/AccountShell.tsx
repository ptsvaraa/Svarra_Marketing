import { useEffect, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Sets the browser tab title while a page is shown. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Svaraa`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/** Narrow centred card used by the login and password pages. */
export function AuthCard({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md px-4 pt-12 pb-20 sm:pt-16">
      <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-heading">{title}</h1>
      {intro && <p className="mt-3 leading-relaxed text-muted">{intro}</p>}
      <div className="glass mt-8 rounded-2xl p-5 sm:p-7">{children}</div>
    </section>
  );
}

const NOTICE = {
  error: { icon: AlertCircle, cls: 'border-danger/30 bg-danger-soft text-ink', iconCls: 'text-danger' },
  success: { icon: CheckCircle2, cls: 'border-success/30 bg-success-soft text-ink', iconCls: 'text-success' },
  info: { icon: Info, cls: 'border-warn/30 bg-warn-soft text-ink', iconCls: 'text-warn' },
} as const;

/** A short coloured message box. Errors are announced to screen readers straight away. */
export function Notice({ tone, children, className }: { tone: keyof typeof NOTICE; children: ReactNode; className?: string }) {
  const { icon: Icon, cls, iconCls } = NOTICE[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed', cls, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', iconCls)} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Shown on every account page while the Supabase keys aren't configured. */
export function AccountsUnavailable() {
  return (
    <AuthCard eyebrow="Your account" title="Accounts are coming soon">
      <Notice tone="info">
        Customer accounts aren’t switched on yet. You can still{' '}
        <a href="/pre-order" className="font-medium text-primary underline underline-offset-2">
          reserve your Svaraa
        </a>{' '}
        without one: your reservation will show here once accounts open.
      </Notice>
    </AuthCard>
  );
}
