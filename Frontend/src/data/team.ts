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
    name: 'Vishwajeet',
    role: 'Co-Founder & CTO',
    // location: 'USA',
    bio: 'Columbia Business School alumnus with experience at Groww, LVMH, and Times of India Group’s venture capital division. Brings expertise in technology, product management, and venture capital.',
  },
  {
    id: 'sandhya',
    photo: 'sandhya.webp',
    name: 'Sandhya',
    role: 'Co-Founder & CPO',
    // location: 'USA',
    bio: 'MCA-qualified technology professional with 15+ years of experience in software services, product development, and project management, overseeing Svaraa’s product execution and delivery.',
  },
  {
    id: 'varun',
    photo: 'varun.webp',
    name: 'Varun',
    role: 'Director, New Ventures',
    bio: 'Strategist in finance and former software engineer, with projects at Google and Goldman Sachs. Deep background in algorithms, AI/machine learning and data mining, sharpened from the Math and Informatics Olympiads and RSI onwards.',
  },
  {
    id: 'simone',
    photo: 'simone.webp',
    name: 'Simone',
    role: 'Head Digital Marketing',
    bio: 'Brand and marketing strategist with 7+ years of experience across technology, startups, and consumer brands. Specializes in brand positioning, go-to-market strategy, and customer acquisition.',
  },
  {
    id: 'pragati',
    photo: 'pragati.webp',
    name: 'Pragati',
    role: 'Lead AI Engineering Manager',
    bio: 'IIT Kharagpur postgraduate with 4+ years of experience in AI/ML, intelligent automation, and scalable technology solutions, specializing in AI-driven product development.',
  },
  {
    id: 'priyanshu',
    photo: 'priyanshu.webp',
    name: 'Priyanshu',
    role: 'Senior AI Developer',
    bio: 'Software developer with experience at WorldQuant. Brings deep expertise in software development and AI engineering, turning ideas into the intelligent systems that power Svaraa.',
  },
  {
    id: 'kannan',
    photo: 'kannan.webp',
    name: 'Kannan',
    role: 'Director, B2B Partnerships',
    bio: 'Financial services veteran with extensive experience at Citibank and leading NBFCs. Spearheads Svaraa’s B2B partnerships and India distribution network.',
  },
  {
    id: 'ravi',
    photo: 'ravi.webp',
    name: 'Ravi',
    role: 'Hardware Advisor',
    bio: 'Director at Marsin Technologies with 20+ years of hardware manufacturing experience, specializing in OEM production, wearables, and strategic component sourcing from China.',
  },
  {
    id: 'suresh',
    photo: 'suresh.webp',
    name: 'Suresh Rangarajan',
    role: 'Investor & Advisor',
    bio: 'Serial entrepreneur with 30+ years of leadership. Yale Executive MBA valedictorian, former Citibank VP, and Founder & CEO of Colive. Former CEO of TimesofMoney.',
  },
];
