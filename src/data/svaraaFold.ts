/** Which procedural model the fold viewer shows for a view. */
export type FoldModel = 'svaraa' | 'puck' | 'cable';

/** Named layers of the fold-over pendant, used to highlight (and optionally fade around) a part. */
export type FoldLayer =
  | 'housing'
  | 'usb'
  | 'switch'
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

/**
 * Looping feature animation. The source items use `press`, `buzz` and `slide`;
 * `foldloop` and `shake` are supported by the scene but no view uses them.
 */
export type FoldAnim = 'press' | 'buzz' | 'slide' | 'foldloop' | 'shake';

/** Where a view is picked from: one of the three photos, or the feature-icon row. */
export type FoldPhoto = 'hero' | 'flat' | 'kit';
export type FoldSource = FoldPhoto | 'icon';

/** Hotspot as [left, top, width, height] in percent of its photo. */
export type FoldHotspot = readonly [number, number, number, number];

export type FoldViewId =
  | 'worn'
  | 'flat'
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
  /** Photo the hotspots sit on, or 'icon' for feature-icon views. */
  source: FoldSource;
  /** Hotspots on `source` (percent boxes); null for icon views. */
  hotspots: readonly FoldHotspot[] | null;
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
  /** Fade layers outside `focus` (not set by any source view). */
  fade?: boolean;
  /** Stand the pendant upright (worn view). */
  upright: boolean;
  /** Show the braided cord once the pendant is folded. */
  cord: boolean;
  anim: FoldAnim | null;
}

const view = (
  id: FoldViewId,
  label: string,
  description: string,
  source: FoldSource,
  hotspots: readonly FoldHotspot[] | null,
  o: Partial<FoldView> = {},
): FoldView => ({
  id,
  label,
  description,
  source,
  hotspots,
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
  view('worn', 'Svaraa Fold', 'The fold-over pendant folded on itself and worn on its braided cord.', 'hero', [[26, 12, 45, 82]], {
    fold: 1,
    upright: true,
    cord: true,
    phi: 0.1,
    spin: -0.35,
  }),
  view('flat', 'Unfolded', 'Both halves side by side, joined by the flexible bridge.', 'flat', [[3, 6, 94, 88]], { phi: 0.5, spin: 0 }),
  view('puck', 'Magnetic charging puck', 'Low-profile charging cradle with alignment magnets.', 'kit', [[1, 4, 45, 92]], {
    model: 'puck',
    spin: -0.4,
    phi: 0.55,
  }),
  view(
    'cable',
    'USB-C cable',
    'Durable braided cable to power charging puck (USB-C only powers the accessory).',
    'kit',
    [[47, 4, 52, 92]],
    { model: 'cable', spin: -0.5, phi: 0.62 },
  ),
  view('sos', 'Hold for SOS', 'Hold the flush button for SOS. SOS delivery requires paired phone connectivity.', 'icon', null, {
    focus: ['button'],
    anim: 'press',
    phi: 0.75,
    spin: 0,
  }),
  view('reminders', 'Offline reminders', 'Offline reminders', 'icon', null, { focus: ['face'], anim: 'buzz', phi: 0.6, spin: 0 }),
  view('record', 'One-press recording', 'One-press recording · Transcription on phone/cloud', 'icon', null, {
    focus: ['button'],
    anim: 'press',
    phi: 0.75,
    spin: 0,
  }),
  view('vibe', 'Vibration feedback', 'Vibration feedback', 'icon', null, { anim: 'buzz', phi: 0.5, spin: 0.3 }),
  view('find', 'Find my pendant', 'Find my pendant', 'icon', null, { focus: ['face'], anim: 'buzz', phi: 0.6, spin: 0 }),
  view('privacy', 'Mic privacy', 'Physical mic privacy switch on the side of the pendant.', 'icon', null, {
    focus: ['switch'],
    anim: 'slide',
    spin: 0.55,
    phi: 0.3,
  }),
];

/** View shown when nothing is selected. */
export const FOLD_DEFAULT_VIEW: FoldViewId = 'worn';

export const foldViewById = (id: string): FoldView => FOLD_VIEWS.find((v) => v.id === id) ?? FOLD_VIEWS[0]!;

export interface FoldPhotoInfo {
  id: FoldPhoto;
  /** File name in /public/images/. */
  file: string;
  alt: string;
  /** Tile aspect ratio as [width, height]. */
  aspect: readonly [number, number];
}

export const FOLD_PHOTOS: Readonly<Record<FoldPhoto, FoldPhotoInfo>> = {
  hero: { id: 'hero', file: 'fold-worn.webp', alt: 'Svaraa Fold worn on its braided cord', aspect: [700, 380] },
  flat: { id: 'flat', file: 'fold-unfolded.webp', alt: 'Svaraa Fold unfolded', aspect: [306, 152] },
  kit: { id: 'kit', file: 'fold-charging.webp', alt: 'Magnetic charging puck and braided USB-C cable', aspect: [386, 152] },
};

/** One element of a 24x24 stroked line icon (stroke=currentColor, width 1.7, round caps/joins, no fill). */
export type FoldIconShape =
  | { type: 'path'; d: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx: number }
  | { type: 'circle'; cx: number; cy: number; r: number };

export interface FoldFeatureIcon {
  id: Extract<FoldViewId, 'sos' | 'reminders' | 'record' | 'vibe' | 'find' | 'privacy'>;
  /** Label split over two lines, as in the design. */
  lines: readonly [string, string];
  shapes: readonly FoldIconShape[];
}

/** Feature-icon row, in display order. */
export const FOLD_FEATURE_ICONS: readonly FoldFeatureIcon[] = [
  {
    id: 'sos',
    lines: ['Hold for', 'SOS'],
    shapes: [{ type: 'path', d: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }],
  },
  {
    id: 'reminders',
    lines: ['Offline', 'reminders'],
    shapes: [
      { type: 'rect', x: 6, y: 3, width: 12, height: 18, rx: 2 },
      { type: 'path', d: 'M9 8h6M9 12h6M9 16h4' },
    ],
  },
  {
    id: 'record',
    lines: ['One-press', 'recording'],
    shapes: [
      { type: 'rect', x: 9, y: 3, width: 6, height: 11, rx: 3 },
      { type: 'path', d: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6' },
    ],
  },
  {
    id: 'vibe',
    lines: ['Vibration', 'feedback'],
    shapes: [
      { type: 'path', d: 'M8 6.5c-2 3.5-2 7.5 0 11M5 4.5c-3 4.5-3 10.5 0 15M16 6.5c2 3.5 2 7.5 0 11M19 4.5c3 4.5 3 10.5 0 15' },
      { type: 'circle', cx: 12, cy: 12, r: 1.4 },
    ],
  },
  {
    id: 'find',
    lines: ['Find my', 'pendant'],
    shapes: [
      { type: 'path', d: 'M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11z' },
      { type: 'circle', cx: 12, cy: 10, r: 2.2 },
    ],
  },
  {
    id: 'privacy',
    lines: ['Mic', 'privacy'],
    shapes: [
      { type: 'rect', x: 9, y: 3, width: 6, height: 11, rx: 3 },
      { type: 'path', d: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6M4 4l16 16' },
    ],
  },
];
