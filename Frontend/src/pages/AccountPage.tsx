import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, LogOut, Package, UserRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { AccountsUnavailable, Notice, usePageTitle } from '../components/account/AccountShell';
import { formatFee } from '../data/preorder';
import { AccountError, fetchProfile, ORDER_STATUS, updateProfile, type AccountOrder, type Profile } from '../lib/account';
import { ACCOUNT_PATHS, supabase, useSession } from '../lib/auth';
import { cn } from '../lib/cn';

const TONES = {
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-ink/5 text-muted',
} as const;

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** "+919876543210" -> "9876543210", for the input next to the fixed +91. */
const localPhone = (phone: string | null) => (phone ?? '').replace(/^\+91/, '');

function OrderCard({ order }: { order: AccountOrder }) {
  const status = ORDER_STATUS[order.status] ?? { label: order.status.replace(/_/g, ' '), tone: 'neutral' as const };
  const rows: [string, string][] = [
    ['Pendants', String(order.quantity)],
    ['Pre-order price', `${formatFee(order.pricePerPendant, order.currency)} each`],
    ['Paid so far', formatFee(order.paid, order.currency)],
  ];
  if (order.refunded > 0) rows.push(['Refunded', formatFee(order.refunded, order.currency)]);

  return (
    <li className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-subtle uppercase">Reference</p>
          <p className="mt-1 font-mono text-lg font-semibold text-heading">{order.reference}</p>
        </div>
        <span className={cn('inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold', TONES[status.tone])}>{status.label}</span>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-subtle">{k}</dt>
            <dd className="mt-0.5 font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-line pt-3 text-xs text-subtle">
        {order.buyerType === 'business' ? 'Business order' : 'Individual order'} · Reserved{' '}
        {dateFormat.format(new Date(order.paidAt ?? order.createdAt))}
      </p>
    </li>
  );
}

export default function AccountPage() {
  usePageTitle('My profile');
  const session = useSession();
  const token = session.status === 'signedIn' ? session.session.access_token : null;
  // Latest token, read by the loader without re-running it on every refresh.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const uid = useId();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [passwordUpdated] = useState(() => new URLSearchParams(window.location.search).get('password') === 'updated');

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    window.location.replace(ACCOUNT_PATHS.login);
  }, []);

  // Logged out: to the login page.
  useEffect(() => {
    if (session.status === 'signedOut' && supabase) window.location.replace(ACCOUNT_PATHS.login);
  }, [session.status]);

  // Load once per login (not on every token refresh).
  const userId = session.status === 'signedIn' ? session.session.user.id : null;
  useEffect(() => {
    const current = tokenRef.current;
    if (!userId || !current) return;
    let active = true;
    fetchProfile(current)
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setFullName(p.fullName ?? '');
        setPhone(localPhone(p.phone));
      })
      .catch((err: AccountError) => {
        if (!active) return;
        if (err.status === 401) void signOut();
        else setLoadError(err.message);
      });
    return () => {
      active = false;
    };
  }, [userId, signOut]);

  if (!supabase) return <AccountsUnavailable />;

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaveMessage(null);
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''))) e.phone = 'Enter a 10-digit Indian mobile number.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const p = await updateProfile(token, { fullName: fullName.trim(), phone });
      setProfile(p);
      setFullName(p.fullName ?? '');
      setPhone(localPhone(p.phone));
      setSaveMessage({ tone: 'success', text: 'Your details are saved.' });
    } catch (err) {
      const ae = err as AccountError;
      if (ae.status === 401) return void signOut();
      setErrors(ae.fieldErrors ?? {});
      setSaveMessage({ tone: 'error', text: ae.message });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <section className="mx-auto max-w-[1320px] px-4 pt-16 pb-24 sm:px-6 lg:px-10">
        {loadError ? (
          <div className="mx-auto max-w-md space-y-4">
            <Notice tone="error">{loadError}</Notice>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 text-muted">
            <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" /> Loading your profile…
          </p>
        )}
      </section>
    );
  }

  const greetingName = profile.fullName?.split(/\s+/)[0];

  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.32em] text-gold uppercase">My profile</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-heading sm:text-5xl">
            {greetingName ? `Hello, ${greetingName}` : 'Your account'}
          </h1>
          <p className="mt-2 truncate text-muted">{profile.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Button>
      </header>

      {passwordUpdated && (
        <Notice tone="success" className="mt-8 max-w-xl">
          Your password has been changed.
        </Notice>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
            <UserRound className="size-5 text-primary" aria-hidden="true" />
            My details
          </h2>
          <form noValidate onSubmit={onSave} className="glass mt-4 space-y-5 rounded-2xl p-5 sm:p-6">
            {saveMessage && <Notice tone={saveMessage.tone}>{saveMessage.text}</Notice>}
            <Field id={`${uid}-name`} label="Full name" error={errors.fullName}>
              <input
                id={`${uid}-name`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? `${uid}-name-error` : undefined}
                className={inputClass(!!errors.fullName)}
              />
            </Field>
            <Field id={`${uid}-phone`} label="Mobile number" error={errors.phone}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[0.95rem] text-muted">+91</span>
                <input
                  id={`${uid}-phone`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
                  className={cn(inputClass(!!errors.phone), 'pl-13')}
                />
              </div>
            </Field>
            <Field id={`${uid}-email`} label="Email" hint="Your login email. Reservations made with it appear here.">
              <input
                id={`${uid}-email`}
                value={profile.email}
                readOnly
                aria-describedby={`${uid}-email-hint`}
                className={cn(inputClass(), 'cursor-default text-muted hover:border-line')}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save details
            </Button>
          </form>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
            <Package className="size-5 text-primary" aria-hidden="true" />
            My reservations
          </h2>
          {profile.orders.length ? (
            <ul className="mt-4 space-y-4">
              {profile.orders.map((o) => (
                <OrderCard key={o.reference} order={o} />
              ))}
            </ul>
          ) : (
            <div className="glass mt-4 rounded-2xl p-6 sm:p-8">
              <p className="font-medium text-heading">No reservations yet</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Reserve your Svaraa Fold with {profile.email} and it will show up here.
              </p>
              <a
                href="/pre-order#reserve"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 font-medium text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Reserve now
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
