import { useEffect, useId, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { AccountsUnavailable, AuthCard, Notice, usePageTitle } from '../components/account/AccountShell';
import { PasswordInput } from '../components/account/PasswordInput';
import { ACCOUNT_PATHS, authErrorMessage, MIN_PASSWORD, siteUrl, supabase, useSession } from '../lib/auth';

type Mode = 'signin' | 'signup' | 'forgot';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const COPY: Record<Mode, { title: string; intro: string; submit: string }> = {
  signin: { title: 'Log in', intro: 'See your reservations and keep your details up to date.', submit: 'Log in' },
  signup: {
    title: 'Create your account',
    intro: 'Use the email you reserved with, and your reservations will appear in your profile automatically.',
    submit: 'Create account',
  },
  forgot: { title: 'Reset your password', intro: 'Enter your email and we’ll send you a link to choose a new password.', submit: 'Send reset link' },
};

function initialMode(): Mode {
  const m = new URLSearchParams(window.location.search).get('mode');
  return m === 'signup' || m === 'forgot' ? m : 'signin';
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>(initialMode);
  const copy = COPY[mode];
  usePageTitle(copy.title);
  const session = useSession();

  // Already logged in: straight to the profile.
  useEffect(() => {
    if (session.status === 'signedIn') window.location.replace(ACCOUNT_PATHS.account);
  }, [session.status]);

  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  if (!supabase) return <AccountsUnavailable />;
  const auth = supabase.auth;

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setError(null);
    setSent(null);
    setUnconfirmed(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'signup' && fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
    if (!EMAIL.test(email.trim())) e.email = 'Please enter a valid email address.';
    if (mode !== 'forgot') {
      if (!password) e.password = 'Please enter your password.';
      else if (mode === 'signup' && password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSent(null);
    setUnconfirmed(false);
    if (!validate()) return;
    setBusy(true);
    const address = email.trim().toLowerCase();
    try {
      if (mode === 'signin') {
        const { error: err } = await auth.signInWithPassword({ email: address, password });
        if (err) {
          setUnconfirmed(/email not confirmed/i.test(err.message));
          setError(authErrorMessage(err));
        } else {
          window.location.replace(ACCOUNT_PATHS.account);
        }
      } else if (mode === 'signup') {
        const { data, error: err } = await auth.signUp({
          email: address,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: siteUrl(ACCOUNT_PATHS.account) },
        });
        if (err) setError(authErrorMessage(err));
        // With email confirmation on, Supabase doesn't say outright that an address is taken:
        // an existing account comes back with no identities.
        else if (data.user && data.user.identities?.length === 0) setError(authErrorMessage({ message: 'already registered' }));
        else if (data.session) window.location.replace(ACCOUNT_PATHS.account);
        else setSent(`We’ve sent a confirmation link to ${address}. Open it to finish creating your account.`);
      } else {
        const { error: err } = await auth.resetPasswordForEmail(address, { redirectTo: siteUrl(ACCOUNT_PATHS.resetPassword) });
        if (err) setError(authErrorMessage(err));
        else setSent(`If an account exists for ${address}, a link to reset the password is on its way.`);
      }
    } catch (err) {
      setError(authErrorMessage(err as Error));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    const { error: err } = await auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: siteUrl(ACCOUNT_PATHS.account) },
    });
    setBusy(false);
    setUnconfirmed(false);
    if (err) setError(authErrorMessage(err));
    else {
      setError(null);
      setSent('We’ve sent a new confirmation link. Please check your inbox (and spam folder).');
    }
  };

  const described = (name: string) => (errors[name] ? `${id(name)}-error` : undefined);

  return (
    <AuthCard eyebrow="Your account" title={copy.title} intro={copy.intro}>
      {sent ? (
        <div className="space-y-5">
          <Notice tone="success">{sent}</Notice>
          <Button variant="outline" className="w-full" onClick={() => switchMode('signin')}>
            Back to log in
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          {error && (
            <Notice tone="error">
              {error}
              {unconfirmed && (
                <button type="button" onClick={resend} disabled={busy} className="mt-1 block font-medium text-primary underline underline-offset-2">
                  Send the confirmation link again
                </button>
              )}
            </Notice>
          )}

          {mode === 'signup' && (
            <Field id={id('fullName')} label="Full name" error={errors.fullName}>
              <input
                id={id('fullName')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                aria-describedby={described('fullName')}
                className={inputClass(!!errors.fullName)}
              />
            </Field>
          )}

          <Field id={id('email')} label="Email" error={errors.email}>
            <input
              id={id('email')}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={mode === 'signup' ? 'email' : 'username'}
              aria-invalid={!!errors.email}
              aria-describedby={described('email')}
              className={inputClass(!!errors.email)}
            />
          </Field>

          {mode !== 'forgot' && (
            <Field
              id={id('password')}
              label="Password"
              error={errors.password}
              hint={mode === 'signup' ? `At least ${MIN_PASSWORD} characters.` : undefined}
            >
              <PasswordInput
                id={id('password')}
                value={password}
                onChange={setPassword}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                error={errors.password}
                hasHint={mode === 'signup'}
              />
            </Field>
          )}

          {mode === 'signin' && (
            <div className="-mt-2 text-right">
              <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {copy.submit}
          </Button>

          <p className="text-center text-sm text-muted">
            {mode === 'signin' ? (
              <>
                New to Svaraa?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-medium text-primary hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                {mode === 'signup' ? 'Already have an account? ' : 'Remembered it? '}
                <button type="button" onClick={() => switchMode('signin')} className="font-medium text-primary hover:underline">
                  Log in
                </button>
              </>
            )}
          </p>
        </form>
      )}
    </AuthCard>
  );
}
