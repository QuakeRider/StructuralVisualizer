import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ZONE_TEMPERATURES, depthOfTemperature, seededRandom, zonePosition } from '../domain/faultRocks.js';
import { HALF, VIEW, overlayArrow, toWorld } from './earthBlock.js';
import { drawSlab } from './faultRockTexture.js';
import { formatLength } from './FaultGrowthScene.js';
import { Arrow3D, Label } from './sceneKit.js';

const RAD = Math.PI / 180;
const ZONE_VIEW = { position: new THREE.Vector3(5.3, 3.9, 6.5), target: new THREE.Vector3(0, -1.05, 0) };
const DIM = 0.32;

/** Pixel classes of the painted outcrop faces. */
const CLASS = { host: 0, foot: 1, hanging: 2, core: 3, lens: 4 };
const CLASS_REFS = ['host', 'damage-fw', 'damage-hw', 'core', 'lens'];

/** Which painted classes each highlight ref keeps lit (empty: only the lines drawn over the faces). */
const LIT_CLASSES = {
  host: [CLASS.host],
  'damage-fw': [CLASS.foot],
  'damage-hw': [CLASS.hanging],
  'damage-zone': [CLASS.foot, CLASS.hanging],
  core: [CLASS.core, CLASS.lens],
  lens: [CLASS.lens],
  'slip-surface': [],
  fractures: [],
  'deformation-bands': [],
  scanline: [],
  'damage-edge': [CLASS.foot, CLASS.hanging],
  'zone-width': [CLASS.foot, CLASS.hanging, CLASS.core, CLASS.lens],
};

const GRANITE = [[167, 156, 144], [201, 191, 178], [125, 113, 105], [58, 54, 52]];
const SANDSTONE = [[217, 196, 154], [199, 174, 130], [227, 211, 174], [185, 154, 107]];
const CORE = { base: [74, 67, 60], clast: [140, 129, 116] };
const THIN_CORE = [96, 90, 84];
const DAMAGE_TINT = [230, 159, 0];
const ZONE_COLORS = {
  'zone-incohesive': [217, 196, 154],
  'zone-cataclasite': [70, 62, 56],
  'zone-quartz': [86, 180, 233],
  'zone-mylonite': [154, 140, 255],
};
/** Short names for the zones as labeled in the crustal block. */
const ZONE_LABELS = {
  'zone-incohesive': 'loose gouge and breccia',
  'zone-cataclasite': 'cataclasites',
  'zone-quartz': 'mylonites (quartz flows)',
  'zone-mylonite': 'mylonites (feldspar flows too)',
};
const ISOTHERMS = [
  { temperature: ZONE_TEMPERATURES.cohesive, label: '100 °C' },
  { temperature: ZONE_TEMPERATURES.quartz, label: '300 °C' },
  { temperature: ZONE_TEMPERATURES.feldspar, label: '450 °C' },
];

/** A cheap repeatable hash of two integers in [0, 1). */
function hash(i, j) {
  const value = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function blend(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * The five visible faces of the block. Each maps texture coordinates (s, t)
 * in [0, 1] (t = 1 at the top of its canvas) linearly to NED metres, given
 * the block's width S and depth H, and back again.
 */
const FACES = [
  { id: 'top', size: [512, 512], ned: (s, t, S) => ({ x: -S / 2 + t * S, y: -S / 2 + s * S, z: 0 }), st: (p, S) => [(p.y + S / 2) / S, (p.x + S / 2) / S] },
  { id: 'south', size: [512, 256], ned: (s, t, S, H) => ({ x: -S / 2, y: -S / 2 + s * S, z: (1 - t) * H }), st: (p, S, H) => [(p.y + S / 2) / S, 1 - p.z / H] },
  { id: 'north', size: [512, 256], ned: (s, t, S, H) => ({ x: S / 2, y: S / 2 - s * S, z: (1 - t) * H }), st: (p, S, H) => [(S / 2 - p.y) / S, 1 - p.z / H] },
  { id: 'east', size: [512, 256], ned: (s, t, S, H) => ({ x: -S / 2 + s * S, y: S / 2, z: (1 - t) * H }), st: (p, S, H) => [(p.x + S / 2) / S, 1 - p.z / H] },
  { id: 'west', size: [512, 256], ned: (s, t, S, H) => ({ x: S / 2 - s * S, y: -S / 2, z: (1 - t) * H }), st: (p, S, H) => [(S / 2 - p.x) / S, 1 - p.z / H] },
];

/**
 * Fault zones and fault rocks (B11), in the NED frame. Three setups:
 * 'outcrop', an opaque block whose faces are painted from the fault-zone
 * model (host rock, damage zones, core, strands, lenses, fracture traces or
 * deformation bands, and a scanline); 'sample', a slab of fault rock drawn
 * from its clast-size distribution; and 'crust', a crustal block with the
 * fault-rock zones by depth. Scene refs: ZONE_SCENE_REFS in sceneRefs.js.
 */
export class FaultZoneScene {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.model = null;
    this.highlightRef = null;
    this.hoverRef = null;
    this.view = '3d';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.copy(ZONE_VIEW.position);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Block of rock around a fault zone: the host rock, fractured damage zones, and the fault core, painted on the block’s faces.');
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 24;
    this.controls.target.copy(ZONE_VIEW.target);
    this.userMoved = false;
    this.controls.addEventListener('start', () => { this.userMoved = true; });
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2e36, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 7, 5);
    this.scene.add(key);

    this.createBlock();
    this.createSample();
    this.createOverlays();
    this.bindPointerEvents();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  /* ---------- Construction ---------- */

  createBlock() {
    this.blockGroup = new THREE.Group();
    this.faces = FACES.map((face) => {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = face.size;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, side: THREE.DoubleSide }));
      mesh.userData.face = face;
      this.blockGroup.add(mesh);
      return { ...face, canvas, texture, mesh, classes: new Uint8Array(face.size[0] * face.size[1]) };
    });
    const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * HALF.x, 2 * HALF.y, 2 * HALF.z));
    this.blockEdges = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: 0xd8dde4, transparent: true, opacity: 0.5 }));
    this.blockEdges.position.set(0, -HALF.y, 0);
    this.blockGroup.add(this.blockEdges);
    this.scene.add(this.blockGroup);
  }

  createSample() {
    this.sampleCanvas = document.createElement('canvas');
    this.sampleTexture = new THREE.CanvasTexture(this.sampleCanvas);
    this.sampleTexture.colorSpace = THREE.SRGBColorSpace;
    this.sampleTexture.anisotropy = 8;
    const side = new THREE.MeshStandardMaterial({ color: 0x3a332d, roughness: 1 });
    this.slabTop = new THREE.MeshStandardMaterial({ map: this.sampleTexture, roughness: 0.8 });
    this.slabSize = { x: 3.8, y: 0.28, z: 2.28 };
    this.slab = new THREE.Mesh(new THREE.BoxGeometry(this.slabSize.x, this.slabSize.y, this.slabSize.z), [side, side, this.slabTop, side, side, side]);
    this.slab.position.set(0, -0.9, 0);
    this.sampleGroup = new THREE.Group();
    this.sampleGroup.add(this.slab);
    this.fieldBar = overlayArrow({ color: 0xc3c8d0, radius: 0.012, head: false });
    this.fieldLabel = new Label('#c3c8d0', 0.04);
    this.sampleGroup.add(this.fieldBar.group, this.fieldLabel.sprite);
    this.sampleGroup.visible = false;
    this.scene.add(this.sampleGroup);
  }

  createOverlays() {
    this.labelGroup = new THREE.Group();
    this.labels = {};
    const labels = {
      core: ['fault core', '#f4f5f7'],
      'damage-fw': ['footwall damage zone', '#f0b84a'],
      'damage-hw': ['hanging-wall damage zone', '#f0b84a'],
      host: ['host rock', '#f4f5f7'],
      'slip-surface': ['slip surface', '#f4f5f7'],
      lens: ['fault lens', '#f4f5f7'],
      scanline: ['scanline', '#56b4e9'],
      'flow-along': ['water: along the fault', '#56b4e9'],
      'flow-across': ['across: blocked', '#cc79a7'],
    };
    for (const [ref, [text, color]] of Object.entries(labels)) {
      const label = new Label(color, 0.036);
      label.setParts([[text]]);
      label.sprite.visible = false;
      this.labels[ref] = label;
      this.labelGroup.add(label.sprite);
    }
    this.zoneLabels = Array.from({ length: 4 }, () => new Label('#f4f5f7', 0.036));
    this.isothermLabels = ISOTHERMS.map(() => new Label('#f0e442', 0.034));
    for (const label of [...this.zoneLabels, ...this.isothermLabels]) {
      label.sprite.visible = false;
      this.labelGroup.add(label.sprite);
    }
    this.scene.add(this.labelGroup);

    this.compass = new THREE.Group();
    const origin = new THREE.Vector3();
    for (const [name, direction, axis] of [['N', { x: 1, y: 0, z: 0 }, 'x'], ['E', { x: 0, y: 1, z: 0 }, 'y'], ['D', { x: 0, y: 0, z: 1 }, 'z']]) {
      const arrow = new Arrow3D({ color: 0xc3c8d0, radius: 0.018, headLength: 0.16, headRadius: 0.06 });
      arrow.set(origin, origin.clone().add(toWorld(direction).multiplyScalar(0.75)));
      const label = new Label('#c3c8d0', 0.042);
      label.setParts([[name], [` (${axis})`, 'var']]);
      label.sprite.position.copy(origin.clone().add(toWorld(direction).multiplyScalar(1.12)));
      this.compass.add(arrow.group, label.sprite);
    }
    this.compass.position.set(-HALF.x - 0.45, 0.25, HALF.z + 0.2);
    this.scene.add(this.compass);
    this.scaleBar = overlayArrow({ color: 0xc3c8d0, radius: 0.012, head: false });
    this.scaleLabel = new Label('#c3c8d0', 0.036);
    this.scene.add(this.scaleBar.group, this.scaleLabel.sprite);

    // Flow arrows on the outcrop surface (steps 9 and 10).
    this.flowGroup = new THREE.Group();
    this.flowAlong = [0, 1].map(() => overlayArrow({ color: 0x56b4e9, radius: 0.03, headLength: 0.16, headRadius: 0.075 }));
    this.flowAcross = [0, 1].map(() => overlayArrow({ color: 0xcc79a7, radius: 0.03, head: false }));
    this.flowStops = [0, 1].map(() => overlayArrow({ color: 0xcc79a7, radius: 0.035, head: false }));
    for (const arrow of [...this.flowAlong, ...this.flowAcross, ...this.flowStops]) this.flowGroup.add(arrow.group);
    this.flowGroup.visible = false;
    this.scene.add(this.flowGroup);
  }

  /* ---------- Geometry helpers ---------- */

  get size() {
    return this.model?.size ?? 40;
  }

  /** NED metres → world, for the block: S across and S/2 deep. */
  world(point) {
    return toWorld(point).multiplyScalar((2 * HALF.x) / this.size);
  }

  toNedPoint(world) {
    const scale = this.size / (2 * HALF.x);
    return { x: -world.z * scale, y: world.x * scale, z: -world.y * scale };
  }

  layoutFaces() {
    const S = this.size;
    const H = S / 2;
    for (const face of this.faces) {
      const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([s, t]) => this.world(face.ned(s, t, S, H)));
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(corners.flatMap((p) => [p.x, p.y, p.z]), 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      geometry.computeVertexNormals();
      face.mesh.geometry.dispose();
      face.mesh.geometry = geometry;
    }
  }

  /** NED point → canvas pixel on a face. */
  facePixel(face, point) {
    const S = this.size;
    const [s, t] = face.st(point, S, S / 2);
    return [s * face.size[0], (1 - t) * face.size[1]];
  }

  /** The two points where the plane at signed distance d from the fault's center plane crosses a face, in pixels (or null). */
  faceLine(face, d) {
    const S = this.size;
    const H = S / 2;
    const [w, h] = face.size;
    const dip = this.model.zone.dip * RAD;
    const dAt = (px, py) => {
      const p = face.ned((px + 0.5) / w, 1 - (py + 0.5) / h, S, H);
      return p.y * Math.sin(dip) - p.z * Math.cos(dip) - d;
    };
    const corners = [[0, 0], [w, 0], [w, h], [0, h]];
    const points = [];
    for (let index = 0; index < 4; index += 1) {
      const a = corners[index];
      const b = corners[(index + 1) % 4];
      const va = dAt(...a);
      const vb = dAt(...b);
      if (va === 0) points.push(a);
      else if (va * vb < 0) {
        const t = va / (va - vb);
        points.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return points.length >= 2 ? points.slice(0, 2) : null;
  }

  /** Fault lenses: less-crushed rock between two strands, lens-shaped along strike and down the dip. */
  lensShapes() {
    const { zone, strands, lenses } = this.model;
    if (!(strands >= 2) || !lenses) return [];
    const positions = this.strandPositions();
    const S = this.size;
    const presets = [{ u: -0.18 * S, w: 0.14 * S, lu: 0.3 * S, lw: 0.28 * S }, { u: -0.4 * S, w: 0.42 * S, lu: 0.22 * S, lw: 0.3 * S }];
    return presets.slice(0, lenses).map((preset, index) => {
      const pair = index % (positions.length - 1);
      const spacing = positions[pair + 1] - positions[pair];
      return { ...preset, d: (positions[pair] + positions[pair + 1]) / 2, h: spacing * 0.42, dip: zone.dip };
    });
  }

  /** Signed distances of the slip surfaces (strands) from the core's center plane. */
  strandPositions() {
    const { zone, strands } = this.model;
    const count = Math.max(strands ?? 1, 1);
    if (zone.core <= 0) return [0];
    if (count === 1) return [-zone.core / 2 + 0.15 * zone.core];
    return Array.from({ length: count }, (_, index) => -zone.core / 2 + zone.core * (0.12 + (0.76 * index) / (count - 1)));
  }

  classifyOutcrop(point, lenses) {
    const zone = this.model.zone;
    const position = zonePosition(zone, point.y, point.z);
    if (position.part === 'core') {
      const dip = zone.dip * RAD;
      const w = point.y * Math.cos(dip) + point.z * Math.sin(dip);
      for (const lens of lenses) {
        const r = ((position.d - lens.d) / lens.h) ** 2 + ((point.x - lens.u) / lens.lu) ** 2 + ((w - lens.w) / lens.lw) ** 2;
        if (r < 1) return { cls: CLASS.lens, position };
      }
      return { cls: CLASS.core, position };
    }
    return { cls: position.part === 'host' ? CLASS.host : position.part === 'hanging' ? CLASS.hanging : CLASS.foot, position };
  }

  /* ---------- Painting ---------- */

  hostColor(point, position, px, py) {
    const model = this.model;
    if (model.host === 'porous') {
      // Sandstone beds; the hanging wall has moved down the dip by the slip.
      const throwDown = position.d > 0 ? model.slip * Math.sin(model.zone.dip * RAD) : 0;
      const bed = this.size / 10;
      const depth = point.z - throwDown;
      const index = Math.floor(depth / bed);
      const within = depth - index * bed;
      const color = SANDSTONE[((index % 4) + 4) % 4];
      const grain = 0.94 + hash(px, py) * 0.1;
      return within < bed * 0.05 ? color.map((value) => value * 0.62) : color.map((value) => value * grain);
    }
    const r = hash(px * 0.7, py * 0.7);
    const color = r < 0.6 ? GRANITE[0] : r < 0.8 ? GRANITE[1] : r < 0.93 ? GRANITE[2] : GRANITE[3];
    return color;
  }

  paintOutcropFace(face) {
    const model = this.model;
    const S = this.size;
    const H = S / 2;
    const [w, h] = face.size;
    const context = face.canvas.getContext('2d');
    const image = context.createImageData(w, h);
    const lit = this.highlightRef && LIT_CLASSES[this.highlightRef] ? new Set(LIT_CLASSES[this.highlightRef]) : null;
    const lenses = this.lensShapes();
    const thinCore = model.zone.core < 0.2;
    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        const point = face.ned((px + 0.5) / w, 1 - (py + 0.5) / h, S, H);
        const { cls, position } = this.classifyOutcrop(point, lenses);
        face.classes[py * w + px] = cls;
        let color;
        if (cls === CLASS.core) {
          if (thinCore) color = THIN_CORE;
          else {
            const clast = hash(Math.floor(px / 3), Math.floor(py / 3)) > 0.62;
            color = clast ? CORE.clast.map((value) => value * (0.85 + hash(px, py) * 0.25)) : CORE.base.map((value) => value * (0.9 + hash(py, px) * 0.2));
          }
        } else {
          color = this.hostColor(point, position, px, py);
          if (cls === CLASS.foot || cls === CLASS.hanging) color = blend(color, DAMAGE_TINT, 0.2);
          if (cls === CLASS.lens) color = color.map((value) => value * 0.86);
        }
        const factor = lit && !lit.has(cls) ? DIM : 1;
        image.data.set([color[0] * factor, color[1] * factor, color[2] * factor, 255], (py * w + px) * 4);
      }
    }
    context.putImageData(image, 0, 0);
    this.outlineLenses(face, context);
    if (!model.lineOnly) this.paintTraces(face, context);
    this.paintZoneLines(face, context);
    if (face.id === 'top' && model.scanline) this.paintScanline(face, context);
    face.texture.needsUpdate = true;
  }

  outlineLenses(face, context) {
    const [w, h] = face.size;
    const lensDim = this.highlightRef && LIT_CLASSES[this.highlightRef] && !LIT_CLASSES[this.highlightRef].includes(CLASS.lens);
    context.fillStyle = lensDim ? 'rgba(244, 245, 247, 0.3)' : '#f4f5f7';
    for (let py = 1; py < h - 1; py += 1) {
      for (let px = 1; px < w - 1; px += 1) {
        const index = py * w + px;
        if (face.classes[index] !== CLASS.lens) continue;
        if (face.classes[index - 1] !== CLASS.lens || face.classes[index + 1] !== CLASS.lens || face.classes[index - w] !== CLASS.lens || face.classes[index + w] !== CLASS.lens) context.fillRect(px, py, 1.4, 1.4);
      }
    }
  }

  /** Fracture traces (crystalline host) or deformation bands (porous host), kept out of the core. */
  paintTraces(face, context) {
    const model = this.model;
    const traces = model.traces;
    if (!traces) return;
    const porous = model.host === 'porous';
    const lit = !this.highlightRef || ['fractures', 'deformation-bands', 'damage-zone', 'damage-fw', 'damage-hw', 'host', 'damage-edge'].includes(this.highlightRef);
    context.save();
    // Clip out the core: the face minus the band |d| ≤ core/2.
    const edges = [this.faceLine(face, -model.zone.core / 2), this.faceLine(face, model.zone.core / 2)];
    context.beginPath();
    context.rect(0, 0, face.size[0], face.size[1]);
    if (edges[0] && edges[1] && model.zone.core > 0) {
      const [a, b] = edges[0];
      const [c, d] = edges[1];
      context.moveTo(...a);
      context.lineTo(...b);
      // Join the lines in the order that makes a simple quadrilateral.
      const cross = Math.hypot(b[0] - c[0], b[1] - c[1]) < Math.hypot(b[0] - d[0], b[1] - d[1]);
      if (cross) { context.lineTo(...c); context.lineTo(...d); } else { context.lineTo(...d); context.lineTo(...c); }
      context.closePath();
    }
    context.clip('evenodd');
    context.strokeStyle = porous ? `rgba(246, 240, 226, ${lit ? 0.95 : 0.3})` : `rgba(28, 25, 23, ${lit ? 0.95 : 0.3})`;
    context.lineWidth = porous ? 2.2 : 1.5;
    context.lineCap = 'round';
    context.beginPath();
    const segments = face.id === 'top'
      ? traces.top.map((trace) => [{ x: trace.n1, y: trace.e1, z: 0 }, { x: trace.n2, y: trace.e2, z: 0 }])
      : face.id === 'south' || face.id === 'north'
        ? traces.section.map((trace) => [{ x: face.id === 'south' ? -this.size / 2 : this.size / 2, y: trace.e1, z: trace.z1 }, { x: face.id === 'south' ? -this.size / 2 : this.size / 2, y: trace.e2, z: trace.z2 }])
        : (face.id === 'east' ? traces.strikeEast : traces.strikeWest).map((trace) => [{ x: trace.n1, y: face.id === 'east' ? this.size / 2 : -this.size / 2, z: trace.z1 }, { x: trace.n2, y: face.id === 'east' ? this.size / 2 : -this.size / 2, z: trace.z2 }]);
    for (const [a, b] of segments) {
      if (face.id === 'east' || face.id === 'west') {
        const middle = { x: (a.x + b.x) / 2, y: a.y, z: (a.z + b.z) / 2 };
        if (zonePosition(model.zone, middle.y, middle.z).part === 'core') continue;
      }
      context.moveTo(...this.facePixel(face, a));
      context.lineTo(...this.facePixel(face, b));
    }
    context.stroke();
    context.restore();
  }

  paintZoneLines(face, context) {
    const model = this.model;
    const zone = model.zone;
    const ref = this.highlightRef;
    const draw = (d, { color, width, dash = [], alpha = 1 }) => {
      const line = this.faceLine(face, d);
      if (!line) return;
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = color;
      context.lineWidth = width;
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(...line[0]);
      context.lineTo(...line[1]);
      context.stroke();
      context.restore();
    };
    const dimmed = (refs) => (ref && !refs.includes(ref) ? 0.3 : 1);
    const edgeAlpha = dimmed(['damage-zone', 'damage-fw', 'damage-hw', 'damage-edge', 'zone-width']);
    if (!model.lineOnly && zone.footwall > 0) draw(-zone.core / 2 - zone.footwall, { color: '#e69f00', width: 2.4, dash: [9, 7], alpha: edgeAlpha });
    if (!model.lineOnly && zone.hangingWall > 0) draw(zone.core / 2 + zone.hangingWall, { color: '#e69f00', width: 2.4, dash: [9, 7], alpha: edgeAlpha });
    if (model.strands > 0) {
      const alpha = dimmed(['slip-surface', 'core']);
      this.strandPositions().forEach((d, index) => draw(d, { color: '#f4f5f7', width: model.lineOnly ? 2 : index === 0 ? 3 : 2.2, alpha }));
    }
  }

  paintScanline(face, context) {
    const model = this.model;
    const { north, crossings } = model.scanline;
    const alpha = this.highlightRef && this.highlightRef !== 'scanline' ? 0.35 : 1;
    const S = this.size;
    const [x0, y0] = this.facePixel(face, { x: north, y: -S / 2, z: 0 });
    const [x1] = this.facePixel(face, { x: north, y: S / 2, z: 0 });
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = '#11141a';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y0);
    context.stroke();
    context.strokeStyle = '#56b4e9';
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = '#56b4e9';
    for (const east of crossings) {
      if (zonePosition(model.zone, east, 0).part === 'core') continue;
      const [x] = this.facePixel(face, { x: north, y: east, z: 0 });
      context.fillRect(x - 1.5, y0 - 7, 3, 14);
    }
    context.restore();
  }

  /** Crustal block: host crust, isotherms, and the fault zone colored by fault rock (width exaggerated). */
  paintCrustFace(face) {
    const model = this.model;
    const S = this.size;
    const H = S / 2;
    const [w, h] = face.size;
    const context = face.canvas.getContext('2d');
    const image = context.createImageData(w, h);
    const dip = 60 * RAD;
    const ref = this.highlightRef;
    const zoneRefs = model.zones.map((zone) => zone.id);
    const quartz = model.zones[2].top;
    const feldspar = model.zones[3].top;
    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        const point = face.ned((px + 0.5) / w, 1 - (py + 0.5) / h, S, H);
        const km = point.z / 1000;
        const d = point.y * Math.sin(dip) - point.z * Math.cos(dip);
        const half = crustHalfWidth(km, quartz, feldspar) * 1000;
        let color;
        let cls = 'host';
        if (Math.abs(d) <= half) {
          const zone = model.zones.find((candidate) => km >= candidate.top && km < candidate.bottom) ?? model.zones.at(-1);
          cls = zone.id;
          color = ZONE_COLORS[zone.id];
          // Texture: foliation bands in the mylonite zones, dots in the loose zone.
          if (zone.id === 'zone-quartz' || zone.id === 'zone-mylonite') color = color.map((value) => value * (0.82 + 0.18 * Math.sin(d / 90)));
          if (zone.id === 'zone-incohesive' && hash(px, py) > 0.8) color = color.map((value) => value * 0.7);
        } else {
          const shade = 1 - Math.min(km / 40, 1) * 0.35;
          color = [139 * shade, 134 * shade, 128 * shade].map((value) => value * (0.95 + hash(px, py) * 0.08));
        }
        const lit = !ref || ref === cls || (ref === 'fault-zone' && cls !== 'host') || !['host', 'fault-zone', ...zoneRefs].includes(ref);
        const factor = lit ? 1 : DIM;
        image.data.set([color[0] * factor, color[1] * factor, color[2] * factor, 255], (py * w + px) * 4);
      }
    }
    context.putImageData(image, 0, 0);
    if (face.id !== 'top') {
      // Isotherms: lines of constant depth.
      context.save();
      context.setLineDash([10, 6]);
      context.lineWidth = 2.2;
      context.strokeStyle = `rgba(240, 228, 66, ${ref && ref !== 'gradient' && ref !== 'isotherms' ? 0.35 : 0.95})`;
      for (const { temperature } of ISOTHERMS) {
        const z = depthOfTemperature(temperature, model.gradient, model.surface) * 1000;
        if (z >= H) continue;
        const y = (z / H) * h;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(w, y);
        context.stroke();
      }
      context.restore();
      // Earthquakes nucleate in the cataclasite zone (stars), not in the loose rock above or the flowing rock below.
      if (face.id === 'south' || face.id === 'north') {
        const zone = model.zones[1];
        const random = seededRandom(9);
        context.fillStyle = `rgba(240, 122, 60, ${ref && ref !== 'zone-cataclasite' && ref !== 'earthquakes' ? 0.3 : 1})`;
        for (let index = 0; index < 7; index += 1) {
          const km = zone.top + (0.15 + 0.7 * random()) * (zone.bottom - zone.top);
          if (km * 1000 >= H) continue;
          const z = km * 1000;
          const east = (z * Math.cos(dip)) / Math.sin(dip) + (random() - 0.5) * 600;
          const [x, y] = this.facePixel(face, { x: face.id === 'south' ? -S / 2 : S / 2, y: east, z });
          drawStar(context, x, y, 6.5);
        }
      }
    }
    face.texture.needsUpdate = true;
  }

  classifyCrust(point) {
    const model = this.model;
    const km = point.z / 1000;
    const dip = 60 * RAD;
    const d = point.y * Math.sin(dip) - point.z * Math.cos(dip);
    const half = crustHalfWidth(km, model.zones[2].top, model.zones[3].top) * 1000;
    if (Math.abs(d) > half) return 'host';
    return (model.zones.find((zone) => km >= zone.top && km < zone.bottom) ?? model.zones.at(-1)).id;
  }

  paintSample() {
    const model = this.model;
    this.sampleInfo = drawSlab(this.sampleCanvas, model.slab, { cohesive: model.cohesive, foliated: model.foliated, melt: model.melt, highlight: this.highlightRef, scale: 2 });
    // A resized canvas needs a new texture.
    if (this.sampleTexture.image?.width !== this.sampleCanvas.width || this.sampleTexture.userData.size !== `${this.sampleCanvas.width}x${this.sampleCanvas.height}`) {
      this.sampleTexture.dispose();
      this.sampleTexture = new THREE.CanvasTexture(this.sampleCanvas);
      this.sampleTexture.colorSpace = THREE.SRGBColorSpace;
      this.sampleTexture.anisotropy = 8;
      this.sampleTexture.userData.size = `${this.sampleCanvas.width}x${this.sampleCanvas.height}`;
      this.slabTop.map = this.sampleTexture;
      this.slabTop.needsUpdate = true;
    }
    this.sampleTexture.needsUpdate = true;
  }

  /* ---------- Updates ---------- */

  update() {
    const model = this.model;
    if (!model) return;
    const sample = model.setup === 'sample';
    this.blockGroup.visible = !sample;
    this.sampleGroup.visible = sample;
    this.compass.visible = !sample;
    this.scaleBar.group.visible = !sample;
    this.scaleLabel.sprite.visible = !sample;
    for (const label of Object.values(this.labels)) label.sprite.visible = false;
    for (const label of [...this.zoneLabels, ...this.isothermLabels]) label.sprite.visible = false;
    this.flowGroup.visible = false;
    if (sample) {
      this.paintSample();
      this.updateSampleOverlays();
      return;
    }
    this.layoutFaces();
    for (const face of this.faces) {
      if (model.setup === 'crust') this.paintCrustFace(face);
      else this.paintOutcropFace(face);
    }
    this.updateBlockOverlays();
  }

  repaint() {
    if (!this.model) return;
    if (this.model.setup === 'sample') this.paintSample();
    else for (const face of this.faces) (this.model.setup === 'crust' ? this.paintCrustFace(face) : this.paintOutcropFace(face));
  }

  updateSampleOverlays() {
    const { x, y, z } = this.slabSize;
    const top = this.slab.position.y + y / 2;
    const from = new THREE.Vector3(-x / 2, top, z / 2 + 0.22);
    const to = new THREE.Vector3(x / 2, top, z / 2 + 0.22);
    this.fieldBar.set(from, to);
    this.fieldLabel.setParts([[`${formatMillimetres(this.model.field)} across`]]);
    this.fieldLabel.sprite.position.copy(from.clone().add(to).multiplyScalar(0.5)).add(new THREE.Vector3(0, -0.02, 0.2));
  }

  updateBlockOverlays() {
    const model = this.model;
    const S = this.size;
    const lift = new THREE.Vector3(0, 0.14, 0);
    const south = this.world({ x: -S / 2, y: -S / 2, z: S / 2 }).add(new THREE.Vector3(0, 0, 0.3));
    const southEnd = this.world({ x: -S / 2, y: S / 2, z: S / 2 }).add(new THREE.Vector3(0, 0, 0.3));
    this.scaleBar.set(south, southEnd);
    this.scaleLabel.setParts([[model.setup === 'crust' ? `${formatLength(S)} (fault zone drawn wider than true)` : formatLength(S)]]);
    this.scaleLabel.sprite.position.copy(south.clone().add(southEnd).multiplyScalar(0.5)).add(new THREE.Vector3(0, -0.16, 0.1));

    if (model.setup === 'crust') {
      const H = S / 2;
      model.zones.forEach((zone, index) => {
        const label = this.zoneLabels[index];
        const top = zone.top * 1000;
        const bottom = Math.min(zone.bottom * 1000, H);
        if (top >= H - 200) return;
        const z = (top + bottom) / 2;
        const east = (z * Math.cos(60 * RAD)) / Math.sin(60 * RAD) - crustHalfWidth(z / 1000, model.zones[2].top, model.zones[3].top) * 1000 - 1200;
        label.setParts([[ZONE_LABELS[zone.id]]]);
        label.sprite.visible = model.labels !== false;
        label.sprite.position.copy(this.world({ x: -S / 2, y: east, z })).add(new THREE.Vector3(0, 0, 0.08));
        label.sprite.center.set(1, 0.5);
      });
      ISOTHERMS.forEach(({ temperature, label: text }, index) => {
        const label = this.isothermLabels[index];
        const z = depthOfTemperature(temperature, model.gradient, model.surface) * 1000;
        if (z >= H) return;
        label.setParts([[text]]);
        label.sprite.visible = true;
        label.sprite.position.copy(this.world({ x: -S / 2, y: -S / 2, z })).add(new THREE.Vector3(0.06, 0.08, 0.05));
        label.sprite.center.set(0, 0.5);
      });
      return;
    }

    const zone = model.zone;
    const sinDip = Math.sin(zone.dip * RAD);
    const cosDip = Math.cos(zone.dip * RAD);
    const H = S / 2;
    const onTop = (north, east) => this.world({ x: north, y: east, z: 0 }).add(lift);
    // In map view the labels sit on the outcrop surface; otherwise on the south face, where the zone is seen in section.
    const onSouth = (d, depth) => {
      const east = Math.min(Math.max((d + depth * cosDip) / sinDip, -0.47 * S), 0.47 * S);
      return this.world({ x: -S / 2, y: east, z: depth }).add(new THREE.Vector3(0, 0, 0.06));
    };
    const map = this.view === 'map';
    if (model.labels) {
      const place = (ref, position) => {
        this.labels[ref].sprite.visible = true;
        this.labels[ref].sprite.position.copy(position);
      };
      const fwMiddle = -(zone.core / 2 + zone.footwall / 2);
      const hwMiddle = zone.core / 2 + zone.hangingWall / 2;
      if (zone.core > 0 && !model.lineOnly) place('core', map ? onTop(0.36 * S, 0) : onSouth(0, 0.18 * H));
      if (zone.footwall > 0 && !model.lineOnly) place('damage-fw', map ? onTop(0.18 * S, fwMiddle / sinDip) : onSouth(fwMiddle, 0.42 * H));
      if (zone.hangingWall > 0 && !model.lineOnly) place('damage-hw', map ? onTop(0.28 * S, hwMiddle / sinDip) : onSouth(hwMiddle, 0.62 * H));
      place('host', map ? onTop(-0.3 * S, -0.4 * S) : this.world({ x: -0.1 * S, y: S / 2, z: 0.5 * H }).add(new THREE.Vector3(0.06, 0, 0)));
      if (model.strands > 0) place('slip-surface', map ? onTop(-0.4 * S, this.strandPositions()[0] / sinDip) : onSouth(this.strandPositions()[0], 0.84 * H));
      const lens = this.lensShapes()[0];
      if (lens && Math.abs(lens.w) < lens.lw * 0.9) place('lens', onTop(lens.u, lens.d / sinDip));
    }
    if (model.scanline) {
      this.labels.scanline.sprite.visible = true;
      this.labels.scanline.sprite.position.copy(onTop(model.scanline.north, -0.44 * S)).add(new THREE.Vector3(0, 0.05, 0));
    }
    this.updateFlow();
  }

  updateFlow() {
    const model = this.model;
    const flow = model.flow;
    this.flowGroup.visible = Boolean(flow);
    if (!flow) return;
    const S = this.size;
    const zone = model.zone;
    const sinDip = Math.sin(zone.dip * RAD);
    const at = (north, east) => this.world({ x: north, y: east, z: 0 }).add(new THREE.Vector3(0, 0.05, 0));
    const hwMiddle = (zone.core / 2 + zone.hangingWall / 2) / sinDip;
    const fwMiddle = -(zone.core / 2 + zone.footwall / 2) / sinDip;
    const along = flow === 'crystalline';
    this.flowAlong.forEach((arrow, index) => {
      arrow.group.visible = along;
      const east = index ? hwMiddle : fwMiddle;
      arrow.set(at(-0.34 * S, east), at(0.1 * S, east));
    });
    // Across: water coming from the west (and, in sandstone, from the east) stops where it meets the barrier.
    const barrier = flow === 'crystalline' ? zone.core / 2 / sinDip : (zone.core / 2 + Math.max(zone.footwall, zone.hangingWall)) / sinDip;
    const sides = flow === 'crystalline' ? [-1] : [-1, 1];
    this.flowAcross.forEach((arrow, index) => {
      const side = sides[index];
      arrow.group.visible = side !== undefined;
      this.flowStops[index].group.visible = side !== undefined;
      if (side === undefined) return;
      const north = -0.18 * S + index * 0.04 * S;
      const stop = side * (flow === 'crystalline' ? barrier : barrier + 0.4);
      arrow.set(at(north, side * 0.46 * S), at(north, stop - side * 0.3));
      this.flowStops[index].set(at(north - 0.05 * S, stop - side * 0.3), at(north + 0.05 * S, stop - side * 0.3));
    });
    this.labels['flow-along'].sprite.visible = along && model.labels;
    this.labels['flow-along'].sprite.position.copy(at(0.14 * S, hwMiddle)).add(new THREE.Vector3(0, 0.12, 0));
    this.labels['flow-across'].sprite.visible = model.labels;
    this.labels['flow-across'].sprite.position.copy(at(-0.34 * S, -0.2 * S)).add(new THREE.Vector3(0, 0.12, 0));
  }

  /* ---------- Hover and highlight ---------- */

  bindPointerEvents() {
    this.renderer.domElement.addEventListener('pointermove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.setHoverRef(this.refUnderPointer());
    });
    this.renderer.domElement.addEventListener('pointerleave', () => this.setHoverRef(null));
  }

  refUnderPointer() {
    const model = this.model;
    if (!model) return null;
    if (model.setup === 'sample') {
      const hit = this.raycaster.intersectObject(this.slab, false).find((candidate) => candidate.face?.materialIndex === 2);
      if (!hit?.uv) return null;
      const slab = model.slab;
      const i = Math.min(Math.floor(hit.uv.x * slab.nx), slab.nx - 1);
      const j = Math.min(Math.floor((1 - hit.uv.y) * slab.ny), slab.ny - 1);
      const vein = this.sampleInfo;
      if (vein && Math.abs(j - vein.middle) < vein.thickness / 2 + 1) return 'melt-vein';
      const largest = slab.polygons[0];
      if (largest && insideOutline(largest, i + 0.5, j + 0.5)) return 'largest-clast';
      return slab.cells[j * slab.nx + i] === 0 ? 'matrix' : 'fragments';
    }
    const hit = this.raycaster.intersectObjects(this.faces.map((face) => face.mesh), false)[0];
    if (!hit) return null;
    const point = this.toNedPoint(hit.point);
    if (model.setup === 'crust') return this.classifyCrust(point);
    const face = hit.object.userData.face;
    const [px, py] = this.facePixel(face, point);
    if (face.id === 'top' && model.scanline && Math.abs(point.x - model.scanline.north) < this.size * 0.012) return 'scanline';
    const zone = model.zone;
    const position = zonePosition(zone, point.y, point.z);
    const tolerance = this.size / 512 * 3;
    if (model.strands > 0 && this.strandPositions().some((d) => Math.abs(position.d - d) < tolerance)) return 'slip-surface';
    const faceData = this.faces.find((candidate) => candidate.id === face.id);
    const cls = faceData.classes[Math.floor(py) * face.size[0] + Math.floor(px)] ?? CLASS.host;
    return CLASS_REFS[cls];
  }

  setHoverRef(ref) {
    if (ref === this.hoverRef) return;
    this.hoverRef = ref;
    this.onHover?.(ref);
  }

  highlight(ref) {
    if (ref === this.highlightRef) return;
    this.highlightRef = ref;
    for (const [labelRef, label] of Object.entries(this.labels)) label.sprite.material.opacity = !ref || labelRef === ref || (ref === 'damage-zone' && labelRef.startsWith('damage')) ? 1 : 0.3;
    for (const arrow of this.flowAlong) for (const part of [arrow.shaft, arrow.head]) part.material.opacity = !ref || ref === 'flow-along' ? 1 : 0.25;
    for (const arrow of [...this.flowAcross, ...this.flowStops]) for (const part of [arrow.shaft, arrow.head]) part.material.opacity = !ref || ref === 'flow-across' ? 1 : 0.25;
    this.repaint();
  }

  /* ---------- State, camera, render loop ---------- */

  /**
   * model: { setup: 'outcrop', size, zone { core, footwall, hangingWall, dip, law },
   * strands, lenses, host, slip, traces { top, section, strikeEast, strikeWest } | null,
   * scanline { north, crossings } | null, flow, labels, lineOnly } |
   * { setup: 'sample', slab, field, cohesive, foliated, melt } |
   * { setup: 'crust', size, gradient, surface, zones, labels }.
   */
  setState(model) {
    const resize = this.model?.setup !== model.setup || this.model?.size !== model.size;
    this.model = model;
    this.update();
    if (resize && !this.userMoved) this.resetCamera();
  }

  setView(view) {
    this.view = view;
    this.userMoved = false;
    if (this.model && this.model.setup !== 'sample') this.updateBlockOverlays();
    this.resetCamera();
  }

  resetCamera() {
    this.userMoved = false;
    const factor = Math.max(1, 1.3 / Math.max(this.camera.aspect, 0.1));
    let position = ZONE_VIEW.position.clone().sub(ZONE_VIEW.target).multiplyScalar(factor).add(ZONE_VIEW.target);
    let target = ZONE_VIEW.target.clone();
    if (this.model?.setup === 'sample') {
      target = new THREE.Vector3(0, -0.8, 0);
      position = this.view === 'map' ? new THREE.Vector3(0, 6.6 * factor, 0.02) : new THREE.Vector3(0, 3.6 * factor, 4.4 * factor);
    } else if (this.view === 'map') {
      target = new THREE.Vector3(0, -0.5, 0);
      position = new THREE.Vector3(0, 8.4 * factor, 0.02);
    } else if (this.view === 'section') {
      target = new THREE.Vector3(0, -HALF.y, 0);
      position = new THREE.Vector3(0, -HALF.y + 0.4, 8.6 * factor);
    }
    this.camera.position.copy(position);
    this.camera.up.copy(VIEW.up);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (width > 1 && height > 1 && !this.userMoved) this.resetCamera();
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

/** Half-width (km) of the crustal fault zone as drawn: narrow where rock breaks, wider where it flows (illustrative). */
export function crustHalfWidth(km, quartzTop, feldsparTop) {
  if (km < quartzTop) return 0.45;
  if (km < feldsparTop) return 0.45 + ((km - quartzTop) / Math.max(feldsparTop - quartzTop, 1e-6)) * 1.2;
  return 1.65 + Math.min((km - feldsparTop) * 0.12, 1);
}

function drawStar(context, x, y, radius) {
  context.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
    const r = index % 2 ? radius * 0.45 : radius;
    context[index ? 'lineTo' : 'moveTo'](x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  context.closePath();
  context.fill();
}

function insideOutline(polygon, x, y) {
  const vertices = polygon.vertices;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const a = { x: polygon.cx + vertices[i].x, y: polygon.cy + vertices[i].y };
    const b = { x: polygon.cx + vertices[j].x, y: polygon.cy + vertices[j].y };
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** 100 → "100 mm", 6 → "6 mm", 0.5 → "0.5 mm". */
export function formatMillimetres(value) {
  return `${Number(value.toFixed(value >= 10 ? 0 : 1))} mm`;
}
