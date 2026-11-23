import { useId, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { AccountsUnavailable, AuthCard, Notice, usePageTitle } from '../components/account/AccountShell';
import { PasswordInput } from '../components/account/PasswordInput';
import { ACCOUNT_PATHS, authErrorMessage, MIN_PASSWORD, supabase, useSession } from '../lib/auth';

/** An expired or already-used email link comes back with the error in the address. */
function linkError(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
  return params.get('error_description') ?? params.get('error');
}

/**
 * Where the "reset your password" email lands. Supabase signs the user in from the link
 * (the token in the address), and they choose a new password here.
 */
export default function ResetPasswordPage() {
  usePageTitle('Choose a new password');
  const session = useSession();
  const uid = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badLink] = useState(linkError);

  if (!supabase) return <AccountsUnavailable />;
  const auth = supabase.auth;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const e: Record<string, string> = {};
    if (password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) e.confirm = 'The two passwords don’t match.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setError(null);
    const { error: err } = await auth.updateUser({ password });
    setBusy(false);
    if (err) setError(authErrorMessage(err));
    else window.location.replace(`${ACCOUNT_PATHS.account}?password=updated`);
  };

  const intro = 'Pick a new password for your Svaraa account.';

  if (session.status === 'loading') {
    return (
      <AuthCard eyebrow="Your account" title="Choose a new password" intro={intro}>
        <p className="flex items-center gap-2 text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Checking your link…
        </p>
      </AuthCard>
    );
  }

  if (session.status === 'signedOut') {
    return (
      <AuthCard eyebrow="Your account" title="This link has expired" intro="Password reset links work once and only for a short while.">
        <div className="space-y-5">
          <Notice tone="error">{badLink ?? 'We couldn’t verify this reset link.'} Please ask for a new one.</Notice>
          <a href={`${ACCOUNT_PATHS.login}?mode=forgot`} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 font-medium text-on-primary transition-colors hover:bg-primary-hover">
            Send a new link
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Your account" title="Choose a new password" intro={intro}>
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        {error && <Notice tone="error">{error}</Notice>}
        <p className="text-sm text-muted">
          For <span className="font-medium text-ink">{session.session.user.email}</span>
        </p>
        <Field id={`${uid}-password`} label="New password" error={errors.password} hint={`At least ${MIN_PASSWORD} characters.`}>
          <PasswordInput id={`${uid}-password`} value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} hasHint />
        </Field>
        <Field id={`${uid}-confirm`} label="Confirm new password" error={errors.confirm}>
          <PasswordInput id={`${uid}-confirm`} value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save new password
        </Button>
      </form>
    </AuthCard>
  );
}
