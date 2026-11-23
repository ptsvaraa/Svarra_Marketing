/** Account page addresses. Kept apart from lib/auth so importing them doesn't load Supabase. */
export const ACCOUNT_PATHS = {
  login: '/login',
  account: '/account',
  resetPassword: '/reset-password',
} as const;
