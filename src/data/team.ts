/**
 * People shown in "Meet the team", in display order.
 *
 * Photos: put a square image (at least 400×400) in /public/team/, e.g.
 * /public/team/jeet.webp, and set `photo: 'jeet.webp'`. Without a photo, a
 * placeholder avatar is shown.
 */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** Shown after the role, e.g. "USA". */
  location?: string;
  bio: string;
  /** File name in /public/team/. */
  photo?: string;
}

export const TEAM: readonly TeamMember[] = [
  {
    id: 'jeet',
    photo: 'jeet.webp',
    name: 'Jeet',
    role: 'CEO',
    location: 'USA',
    bio: 'Columbia Business School alumnus with experience at Groww, LVMH, and Times of India Group’s venture capital division. Brings expertise in technology, product management, and venture capital.',
  },
  {
    id: 'sandhya',
    photo: 'sandhya.webp',
    name: 'Sandhya',
    role: 'CTO',
    location: 'USA',
    bio: 'MCA-qualified technology professional with 15+ years of experience in software services, product development, and project management, overseeing Svaraa’s product execution and delivery.',
  },
  {
    id: 'kannan',
    photo: 'kannan.webp',
    name: 'Kannan',
    role: 'Sales & Distribution Mentor',
    bio: 'Financial services veteran with extensive experience at Citibank and leading NBFCs. Spearheads Svaraa’s B2B partnerships and India distribution network.',
  },
  {
    id: 'ravi',
    photo: 'ravi.webp',
    name: 'Ravi',
    role: 'Hardware Mentor',
    bio: 'Director at Marsin Technologies with 20+ years of hardware manufacturing experience, specializing in OEM production, wearables, and strategic component sourcing from China.',
  },
  {
    id: 'suresh',
    photo: 'suresh.webp',
    name: 'Suresh Rangarajan',
    role: 'Investor',
    bio: 'Serial entrepreneur with 30+ years of leadership. Yale Executive MBA valedictorian, former Citibank VP, and Founder & CEO of Colive. Former CEO of TimesofMoney.',
  },
];
