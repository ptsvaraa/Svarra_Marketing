export type SvaraaId =
  | 'recite'
  | 'respond'
  | 'remind'
  | 'rescue'
  | 'recall'
  | 'repository'
  | 'riddle';

type Four<T> = readonly [T, T, T, T];

export interface Svaraa {
  id: SvaraaId;
  label: string;
  /** Display ordinal, e.g. "01". */
  ordinal: string;
  headline: { lead: string; accent?: string };
  subheadline: string;
  image: {
    /** Basename under /public/images, served as `<name>-800.webp` and `<name>-1448.webp`. */
    name: string;
    alt: string;
    /** CSS object-position used when the banner crops the 4:3 photo. */
    focal: string;
    caption: string;
  };
  simulation: {
    eyebrow?: string;
    startLabel: string;
    estimate?: string;
    headerBadge?: string;
    footnote?: string;
  };
  checklist: Four<string>;
  steps: Four<string>;
  /**
   * How long each beat of the scripted demo lasts, in ms. The demo is complete
   * once the last beat elapses.
   */
  beatDurations: readonly number[];
  /** Which tracker step is active during each beat. Same length as `beatDurations`. */
  trackerByBeat: readonly number[];
  /** What Svaraa says aloud when a beat starts (when audio is on). */
  voiceLines: Readonly<Partial<Record<number, string>>>;
}

export const SVARAAS: readonly Svaraa[] = [
  {
    id: 'recite',
    label: 'Recite',
    ordinal: '01',
    headline: { lead: 'A little calm, ', accent: 'on cue.' },
    subheadline: 'Prayer, recitation and ambient sound, guided by voice.',
    image: {
      name: 'recite',
      alt: 'An older couple meditating side by side on floor cushions at home, each wearing a Svaraa pendant.',
      focal: '50% 28%',
      caption: 'Morning prayer, started with a single sentence.',
    },
    simulation: { startLabel: 'Start demo' },
    checklist: [
      'Voice-triggered playback',
      'Language & prayer preferences',
      'Daily listening routines',
      'Pendant speaker control',
    ],
    steps: ['Request heard', 'Prayer selected', 'Playing', 'Routine saved'],
    beatDurations: [1800, 2400, 6500, 2800],
    trackerByBeat: [0, 1, 2, 3],
    voiceLines: {
      1: "Of course, Amma. Let's begin with a quiet moment.",
      3: "I've saved this as your morning routine. Your evening prayer is at six thirty.",
    },
  },
  {
    id: 'respond',
    label: 'Respond',
    ordinal: '02',
    headline: { lead: 'A familiar voice. ', accent: 'A helpful response.' },
    subheadline: 'Natural conversations that turn everyday requests into thoughtful support.',
    image: {
      name: 'respond',
      alt: 'An older couple chatting during a walk through a leafy park, the woman touching her Svaraa pendant.',
      focal: '50% 26%',
      caption: 'Ask in passing. Svaraa takes care of the details.',
    },
    simulation: { startLabel: 'Start demo' },
    checklist: [
      'Natural voice conversation',
      'Context-aware responses',
      'Proposed actions',
      'Confirmation before changes',
    ],
    steps: ['Listening', 'Understanding', 'Confirming', 'Added to today'],
    beatDurations: [1800, 2800, 5200, 2800],
    trackerByBeat: [0, 1, 2, 3],
    voiceLines: {
      1: 'Shall I add a reminder for 9 a.m.?',
      3: "Done. I'll remind you to call Priya.",
    },
  },
  {
    id: 'remind',
    label: 'Remind',
    ordinal: '03',
    headline: { lead: 'Gentle reminders. ', accent: 'Everyday reassurance.' },
    subheadline: 'Medicine, water and daily routines, without another screen to manage.',
    image: {
      name: 'remind',
      alt: 'An older couple at the breakfast table taking their medicine with glasses of water, a pill organiser beside them.',
      focal: '50% 30%',
      caption: 'Spoken reminders, at the moments that matter.',
    },
    simulation: { startLabel: 'Start demo' },
    checklist: [
      'Spoken reminders',
      'Taken or snoozed confirmation',
      'Important reminder follow-up',
      'Family visibility',
    ],
    steps: ['Scheduled', 'Spoken', 'Acknowledged', 'Family updated'],
    beatDurations: [2000, 4200, 2600, 2800],
    trackerByBeat: [0, 1, 2, 3],
    voiceLines: {
      1: "Amma, it's time for your scheduled medicine. Have some water, too.",
      2: 'Thank you, Amma. I have noted it.',
    },
  },
  {
    id: 'rescue',
    label: 'Rescue',
    ordinal: '04',
    headline: { lead: 'Help, brought closer.' },
    subheadline: 'An SOS connects the wearer to their trusted circle of care.',
    image: {
      name: 'rescue',
      alt: 'A woman kneels beside an older woman seated on a bathroom floor after a fall, reassuring her.',
      focal: '50% 30%',
      caption: 'When every second counts, the right people know.',
    },
    simulation: {
      eyebrow: 'SOS drill · Simulation only',
      startLabel: 'Start drill',
      footnote: 'Simulation only. No alerts are sent. V1 does not call emergency services.',
    },
    checklist: [
      'Fall check-in & countdown',
      'Care-circle escalation',
      'Contact acknowledgement',
      'Incident resolution',
    ],
    steps: ['Check-in', 'Care circle alerted', 'Acknowledged', 'Resolved'],
    beatDurations: [5000, 2800, 3600, 2800],
    trackerByBeat: [0, 1, 2, 3],
    voiceLines: {
      0: "Amma, are you okay? I'll alert your care circle in a few seconds.",
      1: "I've alerted your care circle.",
      2: 'Priya has acknowledged. Lakshmi is on the way.',
      3: "Glad you're safe, Amma. I've let everyone know.",
    },
  },
  {
    id: 'recall',
    label: 'Recall',
    ordinal: '05',
    headline: { lead: 'A little clarity for the day ahead.' },
    subheadline: "A calm news briefing, today's plans and helpful follow-through.",
    image: {
      name: 'recall',
      alt: 'An older couple smiling over a notebook of plans at the breakfast table, a newspaper beside them.',
      focal: '50% 30%',
      caption: 'The day, gently laid out over morning tea.',
    },
    simulation: { startLabel: 'Start demo', estimate: '~2 minutes', headerBadge: 'Calm mode on' },
    checklist: [
      'Voice-led morning briefing',
      'Calm mode & language preferences',
      "Today's plan at a glance",
      'Tasks confirmed by the family',
    ],
    steps: ['Briefing prepared', 'News playing', 'Plans reviewed', 'Tasks confirmed'],
    beatDurations: [1800, 5600, 2800, 5200, 2600],
    trackerByBeat: [0, 1, 2, 3, 3],
    voiceLines: {
      1: 'Your morning briefing is ready. Shall we go through your plans?',
      2: 'Today you have a call with Priya at nine, a garden walk at eleven, and a family catch-up at five.',
      3: 'Shall I add picking up the scan report from Doctor Menon’s clinic?',
    },
  },
  {
    id: 'repository',
    label: 'Repository',
    ordinal: '06',
    headline: { lead: 'Keep the moments ', accent: 'that matter.' },
    subheadline: 'Conversation notes and personal stories, organised with permission.',
    image: {
      name: 'repo',
      alt: 'An older couple share old photographs and stories with their daughter around the dining table.',
      focal: '50% 28%',
      caption: 'Family stories, kept with care and consent.',
    },
    simulation: { startLabel: 'Start demo' },
    checklist: [
      'Consent before recording',
      'Session summaries & takeaways',
      'Review before saving',
      'Controlled family sharing',
    ],
    steps: ['Consent confirmed', 'Captured', 'Reviewing', 'Saved'],
    beatDurations: [1800, 2800, 4400, 5200, 2600],
    trackerByBeat: [0, 0, 1, 2, 3],
    voiceLines: {
      1: "With your permission, I'll keep the story and its key moments.",
      3: "Here's a short summary. Would you like to save it?",
      4: 'Saved to your repository.',
    },
  },
  {
    id: 'riddle',
    label: 'Riddle',
    ordinal: '07',
    headline: { lead: 'A little movement. ', accent: 'A little wonder.' },
    subheadline: 'Gentle yoga and cognitive play, at a comfortable pace.',
    image: {
      name: 'riddle',
      alt: 'An older man does a seated arm stretch while an older woman works on a colourful tangram puzzle.',
      focal: '50% 22%',
      caption: 'Stretch, puzzle, breathe. At their own pace.',
    },
    simulation: { startLabel: 'Start demo', footnote: "Move only as comfortable. There's no rush." },
    checklist: [
      'Guided gentle movement',
      'Simple cognitive activities',
      'Encouragement without pressure',
      'A routine at their own pace',
    ],
    steps: ['Gentle stretch', 'Cognitive play', 'Breathing', 'Complete'],
    beatDurations: [3400, 6500, 2600, 4600, 2600],
    trackerByBeat: [0, 1, 1, 2, 3],
    voiceLines: {
      0: "Let's begin with a gentle seated stretch. Raise your arms slowly, and breathe.",
      1: 'Well done. Now, shall we give your mind a little puzzle? What comes next: two, four, six?',
      3: "Lovely. Let's take a quiet breathing moment.",
      4: 'That was a wonderful session, Amma.',
    },
  },
];

export const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-IN', label: 'English (India)' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['value'];
