/**
 * Customer accounts: email + password, run by Supabase Auth. Only the public (anon /
 * publishable) key is used here; the backend checks the user's access token itself.
 * This file is only imported by the lazily loaded account pages, so the Supabase
 * library stays out of the home page's bundle.
 */
import { useEffect, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
      })
    : null;

export { ACCOUNT_PATHS } from './accountPaths';

/** Shortest password accepted at sign-up and reset (Supabase's own minimum is 6). */
export const MIN_PASSWORD = 8;

/** Absolute link back to a page on this site, for the links Supabase emails. */
export const siteUrl = (path: string) => `${window.location.origin}${path}`;

export type SessionState =
  | { status: 'loading'; session: null }
  | { status: 'signedOut'; session: null }
  | { status: 'signedIn'; session: Session };

/** The current login, kept up to date as the user signs in, out, or their token refreshes. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(
    supabase ? { status: 'loading', session: null } : { status: 'signedOut', session: null },
  );

  useEffect(() => {
    if (!supabase) return;
    const apply = (session: Session | null) =>
      setState(session ? { status: 'signedIn', session } : { status: 'signedOut', session: null });
    let active = true;
    void supabase.auth.getSession().then(({ data }) => active && apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Turns Supabase's error messages into friendlier ones. */
export function authErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  const msg = error?.message ?? '';
  if (/invalid login credentials/i.test(msg)) return 'That email and password don’t match. Please try again.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first: open the link we sent you.';
  if (/already registered|already exists/i.test(msg)) return 'An account with this email already exists. Try logging in.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/password/i.test(msg) && /(characters|short|weak)/i.test(msg)) return 'Please choose a stronger password (at least 8 characters).';
  if (/same password|different from the old/i.test(msg)) return 'Please choose a password different from your current one.';
  if (/network|fetch/i.test(msg)) return 'We couldn’t reach the server. Check your connection and try again.';
  return msg || 'Something went wrong. Please try again.';
}
