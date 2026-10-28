/** Which procedural model the 3D viewer shows for a part. */
export type LiteModel = 'pendant' | 'clip' | 'attach' | 'backplate' | 'wristband' | 'lanyard' | 'puck' | 'cable';

/** Named layers of the exploded pendant, used to highlight one part. */
export type PendantLayer = 'housing' | 'frame' | 'battery' | 'motor' | 'pcb' | 'speaker' | 'face';

export interface LitePart {
  id: string;
  /** Chip label. */
  short: string;
  /** Viewer title. */
  label: string;
  description: string;
  /** Hotspot on the parts sheet as [x, y, w, h] in sheet pixels; null means no hotspot. */
  rect: readonly [number, number, number, number] | null;
  model: LiteModel;
  /** Exploded amount, 0 (closed) to 1 (fully apart). Pendant only. */
  explode: number;
  /** Camera elevation in radians. */
  phi: number;
  /** Turntable angle in radians. */
  spin: number;
  focus: readonly PendantLayer[] | null;
  /** Stand the pendant on its edge (front and rear views). */
  upright: boolean;
}

/** Intrinsic size of the parts sheet image; hotspot rects are in these pixels. */
export const SHEET_WIDTH = 1150;
export const SHEET_HEIGHT = 773;

const part = (p: Pick<LitePart, 'id' | 'short' | 'label' | 'description' | 'rect'> & Partial<LitePart>): LitePart => ({
  model: 'pendant',
  explode: 1,
  phi: 0.42,
  spin: 0.35,
  focus: null,
  upright: false,
  ...p,
});

export const LITE_PARTS: readonly LitePart[] = [
  part({ id: 'overview', short: 'Exploded overview', label: 'Exploded pendant', description: 'Every layer of the pendant pulled apart along its axis. Use the slider to close it up.', rect: null }),
  part({ id: 'face', short: 'Face + button', label: 'Face + flush button', description: 'Speaker perforations · Aubergine matte polymer face · Flush polymer button', rect: [92, 22, 252, 130], focus: ['face'] }),
  part({ id: 'speaker', short: 'Speaker', label: 'Speaker + membrane', description: 'Speaker + membrane', rect: [112, 152, 210, 64], focus: ['speaker'] }),
  part({ id: 'pcb', short: 'Electronics', label: 'Electronics board', description: 'Dual microphones (MEMS) · Bluetooth + flash · Accelerometer + gyroscope', rect: [86, 208, 248, 122], focus: ['pcb'] }),
  part({ id: 'motor', short: 'Vibration motor', label: 'Vibration motor', description: 'Vibration motor', rect: [176, 330, 76, 34], focus: ['motor'] }),
  part({ id: 'battery', short: 'Battery', label: 'Rechargeable battery', description: 'Rechargeable battery', rect: [102, 354, 210, 66], focus: ['battery'] }),
  part({ id: 'housing', short: 'Housing + magnets', label: 'Housing + magnets', description: 'Internal structure with enclosed magnets · Silicone outer sleeve (dusty rose) · Magnetic charging contacts (on rear)', rect: [58, 394, 296, 180], focus: ['frame', 'housing'] }),
  part({ id: 'front', short: 'Front view', label: 'Front view', description: 'Elegant, minimal design.', rect: [628, 148, 212, 236], explode: 0, upright: true, spin: 0, phi: 0.1 }),
  part({ id: 'rear', short: 'Rear view', label: 'Rear view', description: 'Two charging contacts.', rect: [898, 148, 212, 236], explode: 0, upright: true, spin: Math.PI, phi: 0.1 }),
  part({ id: 'clip', short: 'Magnetic clip', label: 'Slim magnetic clip', description: 'Simple, low-profile clip for clothing.', rect: [706, 404, 184, 142], model: 'clip', spin: -0.65, phi: 0.12 }),
  part({ id: 'attach', short: 'Clip + pendant', label: 'Pendant on clip', description: 'Pendant attaches magnetically to the clip (simple and secure).', rect: [920, 396, 154, 146], model: 'attach', spin: 0.3, phi: 0.38 }),
  part({ id: 'backplate', short: 'Clothing backplate', label: 'Magnetic clothing backplate', description: 'Thin, lightweight magnetic plate.', rect: [46, 610, 124, 72], model: 'backplate', spin: 0, phi: 0.62 }),
  part({ id: 'wristband', short: 'Wristband', label: 'Wristband', description: 'Comfortable adjustable strap with silicone pendant holder.', rect: [190, 586, 254, 140], model: 'wristband', spin: -0.45, phi: 0.3 }),
  part({ id: 'lanyard', short: 'Breakaway lanyard', label: 'Breakaway lanyard', description: 'Soft braided cord with breakaway clasp.', rect: [460, 578, 264, 132], model: 'lanyard', spin: 0.2, phi: 0.72 }),
  part({ id: 'puck', short: 'Charging puck', label: 'Magnetic charging puck', description: 'Low-profile charging cradle with alignment magnets.', rect: [770, 624, 142, 94], model: 'puck', spin: -0.4, phi: 0.55 }),
  part({ id: 'cable', short: 'USB-C cable', label: 'USB-C cable', description: 'Durable braided cable to power the charging puck (USB-C only powers the accessory).', rect: [912, 628, 192, 98], model: 'cable', spin: -0.5, phi: 0.62 }),
];
