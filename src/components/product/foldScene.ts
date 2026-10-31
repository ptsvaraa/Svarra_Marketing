import * as THREE from 'three';
import type { FoldAnim, FoldLayer, FoldModel, FoldView } from '../../data/svaraaFold';

/**
 * Procedural Svaraa Fold (fold-over pendant) models and a lightweight turntable viewer.
 * Ported from the design team's interactive mockup; geometry, material, lighting
 * and animation values are kept as designed. Everything is built in code.
 */

interface Layer extends THREE.Group {
  userData: { rest: number; exp: number; mats: THREE.Material[] };
}

/** Moving parts of the fold-over pendant the loop drives each frame. */
interface FoldParts {
  layers: Layer[];
  layerMap: Partial<Record<FoldLayer, Layer>>;
  rear: THREE.Group;
  bridgePos: THREE.BufferAttribute;
  bridgeGeo: THREE.BufferGeometry;
  NS: number;
  NR: number;
  RM: number;
  RR: number;
  XH: number;
  cord: THREE.Mesh;
  switchKnob: THREE.Mesh;
}

type Vec3 = [number, number, number];
type Mats = FoldScene['mat'];

const TWO_PI = Math.PI * 2;

export interface FoldShowOptions {
  /** Explode target, 0..1. Defaults to the view's own value. */
  explode?: number;
  /** Fold target, 0..1. Defaults to the view's own value. */
  fold?: number;
}

export class FoldScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.05, 400);
  private readonly key: THREE.DirectionalLight;
  private readonly pivot = new THREE.Group();
  private readonly model: THREE.Group;
  private readonly parts: FoldParts;
  private readonly models: Record<FoldModel, THREE.Group>;
  private readonly envTexture: THREE.Texture;
  private readonly resizeObserver: ResizeObserver;
  private readonly cleanups: (() => void)[] = [];

  private readonly qFlat = new THREE.Quaternion();
  private readonly qUp: THREE.Quaternion;
  private modelTarget: THREE.Quaternion;
  private readonly box = new THREE.Box3();
  private readonly v1 = new THREE.Vector3();
  private readonly v2 = new THREE.Vector3();
  private readonly target = new THREE.Vector3(0, 1, 0);

  private active: THREE.Group | null = null;
  private shownId: string | null = null;
  private focusMats: THREE.MeshStandardMaterial[] = [];
  private anim: FoldAnim | null = null;
  private cordWanted = false;
  private explode = 0;
  private explodeTarget = 0;
  private fold = 0;
  private foldTarget = 0;
  private lastFold = -1;
  private knobS = 0;
  private spin = 0;
  private spinTarget = 0;
  private phiBase = 0.45;
  private time = 0;
  private fitRadius = 4;
  private fitHeight = 1.5;
  private pop = 1;
  private userTheta = 0;
  private userPhi = 0;
  private zoom = 1;
  private auto = true;
  private drag: { x: number; y: number } | null = null;
  private raf = 0;
  private last = 0;
  private running = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;

    this.envTexture = this.buildEnvironment();
    this.scene.environment = this.envTexture;

    this.scene.add(new THREE.HemisphereLight(0xfff4ea, 0x8f7468, 0.55));
    const key = new THREE.DirectionalLight(0xfff1e2, 2.1);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    this.scene.add(key, key.target);
    this.key = key;
    const fill = new THREE.DirectionalLight(0xffe4da, 0.45);
    fill.position.set(-6, 3, -5);
    this.scene.add(fill);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.17 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.002;
    ground.receiveShadow = true;
    this.scene.add(ground, this.pivot);

    const svaraa = this.buildSvaraa();
    this.model = svaraa.root;
    this.parts = svaraa.parts;
    this.models = { svaraa: this.model, puck: this.buildPuck(), cable: this.buildCable() };
    for (const m of Object.values(this.models)) {
      m.visible = false;
      m.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.pivot.add(m);
    }

    const qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    this.qUp = qy.multiply(qz);
    this.modelTarget = this.qFlat;

    this.bindPointer();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  // ── public API ──────────────────────────────────────────────

  /** Switches to a view (model, focus, animation, camera targets). Explode/fold default to the view's values. */
  show(view: FoldView, opts: FoldShowOptions = {}) {
    this.explodeTarget = opts.explode ?? view.explode;
    this.foldTarget = opts.fold ?? view.fold;
    this.anim = view.anim;
    this.cordWanted = view.cord;
    if (this.shownId === view.id) return;
    const first = this.shownId == null;
    this.shownId = view.id;

    this.modelTarget = view.upright ? this.qUp : this.qFlat;
    if (first) this.model.quaternion.copy(this.modelTarget);
    const next = this.models[view.model];
    if (this.active !== next) {
      if (this.active) this.active.visible = false;
      next.visible = true;
      if (next === this.model && this.active) this.model.quaternion.copy(this.modelTarget);
      this.active = next;
    }
    this.pop = 0.92;

    // Turn the shortest way round to the view's preferred angle.
    const n = Math.round((this.spin - view.spin) / TWO_PI);
    this.spinTarget = view.spin + n * TWO_PI;
    this.phiBase = view.phi;
    this.setFocus(view.focus, view.fade ?? false);
  }

  setExplode(value: number) {
    this.explodeTarget = value;
  }

  setFold(value: number) {
    this.foldTarget = value;
  }

  setAutoRotate(on: boolean) {
    this.auto = on;
  }

  /** Multiplies the camera distance: below 1 zooms in, above 1 zooms out. */
  zoomBy(factor: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom * factor, 0.5, 2.4);
  }

  resetView() {
    this.userTheta = 0;
    this.userPhi = 0;
    this.zoom = 1;
  }

  /** Starts or stops the render loop; stopped while the viewer is off screen. */
  setRunning(on: boolean) {
    if (on === this.running) return;
    this.running = on;
    if (on) {
      this.last = performance.now() / 1000;
      this.raf = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  dispose() {
    this.setRunning(false);
    this.resizeObserver.disconnect();
    this.cleanups.forEach((fn) => fn());
    const disposed = new Set<{ dispose: () => void }>();
    const collect = (root: THREE.Object3D) =>
      root.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        disposed.add(o.geometry);
        const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
        for (const mat of mats) {
          disposed.add(mat);
          for (const value of Object.values(mat)) if (value instanceof THREE.Texture) disposed.add(value);
        }
      });
    collect(this.scene);
    collect(this.parts.cord); // detached from the scene unless the worn view is folded
    disposed.forEach((d) => d.dispose());
    this.envTexture.dispose();
    this.renderer.dispose();
  }

  // ── loop ────────────────────────────────────────────────────

  private tick = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, Math.max(0, now - this.last));
    this.last = now;
    this.time += dt;
    const ease = (rate: number) => 1 - Math.exp(-dt * rate);
    const m = this.model;
    const U = this.parts;
    const act = this.active;
    if (!act) return;
    const t = this.time;

    // Fold and explode (explode collapses as the pendant folds).
    let foldT = this.foldTarget;
    if (this.anim === 'foldloop') foldT = 0.5 - 0.5 * Math.cos(t * 0.9);
    this.fold += (foldT - this.fold) * ease(this.anim === 'foldloop' ? 12 : 4);
    this.explode += (this.explodeTarget - this.explode) * ease(4.5);
    const ex = this.explode * (1 - Math.min(1, this.fold * 3));
    for (const L of U.layers) L.position.set(0, L.userData.rest + (L.userData.exp - L.userData.rest) * ex, 0);

    // Feature animations.
    const a = this.anim;
    const button = U.layerMap.button;
    if (a === 'press' && button) button.position.y -= 0.035 * Math.max(0, Math.sin(t * 3.5));
    const motor = U.layerMap.motor;
    if (a === 'shake' && motor) {
      const s = 0.025 * (0.5 + 0.5 * Math.sin(t * 2.2));
      motor.position.x = s * Math.sin(t * 70);
      motor.position.z = s * Math.cos(t * 63);
    }
    const slideT = a === 'slide' ? (Math.sin(t * 1.6) > 0 ? 1 : 0) : 0;
    this.knobS += (slideT - this.knobS) * ease(8);
    U.switchKnob.position.x = -0.11 + 0.22 * this.knobS;

    // Fold the rear pod around the bridge hinge.
    if (Math.abs(this.fold - this.lastFold) > 1e-4) {
      this.lastFold = this.fold;
      const th = -Math.PI * this.fold;
      const XH = U.XH;
      U.rear.position.set(XH + XH * Math.cos(th), XH * Math.sin(th), 0);
      U.rear.rotation.set(0, 0, th);
      this.updateBridge();
    }
    const wantCord = this.cordWanted && this.fold > 0.92;
    if (wantCord && !U.cord.parent) m.add(U.cord);
    else if (!wantCord && U.cord.parent) m.remove(U.cord);

    m.quaternion.slerp(this.modelTarget, ease(4));

    if (this.focusMats.length) {
      const glow = 0.16 + 0.12 * Math.sin(t * 3.2);
      for (const mat of this.focusMats) mat.emissiveIntensity = glow;
    }

    if (this.auto && !this.drag) this.spinTarget += dt * 0.36;
    this.spin += (this.spinTarget - this.spin) * ease(4);

    // Measure the model and sit it on the floor, centred on the turntable.
    const pivot = this.pivot;
    pivot.rotation.y = 0;
    pivot.scale.setScalar(1);
    m.position.set(0, 0, 0);
    act.position.set(0, 0, 0);
    pivot.updateMatrixWorld(true);
    const box = this.box.setFromObject(act);
    const centre = box.getCenter(this.v1);
    const size = box.getSize(this.v2);
    act.position.set(-centre.x, -box.min.y, -centre.z);
    if (a === 'buzz' && act === m) {
      const env = Math.max(0, Math.sin(t * 2.4));
      act.position.x += 0.035 * env * Math.sin(t * 75);
      act.position.z += 0.035 * env * Math.cos(t * 68);
    }
    const radius = size.length() / 2;
    this.pop += (1 - this.pop) * ease(7);
    pivot.scale.setScalar(this.pop);
    pivot.rotation.y = this.spin;

    // Frame the model so it always fits, whatever the canvas aspect.
    this.fitRadius += (radius - this.fitRadius) * ease(4);
    this.fitHeight += (size.y / 2 - this.fitHeight) * ease(4);
    const cam = this.camera;
    const vf = THREE.MathUtils.degToRad(cam.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
    const dist = (this.fitRadius / Math.sin(Math.min(vf, hf) / 2)) * 1.04 * this.zoom;
    const phi = THREE.MathUtils.clamp(this.phiBase + this.userPhi, -0.2, 1.4);
    const th = this.userTheta;
    this.target.set(0, this.fitHeight, 0);
    cam.position.set(
      dist * Math.cos(phi) * Math.sin(th),
      this.target.y + dist * Math.sin(phi),
      dist * Math.cos(phi) * Math.cos(th),
    );
    cam.near = Math.max(0.02, dist / 100);
    cam.far = dist * 10;
    cam.updateProjectionMatrix();
    cam.lookAt(this.target);

    const L = Math.max(6, dist);
    this.key.position.set(0.45 * L, this.target.y + 0.8 * L, 0.55 * L);
    this.key.target.position.copy(this.target);
    const sc = this.key.shadow.camera;
    const b = this.fitRadius * 1.6 + 0.5;
    sc.left = -b;
    sc.right = b;
    sc.top = b;
    sc.bottom = -b;
    sc.near = 0.1;
    sc.far = L * 3;
    sc.updateProjectionMatrix();

    this.renderer.render(this.scene, cam);
  };

  private setFocus(list: readonly FoldLayer[] | null, fade: boolean) {
    this.focusMats = [];
    for (const L of this.parts.layers) {
      const hit = !!list && list.includes(L.name as FoldLayer);
      const on = !list || hit || !fade;
      for (const mat of L.userData.mats) {
        if (mat.transparent !== !on) {
          mat.transparent = !on;
          mat.needsUpdate = true;
        }
        mat.opacity = on ? 1 : 0.16;
        mat.depthWrite = on;
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.setHex(0xe8a06a);
          mat.emissiveIntensity = 0;
          if (hit) this.focusMats.push(mat);
        }
      }
      L.traverse((o) => {
        if (o instanceof THREE.Mesh) o.castShadow = on;
      });
    }
  }

  private resize() {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private bindPointer() {
    const c = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      c.addEventListener(type, fn, opts);
      this.cleanups.push(() => c.removeEventListener(type, fn, opts));
    };
    on('pointerdown', (e) => {
      this.drag = { x: e.clientX, y: e.clientY };
      try {
        c.setPointerCapture(e.pointerId);
      } catch {
        /* capture can fail if the pointer is already gone */
      }
      c.style.cursor = 'grabbing';
    });
    on('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.drag = { x: e.clientX, y: e.clientY };
      this.userTheta -= dx * 0.009;
      this.userPhi = THREE.MathUtils.clamp(this.userPhi + dy * 0.006, -0.6, 1.1);
    });
    const end = () => {
      this.drag = null;
      c.style.cursor = 'grab';
    };
    on('pointerup', end);
    on('pointercancel', end);
    // Plain wheel scrolls the page; pinch (reported as ctrl + wheel) or ctrl/⌘ + wheel zooms.
    on(
      'wheel',
      (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        this.zoomBy(Math.exp(e.deltaY * 0.004));
      },
      { passive: false },
    );
    on('dblclick', () => this.resetView());
  }

  // ── environment ─────────────────────────────────────────────

  /** A tiny light-box scene baked into an environment map for soft studio reflections. */
  private buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = new THREE.Scene();
    const own: { dispose: () => void }[] = [];
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos?: Vec3) => {
      const m = new THREE.Mesh(geo, mat);
      if (pos) {
        m.position.set(...pos);
        m.lookAt(0, 0, 0);
      }
      env.add(m);
      own.push(geo, mat);
    };
    add(new THREE.BoxGeometry(40, 24, 40), new THREE.MeshBasicMaterial({ color: 0x8c7f77, side: THREE.BackSide }));
    const panel = (w: number, h: number, rgb: Vec3, pos: Vec3) =>
      add(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide }), pos);
    panel(18, 10, [5, 4.7, 4.4], [0, 11, 2]);
    panel(10, 8, [3.2, 2.7, 2.4], [-15, 4, 6]);
    panel(8, 8, [1.6, 1.7, 1.9], [14, 3, -4]);
    panel(14, 5, [1.5, 1.4, 1.3], [0, 2, 16]);
    const texture = pmrem.fromScene(env, 0.035).texture;
    own.forEach((o) => o.dispose());
    pmrem.dispose();
    return texture;
  }

  // ── materials & helpers ─────────────────────────────────────

  private readonly mat = {
    rose: () =>
      new THREE.MeshPhysicalMaterial({ color: 0xbe8174, roughness: 0.62, sheen: 0.45, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xf6dcd4), clearcoat: 0.06, side: THREE.DoubleSide }),
    aub: () =>
      new THREE.MeshPhysicalMaterial({ color: 0x4e2a38, roughness: 0.68, sheen: 0.3, sheenColor: new THREE.Color(0x8a5a6a), side: THREE.DoubleSide }),
    gold: () => new THREE.MeshStandardMaterial({ color: 0xe3ae66, metalness: 1, roughness: 0.34 }),
    metal: () => new THREE.MeshStandardMaterial({ color: 0xcdcfd4, metalness: 0.95, roughness: 0.24, side: THREE.DoubleSide }),
    dark: () => new THREE.MeshStandardMaterial({ color: 0x3a3a3e, metalness: 0.75, roughness: 0.4, side: THREE.DoubleSide }),
    black: () => new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.5, side: THREE.DoubleSide }),
    rubber: () => new THREE.MeshStandardMaterial({ color: 0x2a2a2d, roughness: 0.85 }),
    beige: () => new THREE.MeshStandardMaterial({ color: 0xdccdb7, roughness: 0.7, side: THREE.DoubleSide }),
    pcb: () => new THREE.MeshStandardMaterial({ color: 0x1d6a3e, roughness: 0.4, metalness: 0.1 }),
    kapton: () => new THREE.MeshStandardMaterial({ color: 0xd7a23a, roughness: 0.3, metalness: 0.2 }),
    pouch: () => new THREE.MeshStandardMaterial({ color: 0xc9cacf, roughness: 0.32, metalness: 0.65 }),
    cream: () =>
      new THREE.MeshPhysicalMaterial({ color: 0xeadfcf, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide }),
  };

  private lathe(pts: [number, number][], segments = 96) {
    return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segments);
  }

  private roundRect<T extends THREE.Path>(w: number, h: number, r: number, shape: T): T {
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  private rr(w: number, h: number, r: number) {
    return this.roundRect(w, h, r, new THREE.Shape());
  }

  private mesh(geo: THREE.BufferGeometry, mat: THREE.Material, pos?: Vec3, rot?: Vec3) {
    const o = new THREE.Mesh(geo, mat);
    if (pos) o.position.set(...pos);
    if (rot) o.rotation.set(...rot);
    return o;
  }

  private canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d');
    if (ctx) draw(ctx);
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = 8;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
    }
    return t;
  }

  private orientAlong(obj: THREE.Object3D, dir: THREE.Vector3, axis = new THREE.Vector3(0, 1, 0)) {
    obj.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
  }

  /** Draws the pendant face: speaker perforations, gold lotus and button. Also renders its metal/roughness maps. */
  private drawFace(ctx: CanvasRenderingContext2D, mode: 'color' | 'metal' | 'rough') {
    const S = 1024;
    const c = 512;
    const pal = {
      color: { bg: '#47232F', line: '#E0A766', hole: '#22111A', btn: '#4A2735' },
      metal: { bg: '#000000', line: '#ffffff', hole: '#000000', btn: '#000000' },
      rough: { bg: 'rgb(225,225,225)', line: 'rgb(64,64,64)', hole: 'rgb(235,235,235)', btn: 'rgb(170,170,170)' },
    }[mode];
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, S, S);
    if (mode === 'color') {
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647);
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(rnd() * S, rnd() * S, 2, 2);
      }
    }
    ctx.fillStyle = pal.hole;
    const R = 512;
    const dir = 2.0;
    for (let row = 0, y = 0; y < S; y += 22, row++) {
      for (let x = (row % 2) * 11; x < S; x += 22) {
        const dx = x - c;
        const dy = c - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        let ang = Math.atan2(dx, dy) - dir;
        ang = Math.atan2(Math.sin(ang), Math.cos(ang));
        if (d > 0.79 * R && d < 0.94 * R && Math.abs(ang) < 0.62) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, TWO_PI);
          ctx.fill();
        }
      }
    }
    const pol = (r: number, a: number) => [c + r * Math.sin(a), c - r * Math.cos(a)] as const;
    const petal = (a: number, rb: number, rt: number, dB: number, dC: number, rc: number) => {
      const p0 = pol(rb, a - dB);
      const tip = pol(rt, a);
      const p1 = pol(rb, a + dB);
      const c0 = pol(rc, a - dC);
      const c1 = pol(rc, a + dC);
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.quadraticCurveTo(c0[0], c0[1], tip[0], tip[1]);
      ctx.quadraticCurveTo(c1[0], c1[1], p1[0], p1[1]);
      ctx.stroke();
    };
    ctx.strokeStyle = pal.line;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = mode === 'color' ? 8 : 10;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      petal(a, 118, 372, 0.3, 0.38, 290);
      petal(a + Math.PI / 8, 112, 248, 0.32, 0.42, 196);
    }
    ctx.lineWidth = mode === 'color' ? 5 : 7;
    for (let i = 0; i < 8; i++) petal((i * Math.PI) / 4, 140, 300, 0.15, 0.2, 236);
    ctx.lineWidth = mode === 'color' ? 6 : 8;
    ctx.beginPath();
    ctx.arc(c, c, 108, 0, TWO_PI);
    ctx.stroke();
    ctx.fillStyle = pal.btn;
    ctx.beginPath();
    ctx.arc(c, c, 97, 0, TWO_PI);
    ctx.fill();
  }

  private braid(repeat: [number, number]) {
    const t = this.canvasTexture(
      128,
      32,
      (x) => {
        x.fillStyle = '#C9A98A';
        x.fillRect(0, 0, 128, 32);
        x.lineCap = 'round';
        for (let i = -40; i < 170; i += 10) {
          x.strokeStyle = '#A3805F';
          x.lineWidth = 3;
          x.beginPath();
          x.moveTo(i, 0);
          x.lineTo(i + 18, 32);
          x.stroke();
          x.strokeStyle = '#E4CDB1';
          x.lineWidth = 2;
          x.beginPath();
          x.moveTo(i + 18, 0);
          x.lineTo(i, 32);
          x.stroke();
        }
      },
      repeat,
    );
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.82, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) });
  }

  private layer(name: FoldLayer, rest: number, exp: number): Layer {
    const g = new THREE.Group();
    g.name = name;
    g.userData = { rest, exp, mats: [] };
    return g as Layer;
  }

  // ── the fold-over pendant ───────────────────────────────────

  private buildSvaraa(): { root: THREE.Group; parts: FoldParts } {
    const M = this.mat;
    const RM = 2.3;
    const RR = 2.3;
    const G = 1.0;
    const D = RM + G + RR;
    const XH = D / 2;
    const root = new THREE.Group();
    const main = new THREE.Group();
    const rear = new THREE.Group();
    root.add(main, rear);
    const layers: Layer[] = [];
    const layerMap: Partial<Record<FoldLayer, Layer>> = {};
    const add = (parent: THREE.Object3D, L: Layer) => {
      parent.add(L);
      layers.push(L);
      layerMap[L.name as FoldLayer] = L;
      return L;
    };

    // Main pod: silicone shell with a raised bezel around the recessed face.
    const housing = add(main, this.layer('housing', 0, 0));
    housing.add(this.mesh(this.lathe([[0, 0], [1.9, 0], [2.14, 0.05], [2.27, 0.2], [2.33, 0.5], [2.31, 0.8], [2.25, 0.98], [2.16, 1.04], [2.06, 1.03], [2.0, 0.97], [1.99, 0.86], [1.99, 0.22], [1.88, 0.12], [0, 0.12]], 128), M.rose()));
    housing.add(this.mesh(this.lathe([[1.84, 0.78], [2.0, 0.78], [2.0, 0.82], [1.84, 0.82], [1.84, 0.78]], 128), M.rose()));

    // USB-C port on the front edge.
    const usb = add(main, this.layer('usb', 0, 0));
    const port = new THREE.ExtrudeGeometry(this.rr(0.66, 0.24, 0.12), { depth: 0.12, bevelEnabled: false, curveSegments: 10 });
    usb.add(this.mesh(port, M.black(), [0, 0.45, 2.22]));
    usb.add(this.mesh(new THREE.ExtrudeGeometry(this.rr(0.42, 0.06, 0.03), { depth: 0.02, bevelEnabled: false }), M.gold(), [0, 0.45, 2.335]));
    const rimShape = this.rr(0.76, 0.34, 0.17);
    rimShape.holes.push(this.roundRect(0.64, 0.22, 0.11, new THREE.Path()));
    usb.add(this.mesh(new THREE.ExtrudeGeometry(rimShape, { depth: 0.03, bevelEnabled: false, curveSegments: 10 }), M.metal(), [0, 0.45, 2.325]));

    // Physical mic privacy slider on the side wall.
    const sw = add(main, this.layer('switch', 0, 0));
    const swHolder = new THREE.Group();
    const phi = -0.55;
    swHolder.position.set(Math.sin(phi) * 2.33, 0.5, Math.cos(phi) * 2.33);
    swHolder.rotation.y = phi;
    swHolder.add(this.mesh(new THREE.BoxGeometry(0.62, 0.14, 0.05), M.black()));
    const knob = this.mesh(new THREE.BoxGeometry(0.28, 0.18, 0.1), new THREE.MeshPhysicalMaterial({ color: 0x5a2735, roughness: 0.5, clearcoat: 0.2 }), [-0.11, 0, 0.05]);
    swHolder.add(knob);
    sw.add(swHolder);

    // Matte face plate with the lotus inlay and speaker perforations.
    const face = add(main, this.layer('face', 0.82, 5.3));
    const faceMap = this.canvasTexture(1024, 1024, (x) => this.drawFace(x, 'color'));
    faceMap.colorSpace = THREE.SRGBColorSpace;
    const faceMat = new THREE.MeshPhysicalMaterial({
      map: faceMap,
      metalnessMap: this.canvasTexture(1024, 1024, (x) => this.drawFace(x, 'metal')),
      metalness: 1,
      roughnessMap: this.canvasTexture(1024, 1024, (x) => this.drawFace(x, 'rough')),
      roughness: 1,
      sheen: 0.04,
      sheenColor: new THREE.Color(0x9a6a7a),
      envMapIntensity: 0.55,
    });
    face.add(this.mesh(new THREE.CylinderGeometry(1.96, 1.97, 0.14, 128), M.aub(), [0, 0.07, 0]));
    face.add(this.mesh(new THREE.CircleGeometry(1.96, 128), faceMat, [0, 0.1405, 0], [-Math.PI / 2, 0, 0]));

    // Flush matching button.
    const button = add(main, this.layer('button', 0.82, 5.3));
    button.add(this.mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.02, 64), new THREE.MeshPhysicalMaterial({ color: 0x45232f, roughness: 0.66, sheen: 0.15, sheenColor: new THREE.Color(0x9a6a7a) }), [0, 0.148, 0]));

    // Rear pod: silicone shell + plain aubergine rear pad.
    const rh = add(rear, this.layer('rhousing', 0, 0));
    rh.add(this.mesh(this.lathe([[0, 0], [1.9, 0], [2.14, 0.05], [2.27, 0.18], [2.33, 0.42], [2.31, 0.66], [2.25, 0.82], [2.16, 0.88], [2.06, 0.87], [2.0, 0.81], [1.99, 0.7], [1.99, 0.2], [1.88, 0.1], [0, 0.1]], 128), M.rose()));
    rh.add(this.mesh(this.lathe([[1.84, 0.62], [2.0, 0.62], [2.0, 0.66], [1.84, 0.66], [1.84, 0.62]], 128), M.rose()));
    const pad = add(rear, this.layer('pad', 0.66, 2.6));
    const padTex = this.canvasTexture(512, 512, (x) => {
      x.fillStyle = '#45232F';
      x.fillRect(0, 0, 512, 512);
      let sd = 3;
      const rnd = () => ((sd = (sd * 16807) % 2147483647), sd / 2147483647);
      for (let i = 0; i < 9000; i++) {
        x.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)';
        x.fillRect(rnd() * 512, rnd() * 512, 2, 2);
      }
    });
    padTex.colorSpace = THREE.SRGBColorSpace;
    const padMat = new THREE.MeshPhysicalMaterial({ map: padTex, roughness: 0.9, envMapIntensity: 0.55, sheen: 0.08, sheenColor: new THREE.Color(0x8e5d70), side: THREE.DoubleSide });
    pad.add(this.mesh(this.lathe([[0, 0], [1.9, 0], [1.96, 0.04], [1.97, 0.1], [1.92, 0.15], [1.8, 0.17], [0, 0.17]], 128), padMat));
    const contactMat = M.gold();
    for (const z of [-0.26, 0.26]) {
      pad.add(this.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32), contactMat, [1.15, 0.18, z]));
      pad.add(this.mesh(new THREE.SphereGeometry(0.12, 24, 8, 0, TWO_PI, 0, 0.5), contactMat, [1.15, 0.17, z]));
    }

    // ---- internal parts (hidden inside the shell, revealed by Explode) ----
    // Internal frame with the enclosed magnets.
    const frame = add(main, this.layer('frame', 0.13, 1.15));
    const beige = M.beige();
    frame.add(this.mesh(this.lathe([[1.62, 0], [1.94, 0], [1.94, 0.12], [1.62, 0.12], [1.62, 0]], 96), beige));
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      frame.add(this.mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.36, 18), beige, [Math.cos(a) * 1.78, 0.18, Math.sin(a) * 1.78]));
    }
    frame.add(this.mesh(new THREE.BoxGeometry(3.3, 0.05, 0.12), beige, [0, 0.025, -0.55]));
    frame.add(this.mesh(new THREE.BoxGeometry(3.3, 0.05, 0.12), beige, [0, 0.025, 0.85]));
    const fm = M.metal();
    for (const x of [-0.85, 0.85]) frame.add(this.mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.16, 40), fm, [x, 0.08, 0.15]));

    // Rechargeable battery.
    const battery = add(main, this.layer('battery', 0.32, 2.05));
    const bg = new THREE.ExtrudeGeometry(this.rr(2.6, 1.25, 0.22), {
      depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 10,
    });
    bg.center();
    bg.rotateX(-Math.PI / 2);
    battery.add(this.mesh(bg, M.pouch()));
    const kap = M.kapton();
    const bm = M.metal();
    for (const x of [-1.23, 1.23]) battery.add(this.mesh(new THREE.BoxGeometry(0.2, 0.4, 1.27), kap, [x, 0, 0]));
    for (const z of [-0.3, 0.3]) battery.add(this.mesh(new THREE.BoxGeometry(0.3, 0.03, 0.16), bm, [1.45, 0.05, z]));

    // Vibration motor.
    const motor = add(main, this.layer('motor', 0.58, 2.8));
    motor.add(this.mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.24, 48), M.metal()));
    motor.add(this.mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 48), M.black(), [0, -0.14, 0]));
    motor.add(this.mesh(new THREE.TorusGeometry(0.38, 0.02, 8, 48), M.dark(), [0, 0.12, 0], [Math.PI / 2, 0, 0]));

    // Main board (Bluetooth, flash, sensors).
    const pcb = add(main, this.layer('pcb', 0.62, 3.45));
    this.buildBoard(pcb, M);
    for (const ch of pcb.children) {
      ch.position.x *= 0.92;
      ch.position.z *= 0.92;
    }
    pcb.children[0]?.scale.set(0.92, 1, 0.92);

    // Speaker + membrane (low-profile).
    const speaker = add(main, this.layer('speaker', 0.62, 4.35));
    const spk = new THREE.Group();
    spk.scale.set(0.95, 0.6, 0.95);
    const dk = M.dark();
    spk.add(this.mesh(this.lathe([[1.68, 0], [1.98, 0], [1.98, 0.16], [1.68, 0.16], [1.68, 0]], 96), dk));
    spk.add(this.mesh(new THREE.TorusGeometry(1.62, 0.07, 12, 96), M.rubber(), [0, 0.15, 0], [Math.PI / 2, 0, 0]));
    spk.add(this.mesh(this.lathe([[0.55, 0.2], [0.9, 0.17], [1.3, 0.14], [1.6, 0.13]], 96), M.black()));
    spk.add(
      this.mesh(
        new THREE.SphereGeometry(1.32, 48, 16, 0, TWO_PI, 0, 0.43),
        new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.28, metalness: 0.3, side: THREE.DoubleSide }),
        [0, -1.0, 0],
      ),
    );
    spk.add(this.mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.3, 48), dk, [0, -0.15, 0]));
    const tabM = M.beige();
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      spk.add(this.mesh(new THREE.BoxGeometry(0.3, 0.12, 0.2), tabM, [Math.cos(a) * 1.86, 0.06, Math.sin(a) * 1.86], [0, -a, 0]));
    }
    speaker.add(spk);

    // Rear pod: magnet carrier that holds the fold closed.
    const magnets = add(rear, this.layer('magnets', 0.18, 1.35));
    const mb = M.beige();
    magnets.add(this.mesh(this.lathe([[0, 0], [1.85, 0], [1.85, 0.1], [0, 0.1]], 96), mb));
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4;
      magnets.add(this.mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.3, 16), mb, [Math.cos(a) * 1.65, 0.15, Math.sin(a) * 1.65]));
    }
    const mm = M.metal();
    for (const [x, z] of [[-0.75, -0.45], [0.8, -0.3], [0.0, 0.75]] as const) {
      magnets.add(this.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 40), mm, [x, 0.16, z]));
    }

    // Flexible bridge (geometry rebuilt as it folds).
    const bridge = add(root, this.layer('bridge', 0, 0));
    const NS = 44;
    const NR = 20;
    const bGeo = new THREE.BufferGeometry();
    const bridgePos = new THREE.BufferAttribute(new Float32Array(NS * NR * 3), 3);
    bGeo.setAttribute('position', bridgePos);
    const idx: number[] = [];
    for (let i = 0; i < NS - 1; i++) {
      for (let j = 0; j < NR; j++) {
        const a = i * NR + j;
        const b = i * NR + ((j + 1) % NR);
        const c = (i + 1) * NR + j;
        const d = (i + 1) * NR + ((j + 1) % NR);
        idx.push(a, c, b, b, c, d);
      }
    }
    bGeo.setIndex(idx);
    bridge.add(this.mesh(bGeo, M.rose()));

    // Braided cord through the folded bridge loop (worn view).
    const W = (x: number, y: number, z: number) => new THREE.Vector3(y, z, x);
    const cordCurve = new THREE.CatmullRomCurve3(
      [W(-3.0, 7.0, -0.7), W(-1.9, 4.6, -0.35), W(-0.85, 3.0, -0.05), W(0, 2.6, 0.02), W(0.85, 3.0, -0.05), W(1.9, 4.6, -0.35), W(3.0, 7.0, -0.7)],
      false,
      'centripetal',
    );
    const cord = this.mesh(new THREE.TubeGeometry(cordCurve, 240, 0.14, 14, false), this.braid([80, 1]));
    cord.castShadow = true;
    cord.receiveShadow = true;

    for (const L of layers) {
      const set: THREE.Material[] = [];
      L.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
        for (const mt of mats) if (!set.includes(mt)) set.push(mt);
      });
      L.userData.mats = set;
    }

    return { root, parts: { layers, layerMap, rear, bridgePos, bridgeGeo: bGeo, NS, NR, RM, RR, XH, cord, switchKnob: knob } };
  }

  /** Rebuilds the flexible bridge tube between the two pods for the current fold. */
  private updateBridge() {
    const U = this.parts;
    const f = this.fold;
    U.rear.updateMatrix();
    const A = new THREE.Vector3(U.RM - 0.3, 0.46, 0);
    const tA = new THREE.Vector3(1, 0, 0);
    const B = new THREE.Vector3(-(U.RR - 0.3), 0.4, 0).applyMatrix4(U.rear.matrix);
    const tB = new THREE.Vector3(-1, 0, 0).applyQuaternion(U.rear.quaternion);
    const L = 0.5 + 0.95 * f;
    const P1 = A.clone().addScaledVector(tA, L);
    const P2 = B.clone().addScaledVector(tB, L);
    const curve = new THREE.CubicBezierCurve3(A, P1, P2, B);
    const pos = U.bridgePos.array;
    const Z = new THREE.Vector3(0, 0, 1);
    const n = new THREE.Vector3();
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    for (let i = 0; i < U.NS; i++) {
      const s = i / (U.NS - 1);
      curve.getPoint(s, p);
      curve.getTangent(s, t);
      n.crossVectors(Z, t).normalize();
      const w = 1.2 - 0.28 * Math.sin(Math.PI * s);
      const th = 0.21;
      for (let j = 0; j < U.NR; j++) {
        const a = (j / U.NR) * TWO_PI;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const sx = Math.sign(ca) * Math.pow(Math.abs(ca), 0.4);
        const sy = Math.sign(sa) * Math.pow(Math.abs(sa), 0.4);
        const o = (i * U.NR + j) * 3;
        pos[o] = p.x + n.x * th * sy;
        pos[o + 1] = p.y + n.y * th * sy;
        pos[o + 2] = p.z + w * sx;
      }
    }
    U.bridgePos.needsUpdate = true;
    U.bridgeGeo.computeVertexNormals();
    U.bridgeGeo.computeBoundingBox();
    U.bridgeGeo.computeBoundingSphere();
  }

  private buildBoard(pcb: THREE.Group, M: Mats) {
    pcb.add(this.mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.07, 96), M.pcb()));
    const blk = M.black();
    const pad = M.gold();
    const bei = M.beige();
    const met = M.metal();
    const btTex = this.canvasTexture(128, 128, (x) => {
      x.fillStyle = '#18181a';
      x.fillRect(0, 0, 128, 128);
      x.strokeStyle = '#ececec';
      x.lineWidth = 8;
      x.lineJoin = 'round';
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(42, 42);
      x.lineTo(86, 84);
      x.lineTo(64, 106);
      x.lineTo(64, 22);
      x.lineTo(86, 44);
      x.lineTo(42, 86);
      x.stroke();
    });
    btTex.colorSpace = THREE.SRGBColorSpace;
    const top = 0.035;
    const chip = (w: number, h: number, d: number, x: number, z: number, mat: THREE.Material) =>
      pcb.add(this.mesh(new THREE.BoxGeometry(w, h, d), mat, [x, top + h / 2, z]));
    chip(0.72, 0.1, 0.72, -0.2, -0.3, blk);
    pcb.add(this.mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshStandardMaterial({ map: btTex, roughness: 0.5 }), [-0.2, top + 0.101, -0.3], [-Math.PI / 2, 0, 0]));
    chip(0.56, 0.08, 0.38, 0.85, 0.55, blk);
    chip(0.38, 0.08, 0.38, 1.0, 0.0, blk);
    pcb.add(this.mesh(new THREE.PlaneGeometry(0.24, 0.24), met, [1.0, top + 0.081, 0.0], [-Math.PI / 2, 0, 0]));
    chip(0.5, 0.08, 0.5, -0.95, 0.6, blk);
    chip(0.42, 0.08, 0.3, -0.1, 0.95, blk);
    chip(0.3, 0.16, 0.3, 0.6, -1.2, bei);
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
    for (let i = 0; i < 46; i++) {
      const a = rnd() * TWO_PI;
      const r = 0.55 + rnd() * 1.2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x + 0.2) < 0.5 && Math.abs(z + 0.3) < 0.5) continue;
      const w = 0.07 + rnd() * 0.12;
      const d = 0.05 + rnd() * 0.08;
      const pick = rnd();
      chip(w, 0.04 + rnd() * 0.04, d, x, z, pick < 0.5 ? blk : pick < 0.8 ? bei : pad);
    }
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TWO_PI;
      pcb.add(this.mesh(new THREE.BoxGeometry(0.1, 0.012, 0.06), pad, [Math.cos(a) * 1.84, top + 0.006, Math.sin(a) * 1.84], [0, -a, 0]));
    }
  }

  // ── charging kit ────────────────────────────────────────────

  private buildPlug() {
    const M = this.mat;
    const g = new THREE.Group();
    const hg = new THREE.ExtrudeGeometry(this.rr(0.9, 0.44, 0.2), {
      depth: 1.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 10,
    });
    g.add(this.mesh(hg, M.rose(), [0, 0, 0.25]));
    g.add(this.mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.4, 24), M.rose(), [0, 0, 0.1], [Math.PI / 2, 0, 0]));
    const sg = new THREE.ExtrudeGeometry(this.rr(0.8, 0.26, 0.13), { depth: 0.6, bevelEnabled: false, curveSegments: 12 });
    g.add(this.mesh(sg, M.metal(), [0, 0, 1.38]));
    const slot = new THREE.ExtrudeGeometry(this.rr(0.62, 0.1, 0.05), { depth: 0.02, bevelEnabled: false, curveSegments: 8 });
    g.add(this.mesh(slot, new THREE.MeshBasicMaterial({ color: 0x111111 }), [0, 0, 1.975]));
    return g;
  }

  private buildPuck() {
    const M = this.mat;
    const g = new THREE.Group();
    g.add(this.mesh(this.lathe([[0, 0.31], [1.38, 0.31], [1.44, 0.36], [1.46, 0.45], [1.6, 0.48], [1.74, 0.44], [1.82, 0.3], [1.8, 0.08], [1.72, 0.01], [1.6, 0], [0, 0]], 128), M.cream()));
    g.add(this.mesh(new THREE.RingGeometry(0.9, 0.94, 96), new THREE.MeshStandardMaterial({ color: 0xd3c5b2, roughness: 0.6 }), [0, 0.311, 0], [-Math.PI / 2, 0, 0]));
    const gold = M.gold();
    for (const x of [-0.17, 0.17]) g.add(this.mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 20), gold, [x, 0.34, 0]));
    g.add(this.mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.5, 24), M.rose(), [2.0, 0.2, 0], [0, 0, Math.PI / 2]));
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.2, 0.2, 0),
      new THREE.Vector3(3.0, 0.13, 0.25),
      new THREE.Vector3(3.6, 0.12, 1.2),
      new THREE.Vector3(3.2, 0.12, 2.2),
      new THREE.Vector3(2.0, 0.13, 2.6),
      new THREE.Vector3(0.9, 0.14, 2.9),
    ]);
    g.add(this.mesh(new THREE.TubeGeometry(curve, 200, 0.1, 10, false), this.braid([70, 1])));
    const plug = this.buildPlug();
    plug.position.copy(curve.getPoint(1));
    this.orientAlong(plug, curve.getTangent(1), new THREE.Vector3(0, 0, 1));
    g.add(plug);
    return g;
  }

  private buildCable() {
    const g = new THREE.Group();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 26; i++) {
      const th = (i / 26) * Math.PI * 4;
      const r = 2.0 + 0.25 * Math.sin(th * 1.5);
      pts.push(new THREE.Vector3(r * Math.cos(th), 0.12 + i * 0.012, r * Math.sin(th)));
    }
    pts.push(new THREE.Vector3(2.6, 0.3, 1.2), new THREE.Vector3(3.0, 0.3, 2.4), new THREE.Vector3(2.6, 0.3, 3.4));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    g.add(this.mesh(new THREE.TubeGeometry(curve, 600, 0.11, 12, false), this.braid([260, 1])));
    const plug = this.buildPlug();
    plug.position.copy(curve.getPoint(1));
    this.orientAlong(plug, curve.getTangent(1), new THREE.Vector3(0, 0, 1));
    g.add(plug);
    const s0 = curve.getPoint(0);
    const boot = this.mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.5, 24), this.mat.rose(), [s0.x, s0.y, s0.z]);
    this.orientAlong(boot, curve.getTangent(0));
    g.add(boot);
    return g;
  }
}
