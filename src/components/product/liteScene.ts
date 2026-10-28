import * as THREE from 'three';
import type { LiteModel, LitePart, PendantLayer } from '../../data/svaraaLite';

/**
 * Procedural Svaraa Lite models and a lightweight turntable viewer.
 * Ported from the design team's interactive mockup; geometry and material
 * values are kept as designed. Everything is built in code, so there are no
 * model files to download.
 */

interface Layer extends THREE.Group {
  userData: { rest: number; exp: number; mats: THREE.MeshStandardMaterial[] };
}

interface AttachData {
  pend: THREE.Group;
  line: THREE.Mesh;
  baseY: number;
}

type Vec3 = [number, number, number];

const TWO_PI = Math.PI * 2;

export class LiteScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.05, 400);
  private readonly key: THREE.DirectionalLight;
  private readonly pivot = new THREE.Group();
  private readonly models: Record<LiteModel, THREE.Group>;
  private readonly pendant: THREE.Group;
  private readonly layers: Layer[] = [];
  private readonly attach: AttachData;
  private readonly envTexture: THREE.Texture;
  private readonly resizeObserver: ResizeObserver;
  private readonly cleanups: (() => void)[] = [];

  private readonly qFlat = new THREE.Quaternion();
  private readonly qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  private pendantTarget: THREE.Quaternion | null = null;
  private readonly box = new THREE.Box3();
  private readonly v1 = new THREE.Vector3();
  private readonly v2 = new THREE.Vector3();
  private readonly target = new THREE.Vector3(0, 1, 0);

  private active: THREE.Group | null = null;
  private shownId: string | null = null;
  private focusMats: THREE.MeshStandardMaterial[] = [];
  private explode = 0;
  private explodeTarget = 1;
  private spin = 0;
  private spinTarget = 0;
  private phiBase = 0.4;
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

    this.pendant = this.buildPendant(this.layers);
    const attach = this.buildAttach();
    this.attach = attach.data;
    this.models = {
      pendant: this.pendant,
      clip: this.buildClip(true),
      attach: attach.group,
      backplate: this.buildBackplate(),
      wristband: this.buildWristband(),
      lanyard: this.buildLanyard(),
      puck: this.buildPuck(),
      cable: this.buildCable(),
    };
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

    this.bindPointer();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  // ── public API ──────────────────────────────────────────────

  show(part: LitePart, explode: number) {
    this.explodeTarget = part.model === 'pendant' ? explode : 0;
    if (this.shownId === part.id) return;
    this.shownId = part.id;

    const model = this.models[part.model];
    if (this.active !== model) {
      if (this.active) this.active.visible = false;
      model.visible = true;
      this.active = model;
      this.pop = 0.86;
      if (part.model === 'pendant') this.pendant.quaternion.copy(part.upright ? this.qUp : this.qFlat);
    }
    if (part.model === 'pendant') this.pendantTarget = part.upright ? this.qUp : this.qFlat;

    // Turn the shortest way round to the part's preferred angle.
    const n = Math.round((this.spin - part.spin) / TWO_PI);
    this.spinTarget = part.spin + n * TWO_PI;
    this.phiBase = part.phi;
    this.setFocus(part.model === 'pendant' ? part.focus : null);
  }

  setExplode(value: number) {
    this.explodeTarget = value;
  }

  setAutoRotate(on: boolean) {
    this.auto = on;
  }

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
    this.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      disposed.add(o.geometry);
      const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
      for (const mat of mats) {
        disposed.add(mat);
        for (const value of Object.values(mat)) if (value instanceof THREE.Texture) disposed.add(value);
      }
    });
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
    const m = this.active;
    if (!m) return;

    this.explode += (this.explodeTarget - this.explode) * ease(4.5);
    for (const L of this.layers) L.position.y = L.userData.rest + (L.userData.exp - L.userData.rest) * this.explode;
    if (this.pendantTarget) this.pendant.quaternion.slerp(this.pendantTarget, ease(5));

    if (this.focusMats.length) {
      const glow = 0.16 + 0.12 * Math.sin(this.time * 3.2);
      for (const mat of this.focusMats) mat.emissiveIntensity = glow;
    }

    if (m === this.models.attach) this.animateAttach();

    if (this.auto && !this.drag) this.spinTarget += dt * 0.38;
    this.spin += (this.spinTarget - this.spin) * ease(4);

    // Measure the model and sit it on the floor, centred on the turntable.
    const pivot = this.pivot;
    pivot.rotation.y = 0;
    pivot.scale.setScalar(1);
    m.position.set(0, 0, 0);
    pivot.updateMatrixWorld(true);
    const box = this.box.setFromObject(m);
    const centre = box.getCenter(this.v1);
    const size = box.getSize(this.v2);
    m.position.set(-centre.x, -box.min.y, -centre.z);
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
    const dist = (this.fitRadius / Math.sin(Math.min(vf, hf) / 2)) * 1.06 * this.zoom;
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

  /** Loops the pendant lifting off and snapping back onto the clip. */
  private animateAttach() {
    const { pend, line, baseY } = this.attach;
    const p = (this.time * 0.32) % 1;
    let gap: number;
    if (p < 0.35) gap = 1.7;
    else if (p < 0.55) {
      const s = (p - 0.35) / 0.2;
      gap = 1.7 - 1.68 * s * s * s;
    } else if (p < 0.8) gap = 0.02;
    else {
      const s = (p - 0.8) / 0.2;
      gap = 0.02 + 1.68 * (s * s * (3 - 2 * s));
    }
    pend.position.y = baseY + gap;
    line.scale.y = Math.max(0.001, gap);
    line.position.y = baseY + gap / 2;
    line.visible = gap > 0.08;
  }

  private setFocus(list: readonly PendantLayer[] | null) {
    this.focusMats = [];
    for (const L of this.layers) {
      const on = !list || list.includes(L.name as PendantLayer);
      for (const mat of L.userData.mats) {
        if (mat.transparent !== !on) {
          mat.transparent = !on;
          mat.needsUpdate = true;
        }
        mat.opacity = on ? 1 : 0.18;
        mat.depthWrite = on;
        mat.emissive.setHex(0xe8a06a);
        mat.emissiveIntensity = 0;
        if (list && on) this.focusMats.push(mat);
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
    add(new THREE.BoxGeometry(40, 24, 40), new THREE.MeshBasicMaterial({ color: 0x5e534d, side: THREE.BackSide }));
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
      new THREE.MeshPhysicalMaterial({ color: 0xc8968b, roughness: 0.6, sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xf6dcd4), clearcoat: 0.06, side: THREE.DoubleSide }),
    roseLight: () =>
      new THREE.MeshPhysicalMaterial({ color: 0xddb4aa, roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color(0xf6dcd4), side: THREE.DoubleSide }),
    aub: () =>
      new THREE.MeshPhysicalMaterial({ color: 0x4e2a38, roughness: 0.68, sheen: 0.3, sheenColor: new THREE.Color(0x8a5a6a), side: THREE.DoubleSide }),
    gold: () => new THREE.MeshStandardMaterial({ color: 0xdba45f, metalness: 1, roughness: 0.26 }),
    metal: () => new THREE.MeshStandardMaterial({ color: 0xcdcfd4, metalness: 0.95, roughness: 0.24, side: THREE.DoubleSide }),
    dark: () => new THREE.MeshStandardMaterial({ color: 0x3a3a3e, metalness: 0.75, roughness: 0.4, side: THREE.DoubleSide }),
    black: () => new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.5, side: THREE.DoubleSide }),
    rubber: () => new THREE.MeshStandardMaterial({ color: 0x2a2a2d, roughness: 0.85 }),
    beige: () => new THREE.MeshStandardMaterial({ color: 0xdccdb7, roughness: 0.7, side: THREE.DoubleSide }),
    pcb: () => new THREE.MeshStandardMaterial({ color: 0x1d6a3e, roughness: 0.4, metalness: 0.1 }),
    cream: () =>
      new THREE.MeshPhysicalMaterial({ color: 0xeadfcf, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide }),
    kapton: () => new THREE.MeshStandardMaterial({ color: 0xd7a23a, roughness: 0.3, metalness: 0.2 }),
    pouch: () => new THREE.MeshStandardMaterial({ color: 0xc9cacf, roughness: 0.32, metalness: 0.65 }),
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

  /** Draws the pendant face: speaker crescent, gold lotus and button. Also renders its metal/roughness maps. */
  private drawFace(ctx: CanvasRenderingContext2D, mode: 'color' | 'metal' | 'rough') {
    const S = 1024;
    const c = 512;
    const pal = {
      color: { bg: '#4E2A38', line: '#E0A766', hole: '#22111A', btn: '#43212F' },
      metal: { bg: '#000000', line: '#ffffff', hole: '#000000', btn: '#000000' },
      rough: { bg: 'rgb(186,186,186)', line: 'rgb(64,64,64)', hole: 'rgb(235,235,235)', btn: 'rgb(150,150,150)' },
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
    for (let row = 0, y = 40; y < 300; y += 22, row++) {
      for (let x = (row % 2) * 11; x < S; x += 22) {
        const dx = x - c;
        const dy = c - y;
        const d = Math.hypot(dx, dy);
        if (d > 0.76 * R && d < 0.93 * R && Math.abs(Math.atan2(dx, dy)) < 0.62) {
          ctx.beginPath();
          ctx.arc(x, y, 5.5, 0, TWO_PI);
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
    ctx.arc(c, c, 110, 0, TWO_PI);
    ctx.stroke();
    ctx.fillStyle = pal.btn;
    ctx.beginPath();
    ctx.arc(c, c, 97, 0, TWO_PI);
    ctx.fill();
  }

  private finishLayer(L: THREE.Group, rest: number, exp: number): Layer {
    const mats: THREE.MeshStandardMaterial[] = [];
    L.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial && !mats.includes(o.material)) {
        mats.push(o.material);
      }
    });
    L.userData = { rest, exp, mats };
    L.position.y = rest;
    return L as Layer;
  }

  // ── models ──────────────────────────────────────────────────

  /** Builds the layered pendant. Pass a list to collect its explodable layers. */
  private buildPendant(collect?: Layer[]) {
    const M = this.mat;
    const group = new THREE.Group();
    const layers: Layer[] = [];
    const named = (name: PendantLayer) => Object.assign(new THREE.Group(), { name });

    // Silicone sleeve, enclosed magnets and rear charging contacts.
    const housing = named('housing');
    const rose = M.rose();
    housing.add(this.mesh(this.lathe([[0, 0], [1.85, 0], [2.12, 0.04], [2.28, 0.18], [2.35, 0.44], [2.32, 0.72], [2.27, 0.9], [2.2, 0.94], [2.14, 0.9], [2.12, 0.22], [2.0, 0.12], [0, 0.12]], 128), rose));
    const gold = M.gold();
    for (const x of [-0.28, 0.28]) housing.add(this.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32), gold, [x, -0.012, 1.0]));
    housing.add(this.mesh(new THREE.BoxGeometry(0.62, 0.14, 0.2), new THREE.MeshStandardMaterial({ color: 0x2a1a20, roughness: 0.8 }), [0, 0.74, -2.28]));
    const metal = M.metal();
    for (const x of [-0.9, 0.9]) housing.add(this.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.18, 40), metal, [x, 0.21, 0.3]));
    layers.push(this.finishLayer(housing, 0, 0));

    // Internal structure.
    const frame = named('frame');
    const beige = M.beige();
    frame.add(this.mesh(this.lathe([[1.7, 0], [2.06, 0], [2.06, 0.13], [1.7, 0.13], [1.7, 0]], 96), beige));
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      frame.add(this.mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.38, 20), beige, [Math.cos(a) * 1.86, 0.19, Math.sin(a) * 1.86]));
    }
    frame.add(this.mesh(new THREE.BoxGeometry(3.5, 0.06, 0.14), beige, [0, 0.03, -0.55]));
    frame.add(this.mesh(new THREE.BoxGeometry(3.5, 0.06, 0.14), beige, [0, 0.03, 0.95]));
    layers.push(this.finishLayer(frame, 0.13, 1.45));

    // Battery.
    const battery = named('battery');
    const bg = new THREE.ExtrudeGeometry(this.roundRect(2.7, 1.3, 0.24, new THREE.Shape()), {
      depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 10,
    });
    bg.center();
    bg.rotateX(-Math.PI / 2);
    battery.add(this.mesh(bg, M.pouch()));
    const kapton = M.kapton();
    for (const x of [-1.28, 1.28]) battery.add(this.mesh(new THREE.BoxGeometry(0.2, 0.4, 1.32), kapton, [x, 0, 0]));
    for (const z of [-0.3, 0.3]) battery.add(this.mesh(new THREE.BoxGeometry(0.3, 0.03, 0.16), metal, [1.5, 0.05, z]));
    layers.push(this.finishLayer(battery, 0.33, 2.55));

    // Vibration motor.
    const motor = named('motor');
    motor.add(this.mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.26, 48), M.metal()));
    motor.add(this.mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 48), M.black(), [0, -0.15, 0]));
    motor.add(this.mesh(new THREE.TorusGeometry(0.4, 0.02, 8, 48), M.dark(), [0, 0.13, 0], [Math.PI / 2, 0, 0]));
    layers.push(this.finishLayer(motor, 0.5, 3.45));

    // Electronics board.
    const pcb = named('pcb');
    pcb.add(this.mesh(new THREE.CylinderGeometry(2.02, 2.02, 0.07, 96), M.pcb()));
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
    const chip = (w: number, h: number, d: number, x: number, z: number, m: THREE.Material) =>
      pcb.add(this.mesh(new THREE.BoxGeometry(w, h, d), m, [x, top + h / 2, z]));
    chip(0.72, 0.1, 0.72, 0, -0.1, blk);
    pcb.add(this.mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshStandardMaterial({ map: btTex, roughness: 0.5 }), [0, top + 0.101, -0.1], [-Math.PI / 2, 0, 0]));
    chip(0.56, 0.08, 0.38, 0.95, 0.55, blk);
    chip(0.38, 0.08, 0.38, 1.05, -0.62, blk);
    pcb.add(this.mesh(new THREE.PlaneGeometry(0.24, 0.24), met, [1.05, top + 0.081, -0.62], [-Math.PI / 2, 0, 0]));
    chip(0.3, 0.13, 0.3, -1.45, -0.4, met);
    chip(0.3, 0.13, 0.3, 1.5, 0.25, met);
    chip(0.32, 0.16, 0.32, -1.05, -1.2, bei);
    chip(0.32, 0.16, 0.32, 1.15, -1.18, bei);
    chip(0.5, 0.08, 0.5, -0.95, 0.6, blk);
    chip(0.42, 0.08, 0.3, -0.2, 0.95, blk);
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
    for (let i = 0; i < 46; i++) {
      const a = rnd() * TWO_PI;
      const r = 0.55 + rnd() * 1.25;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < 0.5 && Math.abs(z + 0.1) < 0.5) continue;
      const w = 0.07 + rnd() * 0.12;
      const d = 0.05 + rnd() * 0.08;
      const pick = rnd();
      chip(w, 0.04 + rnd() * 0.04, d, x, z, pick < 0.5 ? blk : pick < 0.8 ? bei : pad);
    }
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * TWO_PI;
      pcb.add(this.mesh(new THREE.BoxGeometry(0.1, 0.012, 0.06), pad, [Math.cos(a) * 1.9, top + 0.006, Math.sin(a) * 1.9], [0, -a, 0]));
    }
    layers.push(this.finishLayer(pcb, 0.64, 4.3));

    // Speaker and membrane.
    const speaker = named('speaker');
    const dk = M.dark();
    speaker.add(this.mesh(this.lathe([[1.68, 0], [1.98, 0], [1.98, 0.16], [1.68, 0.16], [1.68, 0]], 96), dk));
    speaker.add(this.mesh(new THREE.TorusGeometry(1.62, 0.07, 12, 96), M.rubber(), [0, 0.15, 0], [Math.PI / 2, 0, 0]));
    speaker.add(this.mesh(this.lathe([[0.55, 0.2], [0.9, 0.17], [1.3, 0.14], [1.6, 0.13]], 96), M.black()));
    speaker.add(
      this.mesh(
        new THREE.SphereGeometry(1.32, 48, 16, 0, TWO_PI, 0, 0.43),
        new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.28, metalness: 0.3, side: THREE.DoubleSide }),
        [0, -1.0, 0],
      ),
    );
    speaker.add(this.mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.3, 48), dk, [0, -0.15, 0]));
    const tab = M.beige();
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      speaker.add(this.mesh(new THREE.BoxGeometry(0.36, 0.12, 0.26), tab, [Math.cos(a) * 2.08, 0.06, Math.sin(a) * 2.08], [0, -a, 0]));
    }
    layers.push(this.finishLayer(speaker, 0.72, 5.45));

    // Face and flush button.
    const face = named('face');
    const faceMap = this.canvasTexture(1024, 1024, (x) => this.drawFace(x, 'color'));
    faceMap.colorSpace = THREE.SRGBColorSpace;
    const faceMat = new THREE.MeshPhysicalMaterial({
      map: faceMap,
      metalnessMap: this.canvasTexture(1024, 1024, (x) => this.drawFace(x, 'metal')),
      metalness: 1,
      roughnessMap: this.canvasTexture(1024, 1024, (x) => this.drawFace(x, 'rough')),
      roughness: 1,
      sheen: 0.25,
      sheenColor: new THREE.Color(0x9a6a7a),
    });
    face.add(this.mesh(new THREE.CylinderGeometry(2.22, 2.24, 0.12, 128), M.aub(), [0, 0.06, 0]));
    face.add(this.mesh(new THREE.CircleGeometry(2.22, 128), faceMat, [0, 0.1205, 0], [-Math.PI / 2, 0, 0]));
    face.add(this.mesh(new THREE.CylinderGeometry(0.41, 0.42, 0.03, 64), new THREE.MeshPhysicalMaterial({ color: 0x42212e, roughness: 0.5, clearcoat: 0.2 }), [0, 0.136, 0]));
    layers.push(this.finishLayer(face, 0.84, 6.8));

    for (const L of layers) group.add(L);
    collect?.push(...layers);
    return group;
  }

  private buildClip(upright: boolean) {
    const M = this.mat;
    const g = new THREE.Group();
    const inner = new THREE.Group();
    const rose = M.rose();
    inner.add(this.mesh(this.lathe([[0, 0], [2.2, 0], [2.33, 0.05], [2.38, 0.16], [2.33, 0.27], [2.22, 0.31], [2.1, 0.31], [2.06, 0.27], [0, 0.27]], 128), rose));
    inner.add(this.mesh(new THREE.CircleGeometry(2.06, 128), M.aub(), [0, 0.272, 0], [-Math.PI / 2, 0, 0]));
    // Spring bridge and rear flap.
    inner.add(this.mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.1, 32, 1, true, Math.PI / 2, Math.PI), rose, [0, -0.17, -1.95], [0, 0, Math.PI / 2]));
    inner.add(this.mesh(this.lathe([[0, 0], [1.85, 0], [1.95, 0.035], [1.85, 0.07], [0, 0.07]], 96), rose, [0, -0.41, 0.15]));
    inner.add(this.mesh(new THREE.BoxGeometry(1.1, 0.07, 0.6), rose, [0, -0.37, -1.6]));
    if (upright) inner.rotation.x = Math.PI / 2;
    g.add(inner);
    return g;
  }

  private buildAttach(): { group: THREE.Group; data: AttachData } {
    const group = new THREE.Group();
    const clip = this.buildClip(false);
    clip.position.y = 0.41;
    group.add(clip);
    const pend = this.buildPendant();
    const baseY = 0.41 + 0.31 + 0.02;
    pend.position.y = baseY + 1.7;
    group.add(pend);
    const line = this.mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), [0, baseY, 0]);
    line.castShadow = false;
    group.add(line);
    // An invisible box keeps the framing steady while the pendant moves.
    const h = baseY + 1.7 + 1.05;
    group.add(this.mesh(new THREE.BoxGeometry(4.8, h, 4.8), new THREE.MeshBasicMaterial({ visible: false }), [0, h / 2, 0]));
    return { group, data: { pend, line, baseY } };
  }

  private buildBackplate() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x4a2834, roughness: 0.6, sheen: 0.35, sheenColor: new THREE.Color(0x9a6a7a), clearcoat: 0.1, side: THREE.DoubleSide });
    g.add(this.mesh(this.lathe([[0, 0], [1.9, 0], [2.0, 0.03], [2.03, 0.07], [1.99, 0.11], [1.9, 0.13], [0, 0.13]], 128), mat));
    g.add(this.mesh(new THREE.RingGeometry(1.2, 1.24, 96), new THREE.MeshStandardMaterial({ color: 0x5a3442, roughness: 0.5 }), [0, 0.1305, 0], [-Math.PI / 2, 0, 0]));
    return g;
  }

  private buildWristband() {
    const M = this.mat;
    const g = new THREE.Group();
    const weave = this.canvasTexture(
      64,
      64,
      (x) => {
        x.fillStyle = '#3E2135';
        x.fillRect(0, 0, 64, 64);
        for (let y = 0; y < 64; y += 4) {
          x.fillStyle = '#55304A';
          x.fillRect(0, y, 64, 2);
        }
        for (let xx = 0; xx < 64; xx += 8) {
          x.fillStyle = 'rgba(0,0,0,0.18)';
          x.fillRect(xx, 0, 1, 64);
        }
      },
      [90, 10],
    );
    weave.colorSpace = THREE.SRGBColorSpace;
    const bandMat = new THREE.MeshPhysicalMaterial({ map: weave, roughness: 0.85, sheen: 0.6, sheenColor: new THREE.Color(0x9c6a8a), side: THREE.DoubleSide });
    const bandWrap = new THREE.Group();
    bandWrap.add(this.mesh(this.lathe([[3.0, -0.62], [3.14, -0.62], [3.17, -0.58], [3.17, 0.58], [3.14, 0.62], [3.0, 0.62], [2.97, 0.58], [2.97, -0.58], [3.0, -0.62]], 180), bandMat));
    bandWrap.scale.set(1.25, 1, 0.78);
    g.add(bandWrap);
    const holder = new THREE.Group();
    holder.add(this.mesh(this.lathe([[0, 0], [1.15, 0], [1.36, 0.05], [1.46, 0.2], [1.43, 0.38], [1.31, 0.45], [1.19, 0.41], [1.13, 0.13], [0, 0.13]], 128), M.rose()));
    holder.add(this.mesh(new THREE.CircleGeometry(1.13, 96), M.roseLight(), [0, 0.132, 0], [-Math.PI / 2, 0, 0]));
    holder.rotation.x = Math.PI / 2;
    holder.position.set(0, 0, 3.17 * 0.78 - 0.04);
    g.add(holder);
    return g;
  }

  private braid(repeat: [number, number]) {
    const t = this.canvasTexture(
      128,
      32,
      (x) => {
        x.fillStyle = '#D8C0A5';
        x.fillRect(0, 0, 128, 32);
        x.lineCap = 'round';
        for (let i = -40; i < 170; i += 10) {
          x.strokeStyle = '#B4957A';
          x.lineWidth = 3;
          x.beginPath();
          x.moveTo(i, 0);
          x.lineTo(i + 18, 32);
          x.stroke();
          x.strokeStyle = '#EEDDC8';
          x.lineWidth = 2;
          x.beginPath();
          x.moveTo(i + 18, 0);
          x.lineTo(i, 32);
          x.stroke();
        }
        x.fillStyle = 'rgba(190,130,120,0.55)';
        for (let i = 0; i < 128; i += 16) x.fillRect(i + 3, 10, 3, 3);
      },
      repeat,
    );
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.82, sheen: 0.5, sheenColor: new THREE.Color(0xffffff) });
  }

  private buildLanyard() {
    const g = new THREE.Group();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * TWO_PI;
      pts.push(new THREE.Vector3(4.6 * Math.cos(t), 0.2 + 0.14 * Math.sin(3 * t), 1.5 * Math.sin(t) + 0.35 * Math.sin(2 * t)));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    g.add(this.mesh(new THREE.TubeGeometry(curve, 520, 0.085, 12, true), this.braid([200, 1])));
    const rose = this.mat.rose();
    // Sliding toggle.
    const tp = curve.getPoint(0.5);
    const toggle = this.mesh(new THREE.CapsuleGeometry(0.22, 0.5, 8, 24), rose, [tp.x, tp.y, tp.z]);
    this.orientAlong(toggle, curve.getTangent(0.5));
    g.add(toggle);
    // Breakaway clasp.
    const cp = curve.getPoint(0.02);
    const sh = this.roundRect(0.62, 0.86, 0.28, new THREE.Shape());
    sh.holes.push(this.roundRect(0.26, 0.48, 0.12, new THREE.Path()));
    const cg = new THREE.ExtrudeGeometry(sh, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 12 });
    cg.center();
    const clasp = this.mesh(cg, rose, [cp.x, cp.y, cp.z]);
    this.orientAlong(clasp, curve.getTangent(0.02), new THREE.Vector3(0, 0, 1));
    g.add(clasp);
    const bp = curve.getPoint(0.42);
    const bead = this.mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.22, 24), rose, [bp.x, bp.y, bp.z]);
    this.orientAlong(bead, curve.getTangent(0.42));
    g.add(bead);
    return g;
  }

  private buildPlug() {
    const M = this.mat;
    const g = new THREE.Group();
    const hg = new THREE.ExtrudeGeometry(this.roundRect(0.9, 0.44, 0.2, new THREE.Shape()), {
      depth: 1.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 10,
    });
    g.add(this.mesh(hg, M.rose(), [0, 0, 0.25]));
    g.add(this.mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.4, 24), M.rose(), [0, 0, 0.1], [Math.PI / 2, 0, 0]));
    const sg = new THREE.ExtrudeGeometry(this.roundRect(0.8, 0.26, 0.13, new THREE.Shape()), { depth: 0.6, bevelEnabled: false, curveSegments: 12 });
    g.add(this.mesh(sg, M.metal(), [0, 0, 1.38]));
    const slot = new THREE.ExtrudeGeometry(this.roundRect(0.62, 0.1, 0.05, new THREE.Shape()), { depth: 0.02, bevelEnabled: false, curveSegments: 8 });
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
