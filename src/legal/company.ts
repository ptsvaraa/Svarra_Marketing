/**
 * Details used across the legal pages. Anything in [square brackets] is a
 * placeholder to fill in before launch, and every page shows a "draft" notice
 * until LEGAL_IS_DRAFT is set to false.
 *
 * These documents are drafts written for how this website works today. Have
 * them reviewed by a qualified lawyer before relying on them.
 */
export const LEGAL_IS_DRAFT = true;

export const COMPANY = {
  brand: 'Svaraa',
  legalName: '[Registered company name, e.g. Svaraa Technologies Private Limited]',
  cin: '[Corporate Identification Number]',
  address: '[Registered office address, city, state, PIN]',
  website: 'svaraa.ai',
  privacyEmail: '[privacy@svaraa.ai]',
  supportEmail: '[support@svaraa.ai]',
  grievanceOfficer: '[Name of Grievance Officer]',
  grievanceEmail: '[grievance@svaraa.ai]',
  jurisdictionCity: '[City]',
} as const;

/** Date each document last changed, shown at the top. Update when you edit one. */
export const LAST_UPDATED = '30 October 2026';

export const LEGAL_PATHS = {
  privacy: '/privacy-policy',
  terms: '/terms',
  cookies: '/cookie-policy',
} as const;
