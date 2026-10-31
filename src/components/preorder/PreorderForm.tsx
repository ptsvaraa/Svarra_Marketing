import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Building2, CheckCircle2, ChevronDown, Info, Loader2, Lock, Mail, User } from 'lucide-react';
import {
  BUSINESS_CONTACT_EMAIL,
  BUSINESS_MAX_QUANTITY,
  BUYER_TYPES,
  feeLines,
  feeTotal,
  formatFee,
  INDIAN_STATES,
  quantityRange,
  WEARERS,
  type BuyerType,
} from '../../data/preorder';
import { cn } from '../../lib/cn';
import {
  clearDraft,
  fetchCheckoutResult,
  loadDraft,
  PreorderUnavailableError,
  saveDraft,
  startCheckout,
  validatePreorder,
  type CheckoutResult,
  type PreorderDetails,
  type PreorderErrors,
} from '../../lib/preorder';

const EMPTY: PreorderDetails = {
  buyerType: 'individual',
  organisation: '',
  gstin: '',
  fullName: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  quantity: 1,
  wearer: 'parent',
  consent: false,
};

/** Order of fields on the page, so the first invalid one can be focused. */
const FIELD_ORDER: (keyof PreorderDetails)[] = [
  'organisation',
  'gstin',
  'fullName',
  'phone',
  'email',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'consent',
];

const inputClass = (invalid?: boolean) =>
  cn(
    'h-12 w-full rounded-xl border bg-glass-strong px-4 text-[0.95rem] text-ink placeholder:text-subtle',
    'transition-colors duration-150 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary/30',
    invalid ? 'border-danger' : 'border-line hover:border-primary/40',
  );

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}

function Field({ id, label, error, optional, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-heading">
        {label}
        {optional && <span className="ml-1.5 font-normal text-subtle">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function SectionTitle({ step, children }: { step: number; children: ReactNode }) {
  return (
    <legend className="mb-4 flex items-center gap-3 font-serif text-xl text-heading">
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 font-sans text-xs font-semibold text-primary">
        {step}
      </span>
      {children}
    </legend>
  );
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'verifying' }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }
  | { kind: 'paid'; result: CheckoutResult };

const UNAVAILABLE = 'Online reservations are not open just yet. Please check back very soon.';

/** Reads Stripe's return parameters once, then tidies the address bar. */
function readCheckoutReturn(): { outcome: 'success' | 'cancelled'; sessionId: string | null } | null {
  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('checkout');
  if (outcome !== 'success' && outcome !== 'cancelled') return null;
  window.history.replaceState(null, '', `${window.location.pathname}#reserve`);
  return { outcome, sessionId: params.get('session_id') };
}

export function PreorderForm() {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [data, setData] = useState<PreorderDetails>(EMPTY);
  const [errors, setErrors] = useState<PreorderErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PreorderDetails, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);

  // Coming back from Stripe: confirm the payment, or refill the form after a cancel.
  useEffect(() => {
    const back = readCheckoutReturn();
    if (!back) return;
    document.getElementById('reserve')?.scrollIntoView({ block: 'start' });
    const draft = loadDraft();
    if (back.outcome === 'cancelled' || !back.sessionId) {
      if (draft) setData({ ...EMPTY, ...draft });
      setStatus({ kind: 'cancelled' });
      return;
    }
    setStatus({ kind: 'verifying' });
    fetchCheckoutResult(back.sessionId)
      .then((result) => {
        if (result.paid) {
          clearDraft();
          setStatus({ kind: 'paid', result });
        } else {
          if (draft) setData({ ...EMPTY, ...draft });
          setStatus({ kind: 'error', message: 'Your payment has not gone through yet. Please try again.' });
        }
      })
      .catch(() => {
        if (draft) setData({ ...EMPTY, ...draft });
        setStatus({
          kind: 'error',
          message: 'We could not confirm your payment. If you were charged, your receipt from Stripe is your confirmation.',
        });
      });
  }, []);

  const set = <K extends keyof PreorderDetails>(key: K, value: PreorderDetails[K]) => {
    const next = { ...data, [key]: value };
    setData(next);
    // Once a field has been left, re-check it as the visitor types so the error clears promptly.
    if (touched[key]) setErrors((prev) => ({ ...prev, [key]: validatePreorder(next)[key] }));
  };

  const setBuyerType = (buyerType: BuyerType) => {
    const { min } = quantityRange(buyerType);
    setData((d) => ({ ...d, buyerType, quantity: min }));
    setErrors((prev) => ({ ...prev, organisation: undefined, gstin: undefined, quantity: undefined }));
  };

  const blur = (key: keyof PreorderDetails) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validatePreorder(data)[key] }));
  };

  // Shared props for a validated text field.
  const bind = (key: keyof PreorderDetails) => ({
    id: id(key),
    name: key,
    'aria-invalid': !!errors[key] || undefined,
    'aria-describedby': errors[key] ? `${id(key)}-error` : undefined,
    onBlur: () => blur(key),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validatePreorder(data);
    setErrors(found);
    setTouched(Object.fromEntries(FIELD_ORDER.map((k) => [k, true])));
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
      return;
    }
    setStatus({ kind: 'submitting' });
    try {
      const url = await startCheckout(data);
      saveDraft(data);
      window.location.assign(url);
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof PreorderUnavailableError
            ? UNAVAILABLE
            : 'We could not start the payment. Please check your connection and try again.',
      });
    }
  };

  if (status.kind === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-muted">Confirming your payment with Stripe…</p>
      </div>
    );
  }

  if (status.kind === 'paid') {
    const { reference, email, amount } = status.result;
    return (
      <div className="flex flex-col items-center px-2 py-6 text-center" role="status" aria-live="polite">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h3 className="mt-6 font-serif text-3xl text-heading">Your place is reserved.</h3>
        <p className="mt-3 max-w-sm leading-relaxed text-muted">
          Thank you. {amount != null && <>We&rsquo;ve received your {formatFee(amount)} reservation fee. </>}
          We&rsquo;ll be in touch{email ? <> at {email}</> : null} with delivery updates before the first edition ships.
        </p>
        {reference && (
          <p className="mt-6 rounded-xl border border-line bg-glass-strong px-4 py-2.5 text-sm text-ink">
            Reservation reference <span className="ml-1 font-semibold tracking-wider text-primary">{reference}</span>
          </p>
        )}
      </div>
    );
  }

  const submitting = status.kind === 'submitting';
  const lines = feeLines(data.buyerType, data.quantity);
  const fee = feeTotal(lines);
  const business = data.buyerType === 'business';
  const range = quantityRange(data.buyerType);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby={id('buyer-label')}>
        <span id={id('buyer-label')} className="text-sm font-medium text-heading">
          Reserving as
        </span>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-glass-strong p-1.5">
          {BUYER_TYPES.map((b) => {
            const Icon = b.value === 'business' ? Building2 : User;
            const on = data.buyerType === b.value;
            return (
              <label
                key={b.value}
                className={cn(
                  'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                  on ? 'bg-primary font-medium text-on-primary shadow-sm' : 'text-ink hover:bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  name="buyerType"
                  value={b.value}
                  checked={on}
                  onChange={() => setBuyerType(b.value)}
                  className="sr-only"
                />
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {b.label}
              </label>
            );
          })}
        </div>
      </div>

      <fieldset className="min-w-0">
        <SectionTitle step={1}>{business ? 'Organisation & contact' : 'Your details'}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {business && (
            <>
              <Field id={id('organisation')} label="Organisation name" error={errors.organisation}>
                <input
                  {...bind('organisation')}
                  type="text"
                  autoComplete="organization"
                  value={data.organisation}
                  onChange={(e) => set('organisation', e.target.value)}
                  className={inputClass(!!errors.organisation)}
                />
              </Field>
              <Field id={id('gstin')} label="GSTIN" optional error={errors.gstin} hint="For a GST invoice">
                <input
                  {...bind('gstin')}
                  type="text"
                  autoCapitalize="characters"
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  value={data.gstin}
                  onChange={(e) => set('gstin', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className={cn(inputClass(!!errors.gstin), 'uppercase placeholder:normal-case')}
                />
              </Field>
            </>
          )}
          <Field id={id('fullName')} label={business ? 'Contact person' : 'Full name'} error={errors.fullName} className="sm:col-span-2">
            <input
              {...bind('fullName')}
              type="text"
              autoComplete="name"
              value={data.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className={inputClass(!!errors.fullName)}
            />
          </Field>
          <Field id={id('phone')} label="Mobile number" error={errors.phone}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[0.95rem] text-muted">
                +91
              </span>
              <input
                {...bind('phone')}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={14}
                placeholder="98765 43210"
                value={data.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={cn(inputClass(!!errors.phone), 'pl-13')}
              />
            </div>
          </Field>
          <Field id={id('email')} label="Email" error={errors.email}>
            <input
              {...bind('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
              className={inputClass(!!errors.email)}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <SectionTitle step={2}>{business ? 'Delivery address (organisation)' : 'Delivery address'}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id('addressLine1')} label="Flat / house no., building" error={errors.addressLine1} className="sm:col-span-2">
            <input
              {...bind('addressLine1')}
              type="text"
              autoComplete="address-line1"
              value={data.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
              className={inputClass(!!errors.addressLine1)}
            />
          </Field>
          <Field id={id('addressLine2')} label="Street, area or locality" error={errors.addressLine2} className="sm:col-span-2">
            <input
              {...bind('addressLine2')}
              type="text"
              autoComplete="address-line2"
              value={data.addressLine2}
              onChange={(e) => set('addressLine2', e.target.value)}
              className={inputClass(!!errors.addressLine2)}
            />
          </Field>
          <Field id={id('pincode')} label="Pincode" error={errors.pincode}>
            <input
              {...bind('pincode')}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={data.pincode}
              onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
              className={inputClass(!!errors.pincode)}
            />
          </Field>
          <Field id={id('city')} label="City / town" error={errors.city}>
            <input
              {...bind('city')}
              type="text"
              autoComplete="address-level2"
              value={data.city}
              onChange={(e) => set('city', e.target.value)}
              className={inputClass(!!errors.city)}
            />
          </Field>
          <Field id={id('state')} label="State" error={errors.state} className="sm:col-span-2">
            <div className="relative">
              <select
                {...bind('state')}
                autoComplete="address-level1"
                value={data.state}
                onChange={(e) => set('state', e.target.value)}
                className={cn(inputClass(!!errors.state), 'appearance-none pr-10', !data.state && 'text-subtle')}
              >
                <option value="" disabled>
                  Choose your state
                </option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} className="text-ink">
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            </div>
          </Field>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <SectionTitle step={3}>Your Svaraa</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {!business && (
          <div className="flex flex-col gap-1.5 sm:col-span-2" role="radiogroup" aria-labelledby={id('wearer-label')}>
            <span id={id('wearer-label')} className="text-sm font-medium text-heading">
              Who will wear it?
            </span>
            <div className="grid grid-cols-3 gap-2">
              {WEARERS.map((w) => (
                <label
                  key={w.value}
                  className={cn(
                    'flex h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                    data.wearer === w.value
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-line bg-glass-strong text-ink hover:border-primary/40',
                  )}
                >
                  <input
                    type="radio"
                    name="wearer"
                    value={w.value}
                    checked={data.wearer === w.value}
                    onChange={() => set('wearer', w.value)}
                    className="sr-only"
                  />
                  {w.label}
                </label>
              ))}
            </div>
          </div>
          )}
          <Field
            id={id('quantity')}
            label="Quantity"
            error={errors.quantity}
            hint={business ? `${range.min} to ${range.max} pendants per business order` : `Up to ${range.max} per household`}
            className="sm:col-span-2"
          >
            <div className="relative">
              <select
                id={id('quantity')}
                name="quantity"
                aria-describedby={errors.quantity ? `${id('quantity')}-error` : `${id('quantity')}-hint`}
                value={data.quantity}
                onChange={(e) => set('quantity', Number(e.target.value))}
                className={cn(inputClass(), 'appearance-none pr-10')}
              >
                {Array.from({ length: range.max - range.min + 1 }, (_, i) => range.min + i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            </div>
          </Field>
          {business && (
            <p className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm leading-relaxed text-ink sm:col-span-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>
                Need more than {BUSINESS_MAX_QUANTITY}? Please{' '}
                <a
                  href={`mailto:${BUSINESS_CONTACT_EMAIL}?subject=${encodeURIComponent('Svaraa bulk order enquiry')}`}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  contact us at {BUSINESS_CONTACT_EMAIL}
                </a>{' '}
                first, and we&rsquo;ll arrange your order directly.
              </span>
            </p>
          )}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
          <input
            {...bind('consent')}
            type="checkbox"
            checked={data.consent}
            onChange={(e) => set('consent', e.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-[var(--c-primary)]"
          />
          I agree that Svaraa may contact me by phone, email or WhatsApp about this reservation and its delivery.
        </label>
        {errors.consent && (
          <p id={`${id('consent')}-error`} className="ml-8 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {errors.consent}
          </p>
        )}
      </div>

      {status.kind === 'cancelled' && (
        <p role="status" className="flex items-start gap-2.5 rounded-xl border border-line bg-glass-strong px-4 py-3 text-sm text-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Payment cancelled, so nothing was charged. Your details are still here whenever you&rsquo;re ready.
        </p>
      )}

      {status.kind === 'error' && (
        <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {status.message}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <dl className="rounded-xl border border-line bg-glass-strong px-4 py-3 text-sm">
          {lines.length > 1 &&
            lines.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-1">
                <dt className="text-muted">
                  {l.label}
                  {l.quantity > 1 && ` · ${l.quantity} × ${formatFee(l.unitUsd)}`}
                </dt>
                <dd className="text-ink tabular-nums">{formatFee(l.unitUsd * l.quantity)}</dd>
              </div>
            ))}
          <div className={cn('flex items-center justify-between', lines.length > 1 && 'mt-1.5 border-t border-line pt-2.5')}>
            <dt className={lines.length > 1 ? 'font-medium text-heading' : 'text-muted'}>
              {lines.length > 1
                ? 'Total today'
                : `${lines[0]!.label}${lines[0]!.quantity > 1 ? ` · ${lines[0]!.quantity} × ${formatFee(lines[0]!.unitUsd)}` : ''}`}
            </dt>
            <dd className="font-serif text-xl text-heading tabular-nums">{formatFee(fee)}</dd>
          </div>
        </dl>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-14 items-center justify-center gap-2.5 rounded-xl bg-primary px-7 text-[1.05rem] font-medium text-on-primary shadow-[0_14px_30px_-16px_var(--c-primary)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Opening secure payment…
            </>
          ) : (
            <>
              Reserve for {formatFee(fee)}
              <ArrowRight className="size-5" aria-hidden="true" />
            </>
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-subtle">
          <Lock className="size-3.5" aria-hidden="true" />
          Secure payment by Stripe. Your details are used only for your reservation.
        </p>
      </div>
    </form>
  );
}
