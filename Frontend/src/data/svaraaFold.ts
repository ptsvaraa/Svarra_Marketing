/** Which procedural model the fold viewer shows for a view. */
export type FoldModel = 'svaraa' | 'puck' | 'cable';

/** Named layers of the fold-over pendant, used to highlight (and optionally fade around) a part. */
export type FoldLayer =
  | 'housing'
  | 'face'
  | 'button'
  | 'rhousing'
  | 'pad'
  | 'frame'
  | 'battery'
  | 'motor'
  | 'pcb'
  | 'speaker'
  | 'magnets'
  | 'bridge';

/** Looping feature animation. Views use `press` and `buzz`; `shake` is supported but unused. */
export type FoldAnim = 'press' | 'buzz' | 'shake';

export type FoldViewId =
  | 'pendant'
  | 'puck'
  | 'cable'
  | 'sos'
  | 'reminders'
  | 'record'
  | 'vibe'
  | 'find'
  | 'privacy';

export interface FoldView {
  id: FoldViewId;
  /** Viewer title. */
  label: string;
  /** Viewer subtitle. */
  description: string;
  model: FoldModel;
  /** Default explode amount, 0 (closed) to 1 (fully apart). */
  explode: number;
  /** Default fold amount, 0 (flat) to 1 (folded over). */
  fold: number;
  /** Camera elevation in radians. */
  phi: number;
  /** Turntable angle in radians. */
  spin: number;
  /** Layers that glow; null means none. */
  focus: readonly FoldLayer[] | null;
  /** Fade layers outside `focus` (not set by any view). */
  fade?: boolean;
  /** Stand the pendant upright (worn view). */
  upright: boolean;
  /** Show the gold braided cord once the pendant is folded. */
  cord: boolean;
  anim: FoldAnim | null;
}

const view = (id: FoldViewId, label: string, description: string, o: Partial<FoldView> = {}): FoldView => ({
  id,
  label,
  description,
  model: 'svaraa',
  explode: 0,
  fold: 0,
  phi: 0.45,
  spin: 0.35,
  focus: null,
  upright: false,
  cord: false,
  anim: null,
  ...o,
});

export const FOLD_VIEWS: readonly FoldView[] = [
  view('pendant', 'Svaraa Fold', 'The fold-over pendant folded on itself and worn on its gold braided cord.', {
    fold: 1,
    upright: true,
    cord: true,
    phi: 0.1,
    spin: -0.35,
  }),
  view('puck', 'Magnetic charging puck', 'Low-profile charging cradle with alignment magnets.', {
    model: 'puck',
    spin: -0.4,
    phi: 0.55,
  }),
  view('cable', 'USB-C cable', 'Durable braided cable to power charging puck (USB-C only powers the accessory).', {
    model: 'cable',
    spin: -0.5,
    phi: 0.62,
  }),
  view('sos', 'Hold for SOS', 'Hold the flush button for SOS. SOS delivery requires paired phone connectivity.', {
    focus: ['button'],
    anim: 'press',
    phi: 0.75,
    spin: 0,
  }),
  view('reminders', 'Offline reminders', 'Offline reminders', { focus: ['face'], anim: 'buzz', phi: 0.6, spin: 0 }),
  view('record', 'One-press recording', 'One-press recording · Transcription on phone/cloud', {
    focus: ['button'],
    anim: 'press',
    phi: 0.75,
    spin: 0,
  }),
  view('vibe', 'Vibration feedback', 'Vibration feedback', { anim: 'buzz', phi: 0.5, spin: 0.3 }),
  view('find', 'Find my pendant', 'Find my pendant', { focus: ['face'], anim: 'buzz', phi: 0.6, spin: 0 }),
  view('privacy', 'Mic privacy', 'Mic privacy', { focus: ['face'], phi: 0.6, spin: 0 }),
];

/** View shown when nothing is selected. */
export const FOLD_DEFAULT_VIEW: FoldViewId = 'pendant';

export const foldViewById = (id: string): FoldView => FOLD_VIEWS.find((v) => v.id === id) ?? FOLD_VIEWS[0]!;

/** One element of a 24x24 stroked line icon (stroke=currentColor, width 1.7, round caps/joins, no fill). */
export type FoldIconShape =
  | { type: 'path'; d: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx: number }
  | { type: 'circle'; cx: number; cy: number; r: number };

export interface FoldFeatureIcon {
  id: Extract<FoldViewId, 'sos' | 'reminders' | 'record' | 'vibe' | 'find' | 'privacy'>;
  /** Label split over two lines, as in the design. */
  lines: readonly [string, string];
  /** One or two sentences for the feature card. */
  brief: string;
  /** Small print under the brief, if any. */
  note?: string;
  shapes: readonly FoldIconShape[];
}

/** Feature-icon row, in display order. */
export const FOLD_FEATURE_ICONS: readonly FoldFeatureIcon[] = [
  {
    id: 'sos',
    lines: ['Hold for', 'SOS'],
    brief: 'Hold the gold button and Svaraa alerts family contacts in turn, sharing your location, until someone responds “I’m on it.”',
    note: 'SOS delivery requires paired phone connectivity.',
    shapes: [{ type: 'path', d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }],
  },
  {
    id: 'reminders',
    lines: ['Offline', 'reminders'],
    brief: 'Spoken reminders for medicines, prayers and appointments keep working even when the phone is out of range.',
    shapes: [
      { type: 'rect', x: 6, y: 3, width: 12, height: 18, rx: 2 },
      { type: 'path', d: 'M9 8h6M9 12h6M9 16h4' },
    ],
  },
  {
    id: 'record',
    lines: ['One-press', 'recording'],
    brief: 'One press captures a thought, a symptom or the doctor’s advice, so nothing important is forgotten.',
    note: 'Asks for consent first. Transcription on phone or cloud.',
    shapes: [
      { type: 'rect', x: 9, y: 3, width: 6, height: 11, rx: 3 },
      { type: 'path', d: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6' },
    ],
  },
  {
    id: 'vibe',
    lines: ['Vibration', 'feedback'],
    brief: 'A gentle buzz confirms every press and nudges at reminder time, felt even when it’s too noisy to hear.',
    shapes: [
      { type: 'path', d: 'M8 6.5c-2 3.5-2 7.5 0 11M5 4.5c-3 4.5-3 10.5 0 15M16 6.5c2 3.5 2 7.5 0 11M19 4.5c3 4.5 3 10.5 0 15' },
      { type: 'circle', cx: 12, cy: 12, r: 1.4 },
    ],
  },
  {
    id: 'find',
    lines: ['Find my', 'pendant'],
    brief: 'Misplaced it under a cushion? Make the pendant light up and buzz from the paired phone, and follow it home.',
    shapes: [
      { type: 'path', d: 'M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11z' },
      { type: 'circle', cx: 12, cy: 10, r: 2.2 },
    ],
  },
  {
    id: 'privacy',
    lines: ['Mic', 'privacy'],
    brief: 'Svaraa listens only when you choose. Turn the microphone off any time; your data is encrypted and never sold.',
    shapes: [
      { type: 'rect', x: 9, y: 3, width: 6, height: 11, rx: 3 },
      { type: 'path', d: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6M4 4l16 16' },
    ],
  },
];
