import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { faultFrame, kinematicAxes } from '../domain/faults.js';
import { lineVector, planePole, planeUpwardNormal } from '../domain/orientation.js';
import { applyTensor } from '../domain/tensor.js';
import { BOX_MAX, BOX_MIN, CENTER, HALF, VIEW, axisWorld, boxSection, exitDistance, fanGeometry, groundTexture, layerTexture, overlayArrow, toWorld } from './earthBlock.js';
import { Arrow3D, Label } from './sceneKit.js';

/** Metres per world unit: the block is 1000 m across and 500 m deep. */
export const METERS_PER_UNIT = 250;
/** Beds in the layer texture, each 62.5 m thick; the texture spans 750 m of rock. */
const LAYER_COUNT = 12;
const LAYER_SPAN = 3;
const DIMMED_OPACITY_FACTOR = 0.14;
/** World units per MPa for the traction arrows. */
const TRACTION_SCALE = 1 / 70;
/** Length of the unit vectors 𝐧 and 𝐬̂ in the P/T construction (world units). */
const UNIT_LENGTH = 0.8;

const COLORS = {
  sigma1: 0xf07a3c,
  sigma2: 0xf0e442,
  sigma3: 0x56b4e9,
  fault: 0xd9b27c,
  pole: 0xf4f5f7,
  slip: 0x3fd0a0,
  strikeSlip: 0xf0e442,
  dipSlip: 0x56b4e9,
  rake: 0x9a8cff,
  guide: 0xb1b7c2,
  separation: 0xcc79a7,
  dike: 0x2e323b,
  dikeTrace: 0xf4f5f7,
  well: 0xf4f5f7,
  traction: 0xe69f00,
  shearStress: 0xcc79a7,
  p: 0x9a8cff,
  t: 0xcc79a7,
  b: 0xc3c8d0,
  compass: 0xc3c8d0,
};

const CSS = {
  sigma1: '#f07a3c',
  sigma2: '#f0e442',
  sigma3: '#56b4e9',
  fault: '#d9b27c',
  pole: '#f4f5f7',
  slip: '#3fd0a0',
  strikeSlip: '#f0e442',
  dipSlip: '#56b4e9',
  rake: '#9a8cff',
  guide: '#c3c8d0',
  separation: '#cc79a7',
  well: '#f4f5f7',
  traction: '#e69f00',
  shearStress: '#cc79a7',
  p: '#9a8cff',
  t: '#cc79a7',
  b: '#c3c8d0',
  wall: '#f4f5f7',
  compass: '#c3c8d0',
};

const GLYPHS = {
  sigma1: { radius: 0.07, length: 1.15, pattern: 'solid', head: 0.3, headRadius: 0.16 },
  sigma2: { radius: 0.05, length: 0.85, pattern: 'dashed', head: 0.24, headRadius: 0.12 },
  sigma3: { radius: 0.035, length: 0.55, pattern: 'dotted', head: 0.2, headRadius: 0.09 },
};

/** A point in NED metres (origin on the ground above the block center) → world. */
export function nedPointToWorld(point) {
  return toWorld(point).multiplyScalar(1 / METERS_PER_UNIT);
}

/**
 * A box of rock between `min` and `max` (world), whose rock has moved by
 * `shift` from where it formed. Texture coordinates come from the rock's own
 * position, so beds and the ground grid travel with the block. The top shows
 * the ground where it is the rock's original surface and the beds where
 * erosion has cut below it. Faces: +x, −x, +y (top), −y, +z, −z.
 */
function rockBoxGeometry(min, max, shift, groundTop) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const bedV = (y) => 1 + (y - shift.y) / LAYER_SPAN;
  const faces = [
    { normal: [1, 0, 0], corners: [[max.x, min.y, max.z], [max.x, min.y, min.z], [max.x, max.y, min.z], [max.x, max.y, max.z]], u: (p) => -(p[2] - shift.z) / 4 },
    { normal: [-1, 0, 0], corners: [[min.x, min.y, min.z], [min.x, min.y, max.z], [min.x, max.y, max.z], [min.x, max.y, min.z]], u: (p) => (p[2] - shift.z) / 4 },
    { normal: [0, 1, 0], corners: [[min.x, max.y, max.z], [max.x, max.y, max.z], [max.x, max.y, min.z], [min.x, max.y, min.z]], top: true },
    { normal: [0, -1, 0], corners: [[min.x, min.y, min.z], [max.x, min.y, min.z], [max.x, min.y, max.z], [min.x, min.y, max.z]], u: () => 0.5 },
    { normal: [0, 0, 1], corners: [[min.x, min.y, max.z], [max.x, min.y, max.z], [max.x, max.y, max.z], [min.x, max.y, max.z]], u: (p) => (p[0] - shift.x) / 4 },
    { normal: [0, 0, -1], corners: [[max.x, min.y, min.z], [min.x, min.y, min.z], [min.x, max.y, min.z], [max.x, max.y, min.z]], u: (p) => -(p[0] - shift.x) / 4 },
  ];
  const geometry = new THREE.BufferGeometry();
  faces.forEach((face, index) => {
    const base = positions.length / 3;
    for (const corner of face.corners) {
      positions.push(...corner);
      normals.push(...face.normal);
      if (face.top && groundTop) uvs.push((corner[0] - shift.x + 2) / 4, (-(corner[2] - shift.z) + 2) / 4);
      else if (face.top) uvs.push(0.5, bedV(corner[1]));
      else uvs.push(face.u(corner), bedV(corner[1]));
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    geometry.addGroup(index * 6, 6, index);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

function boxEdges(min, max) {
  const c = (x, y, z) => new THREE.Vector3(x ? max.x : min.x, y ? max.y : min.y, z ? max.z : min.z);
  const points = [];
  for (const [a, b] of [
    [[0, 0, 0], [1, 0, 0]], [[0, 1, 0], [1, 1, 0]], [[0, 0, 1], [1, 0, 1]], [[0, 1, 1], [1, 1, 1]],
    [[0, 0, 0], [0, 1, 0]], [[1, 0, 0], [1, 1, 0]], [[0, 0, 1], [0, 1, 1]], [[1, 0, 1], [1, 1, 1]],
    [[0, 0, 0], [0, 0, 1]], [[1, 0, 0], [1, 0, 1]], [[0, 1, 0], [0, 1, 1]], [[1, 1, 0], [1, 1, 1]],
  ]) points.push(c(...a), c(...b));
  return new THREE.BufferGeometry().setFromPoints(points);
}

/** A closed polyline drawn as thick cylinders (WebGL lines are one pixel wide), optionally clipped. */
class TraceLoop {
  constructor(color, radius, { clippingPlanes = [], overlay = false, count = 8 } = {}) {
    this.radius = radius;
    this.material = new THREE.MeshBasicMaterial({ color, transparent: true, clippingPlanes, depthTest: !overlay });
    this.group = new THREE.Group();
    this.meshes = Array.from({ length: count }, () => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1), this.material);
      mesh.renderOrder = overlay ? 13 : 7;
      this.group.add(mesh);
      return mesh;
    });
  }

  set(points, closed = true) {
    const segments = closed ? points.length : points.length - 1;
    this.meshes.forEach((mesh, index) => {
      mesh.visible = index < segments && points.length > 1;
      if (!mesh.visible) return;
      const a = points[index];
      const b = points[(index + 1) % points.length];
      const direction = b.clone().sub(a);
      const length = direction.length();
      if (length < 1e-6) {
        mesh.visible = false;
        return;
      }
      mesh.scale.set(this.radius, length + this.radius, this.radius);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    });
  }
}

/**
 * Slickenlines on a fault surface (illustrative): grooves along u (the slip
 * direction) and small steps that rise gently along +u and then drop, so the
 * surface feels smooth when rubbed the way the missing block moved.
 */
function slickenTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#c29f68';
  context.fillRect(0, 0, size, size);
  let y = 0;
  let seed = 7;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  while (y < size) {
    const width = 1 + random() * 2.5;
    context.fillStyle = random() > 0.5 ? 'rgba(70, 52, 30, 0.75)' : 'rgba(255, 240, 205, 0.55)';
    context.fillRect(0, y, size, width);
    y += width + 3 + random() * 7;
  }
  for (let index = 0; index < 9; index += 1) {
    const x0 = random() * (size - 60);
    const y0 = random() * (size - 16);
    const gradient = context.createLinearGradient(x0, 0, x0 + 44, 0);
    gradient.addColorStop(0, 'rgba(255, 246, 220, 0)');
    gradient.addColorStop(1, 'rgba(255, 246, 220, 0.95)');
    context.fillStyle = gradient;
    context.fillRect(x0, y0, 44, 12);
    context.fillStyle = 'rgba(35, 25, 15, 0.95)';
    context.fillRect(x0 + 44, y0, 4, 12);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Fault-kinematics laboratory (B8) in the NED frame. A fault splits the
 * block into a footwall and a hanging wall; the hanging wall moves by the
 * slip vector 𝐬 (component box: strike-slip and dip-slip parts, rake λ). A
 * dike marks separation on the map and in section, a vertical well crosses
 * the fault, and slickenlines line the fault surface. Given a stress state it
 * draws the principal axes and the traction whose shear part sets the slip
 * (Wallace–Bott). The kinematic axes appear as P (converging arrows), T
 * (diverging), and B, built from 𝐧 and 𝐬̂. Two block modes: 'moved' shows
 * the hanging wall displaced; 'cut' keeps both walls inside the original
 * block, eroded flat, like a map and cross-sections of faulted rock.
 * Scene refs: see FAULT_SCENE_REFS in sceneRefs.js.
 */
export class FaultScene {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.defaultOptions = {
      blockMode: 'moved',
      showHangingWall: true,
      showWallLabels: false,
      showPole: false,
      showSlipVector: true,
      showComponents: false,
      showRake: false,
      showStress: false,
      showTraction: false,
      showKinematic: false,
      showConstruction: false,
      showSlickenlines: false,
      showSeparation: false,
      showDike: false,
      showWell: false,
    };
    this.options = { ...this.defaultOptions };
    this.plane = { strike: 0, dip: 60, dipDirection: 90 };
    this.slip = null;
    this.slipLength = 200;
    this.axes = null;
    this.tensor = null;
    this.marker = null;
    this.well = null;
    this.slipTarget = 0;
    this.slipAmount = 0;
    this.highlightRef = null;
    this.hoverRef = null;
    this.view = '3d';
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.copy(VIEW.position);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Faulted block of crust in the north–east–down frame: the hanging wall, the footwall, and the slip vector on the fault.');
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 24;
    this.controls.target.copy(VIEW.target);
    this.camera.lookAt(VIEW.target);
    this.userMoved = false;
    this.controls.addEventListener('start', () => { this.userMoved = true; });
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2e36, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(4, 7, 5);
    this.scene.add(key);

    this.clipPlanes = { hanging: new THREE.Plane(), foot: new THREE.Plane() };
    this.createBlock();
    this.createCompass();
    this.createStressGlyphs();
    this.createFaultSurface();
    this.createDike();
    this.createVectors();
    this.createKinematicAxes();
    this.createWell();
    this.bindPointerEvents();
    this.update();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  createBlock() {
    const beds = layerTexture(LAYER_COUNT);
    const ground = groundTexture();
    const makeWall = (plane) => {
      const side = new THREE.MeshStandardMaterial({ map: beds, roughness: 0.9, clippingPlanes: [plane], side: THREE.DoubleSide });
      const groundTop = new THREE.MeshStandardMaterial({ map: ground, roughness: 0.95, clippingPlanes: [plane], side: THREE.DoubleSide });
      const bedTop = new THREE.MeshStandardMaterial({ map: beds, roughness: 0.9, clippingPlanes: [plane], side: THREE.DoubleSide });
      const bottom = new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1, clippingPlanes: [plane], side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), [side, side, groundTop, bottom, side, side]);
      const outline = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xd8dde4, transparent: true, opacity: 0.55, clippingPlanes: [plane] }));
      const group = new THREE.Group();
      group.add(mesh, outline);
      this.scene.add(group);
      return { group, mesh, outline, materials: { side, groundTop, bedTop, bottom } };
    };
    this.footwall = makeWall(this.clipPlanes.foot);
    this.hangingWall = makeWall(this.clipPlanes.hanging);
    const wallLabel = (text) => {
      const label = new Label(CSS.wall, 0.046);
      label.setParts([[text]]);
      this.scene.add(label.sprite);
      return label;
    };
    this.footwall.label = wallLabel('footwall');
    this.hangingWall.label = wallLabel('hanging wall');
  }

  createCompass() {
    const origin = new THREE.Vector3(-HALF.x - 0.9, 0, HALF.z + 0.5);
    const group = new THREE.Group();
    for (const [name, direction, axis] of [['N', { x: 1, y: 0, z: 0 }, 'x'], ['E', { x: 0, y: 1, z: 0 }, 'y'], ['D', { x: 0, y: 0, z: 1 }, 'z']]) {
      const arrow = new Arrow3D({ color: COLORS.compass, radius: 0.018, headLength: 0.16, headRadius: 0.06 });
      arrow.set(origin, origin.clone().add(toWorld(direction).multiplyScalar(0.75)));
      const label = new Label(CSS.compass, 0.042);
      label.setParts([[name], [` (${axis})`, 'var']]);
      label.sprite.position.copy(origin.clone().add(toWorld(direction).multiplyScalar(1.12)));
      group.add(arrow.group, label.sprite);
    }
    this.scene.add(group);
  }

  createStressGlyphs() {
    this.glyphs = {};
    for (const [key, glyph] of Object.entries(GLYPHS)) {
      const arrows = [0, 1].map(() => new Arrow3D({ color: COLORS[key], radius: glyph.radius, headLength: glyph.head, headRadius: glyph.headRadius, pattern: glyph.pattern, period: 0.16 }));
      const label = new Label(CSS[key], 0.055);
      label.setParts([['σ', 'var'], [key.slice(-1), 'nsub']]);
      const group = new THREE.Group();
      group.add(...arrows.map((arrow) => arrow.group), label.sprite);
      this.scene.add(group);
      this.glyphs[key] = { arrows, label, group };
    }
  }

  createFaultSurface() {
    this.slickenMap = slickenTexture();
    const material = new THREE.MeshStandardMaterial({ color: COLORS.fault, roughness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    this.faultMesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.faultMesh.renderOrder = 5;
    this.faultTrace = new TraceLoop(COLORS.fault, 0.02);
    this.faultGroup = new THREE.Group();
    this.faultGroup.add(this.faultMesh, this.faultTrace.group);
    this.scene.add(this.faultGroup);
  }

  createDike() {
    const makePart = (plane) => {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: COLORS.dike, roughness: 0.8, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, clippingPlanes: [plane] }));
      mesh.renderOrder = 4;
      const trace = new TraceLoop(COLORS.dikeTrace, 0.03, { clippingPlanes: [plane] });
      return { mesh, trace };
    };
    this.dikeParts = [makePart(this.clipPlanes.foot), makePart(this.clipPlanes.hanging)];
    this.dikeGroup = new THREE.Group();
    for (const part of this.dikeParts) this.dikeGroup.add(part.mesh, part.trace.group);
    this.scene.add(this.dikeGroup);
    // Separation arrows: one on the map (the eroded top) and one on the section face.
    this.separationArrows = [0, 1].map(() => overlayArrow({ color: COLORS.separation, radius: 0.034, headLength: 0.18, headRadius: 0.09 }));
    this.separationLabel = new Label(CSS.separation, 0.046);
    this.separationLabel.setParts([['separation']]);
    this.separationGroup = new THREE.Group();
    this.separationGroup.add(...this.separationArrows.map((arrow) => arrow.group), this.separationLabel.sprite);
    this.scene.add(this.separationGroup);
  }

  createVectors() {
    const label = (color, parts) => {
      const sprite = new Label(color, 0.05);
      sprite.setParts(parts);
      return sprite;
    };
    const group = (...objects) => {
      const result = new THREE.Group();
      result.add(...objects);
      this.scene.add(result);
      return result;
    };
    this.slipArrow = overlayArrow({ color: COLORS.slip, radius: 0.04, headLength: 0.2, headRadius: 0.1 });
    this.slipLabel = label(CSS.slip, [['s', 'vec']]);
    this.slipGroup = group(this.slipArrow.group, this.slipLabel.sprite);
    this.strikeArrow = overlayArrow({ color: COLORS.strikeSlip, radius: 0.03, headLength: 0.16, headRadius: 0.08, pattern: 'dashed', period: 0.12 });
    this.strikeLabel = label(CSS.strikeSlip, [['s', 'var'], ['strike', 'sub']]);
    this.strikeGroup = group(this.strikeArrow.group, this.strikeLabel.sprite);
    this.dipArrow = overlayArrow({ color: COLORS.dipSlip, radius: 0.03, headLength: 0.16, headRadius: 0.08, pattern: 'dotted', period: 0.1 });
    this.dipLabel = label(CSS.dipSlip, [['s', 'var'], ['dip', 'sub']]);
    this.dipGroup = group(this.dipArrow.group, this.dipLabel.sprite);
    this.strikeLine = overlayArrow({ color: COLORS.guide, radius: 0.012, head: false, pattern: 'dashed', period: 0.14 });
    this.strikeLineLabel = new Label(CSS.guide, 0.036);
    this.strikeLineLabel.setParts([['strike']]);
    this.rakeArc = new TraceLoop(COLORS.rake, 0.018, { overlay: true, count: 40 });
    this.rakeLabel = label(CSS.rake, [['λ', 'var']]);
    this.rakeGroup = group(this.strikeLine.group, this.strikeLineLabel.sprite, this.rakeArc.group, this.rakeLabel.sprite);
    this.poleArrow = overlayArrow({ color: COLORS.pole, radius: 0.024, headLength: 0.16, headRadius: 0.07 });
    this.poleLabel = label(CSS.pole, [['n', 'vec']]);
    this.poleGroup = group(this.poleArrow.group, this.poleLabel.sprite);
    this.unitSlipArrow = overlayArrow({ color: COLORS.slip, radius: 0.024, headLength: 0.16, headRadius: 0.07 });
    this.unitSlipLabel = label(CSS.slip, [['ŝ', 'vec']]);
    this.unitSlipGroup = group(this.unitSlipArrow.group, this.unitSlipLabel.sprite);
    this.tractionArrow = overlayArrow({ color: COLORS.traction, radius: 0.04, headLength: 0.2, headRadius: 0.1 });
    this.tractionLabel = label(CSS.traction, [['t', 'vec']]);
    this.tractionGroup = group(this.tractionArrow.group, this.tractionLabel.sprite);
    this.shearArrow = overlayArrow({ color: COLORS.shearStress, radius: 0.03, headLength: 0.18, headRadius: 0.085, pattern: 'dashed', period: 0.12 });
    this.shearLabel = label(CSS.shearStress, [['τ', 'vec']]);
    this.shearGroup = group(this.shearArrow.group, this.shearLabel.sprite);
  }

  createKinematicAxes() {
    const label = (color, text) => {
      const sprite = new Label(color, 0.058);
      sprite.setParts([[text, 'var']]);
      return sprite;
    };
    const pair = (color, radius) => [0, 1].map(() => overlayArrow({ color, radius, headLength: 0.2, headRadius: 0.09 }));
    this.pArrows = pair(COLORS.p, 0.04);
    this.tArrows = pair(COLORS.t, 0.04);
    this.pLabel = label(CSS.p, 'P');
    this.tLabel = label(CSS.t, 'T');
    this.bLine = overlayArrow({ color: COLORS.b, radius: 0.016, head: false, pattern: 'dashed', period: 0.14 });
    this.bLabel = label(CSS.b, 'B');
    this.pGroup = new THREE.Group();
    this.pGroup.add(...this.pArrows.map((arrow) => arrow.group), this.pLabel.sprite);
    this.tGroup = new THREE.Group();
    this.tGroup.add(...this.tArrows.map((arrow) => arrow.group), this.tLabel.sprite);
    this.bGroup = new THREE.Group();
    this.bGroup.add(this.bLine.group, this.bLabel.sprite);
    // Construction: from the tip of 𝐧, a step along +𝐬̂ reaches P, a step along −𝐬̂ reaches T.
    this.constructionP = overlayArrow({ color: COLORS.p, radius: 0.012, head: false, pattern: 'dashed', period: 0.1 });
    this.constructionT = overlayArrow({ color: COLORS.t, radius: 0.012, head: false, pattern: 'dashed', period: 0.1 });
    this.pGroup.add(this.constructionP.group);
    this.tGroup.add(this.constructionT.group);
    this.scene.add(this.pGroup, this.tGroup, this.bGroup);
  }

  createWell() {
    this.wellShaft = overlayArrow({ color: COLORS.well, radius: 0.026, head: false });
    const rig = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 4, 1, true), new THREE.MeshBasicMaterial({ color: COLORS.well, wireframe: true, transparent: true }));
    this.wellRig = rig;
    this.wellCrossing = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.fault, transparent: true, depthTest: false }));
    this.wellCrossing.renderOrder = 14;
    this.wellLabel = new Label(CSS.well, 0.046);
    this.wellLabel.setParts([['well']]);
    this.wellGroup = new THREE.Group();
    this.wellGroup.add(this.wellShaft.group, rig, this.wellCrossing, this.wellLabel.sprite);
    this.scene.add(this.wellGroup);
  }

  bindPointerEvents() {
    this.renderer.domElement.addEventListener('pointermove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.reportHover();
    });
    this.renderer.domElement.addEventListener('pointerleave', () => this.setHoverRef(null));
  }

  reportHover() {
    const arrows = (ref, ...list) => list.flatMap((arrow) => [[ref, arrow.shaft], [ref, arrow.head]]);
    const candidates = [
      ...['sigma1', 'sigma2', 'sigma3'].flatMap((key) => arrows(`sigma-${key.slice(-1)}`, ...this.glyphs[key].arrows)),
      ...arrows('slip', this.slipArrow, this.unitSlipArrow),
      ...arrows('strike-slip', this.strikeArrow),
      ...arrows('dip-slip', this.dipArrow),
      ...arrows('pole', this.poleArrow),
      ...arrows('traction', this.tractionArrow),
      ...arrows('shear-stress', this.shearArrow),
      ...arrows('p-axis', ...this.pArrows),
      ...arrows('t-axis', ...this.tArrows),
      ...arrows('b-axis', this.bLine),
      ...arrows('separation', ...this.separationArrows),
      ...arrows('well', this.wellShaft),
      ...this.rakeArc.meshes.map((mesh) => ['rake', mesh]),
      ['fault', this.faultMesh],
      ...this.dikeParts.map((part) => ['dike', part.mesh]),
      ['hanging-wall', this.hangingWall.mesh],
      ['footwall', this.footwall.mesh],
    ].filter(([, object]) => {
      let visible = object.visible;
      object.traverseAncestors((ancestor) => { if (!ancestor.visible) visible = false; });
      return visible;
    });
    const hits = this.raycaster.intersectObjects(candidates.map(([, object]) => object), false);
    // Clipped block faces still intersect rays; keep only hits on the kept side of each wall.
    const hit = hits.find((candidate) => {
      if (candidate.object === this.hangingWall.mesh) return this.clipPlanes.hanging.distanceToPoint(candidate.point) >= 0;
      if (candidate.object === this.footwall.mesh) return this.clipPlanes.foot.distanceToPoint(candidate.point) >= 0;
      return true;
    });
    this.setHoverRef(candidates.find(([, object]) => object === hit?.object)?.[0] ?? null);
  }

  setHoverRef(ref) {
    if (ref === this.hoverRef) return;
    this.hoverRef = ref;
    this.onHover?.(ref);
  }

  /** World shift of the hanging wall's rock at the current slip amount. */
  hangingShift() {
    if (!this.slip) return new THREE.Vector3();
    return toWorld(this.slip).multiplyScalar((this.slipLength / METERS_PER_UNIT) * this.slipAmount);
  }

  update() {
    const options = this.options;
    const plane = this.plane;
    const frame = faultFrame(plane);
    const upward = toWorld(planeUpwardNormal(plane));
    const pole = toWorld(planePole(plane));
    const strikeWorld = toWorld(frame.strike);
    const updipWorld = toWorld(frame.updip);
    this.clipPlanes.hanging.setFromNormalAndCoplanarPoint(upward, CENTER);
    this.clipPlanes.foot.copy(this.clipPlanes.hanging).negate();

    // Blocks. 'moved': the hanging wall is displaced; 'cut': both fill the original block, eroded flat.
    const shift = this.hangingShift();
    const cut = options.blockMode === 'cut';
    const top = cut ? Math.min(0, shift.y) : 0;
    const walls = [
      { wall: this.footwall, rockShift: new THREE.Vector3(), min: BOX_MIN.clone(), max: new THREE.Vector3(BOX_MAX.x, top, BOX_MAX.z) },
      cut
        ? { wall: this.hangingWall, rockShift: shift, min: BOX_MIN.clone(), max: new THREE.Vector3(BOX_MAX.x, top, BOX_MAX.z) }
        : { wall: this.hangingWall, rockShift: shift, min: BOX_MIN.clone().add(shift), max: BOX_MAX.clone().add(shift) },
    ];
    for (const { wall, rockShift, min, max } of walls) {
      const groundTop = Math.abs(max.y - rockShift.y) < 1e-6;
      wall.mesh.geometry.dispose();
      wall.mesh.geometry = rockBoxGeometry(min, max, rockShift, groundTop);
      wall.mesh.material[2] = groundTop ? wall.materials.groundTop : wall.materials.bedTop;
      wall.outline.geometry.dispose();
      wall.outline.geometry = boxEdges(min, max);
      wall.bounds = { min, max, rockShift };
      const { side, groundTop: ground, bedTop, bottom } = wall.materials;
      for (const [material, opacity] of [[side, 0.58], [ground, 0.86], [bedTop, 0.86], [bottom, 0.35]]) {
        const transparent = !cut;
        if (material.transparent !== transparent) material.needsUpdate = true;
        material.transparent = transparent;
        material.opacity = cut ? 1 : opacity;
        material.depthWrite = cut;
      }
    }
    this.hangingWall.group.visible = options.showHangingWall;
    // Wall names sit just below the ground, one on each side of the fault's trace, away from the vector anchor.
    const dipHorizontal = toWorld(lineVector(plane.dipDirection, 0));
    const labelY = top - 0.3;
    const rise = labelY - CENTER.y;
    const traceShift = plane.dip < 89.5 ? rise / Math.tan((plane.dip * Math.PI) / 180) : 0;
    const traceAt = CENTER.clone().add(new THREE.Vector3(0, rise, 0)).sub(dipHorizontal.clone().multiplyScalar(traceShift));
    const awayFromAnchor = (strikeWorld.dot(new THREE.Vector3(1, 0, 1)) >= 0 ? strikeWorld.clone() : strikeWorld.clone().negate()).multiplyScalar(-0.8);
    for (const [wall, sign] of [[this.hangingWall, 1], [this.footwall, -1]]) {
      const position = traceAt.clone().add(dipHorizontal.clone().multiplyScalar(sign * 1.05)).add(awayFromAnchor);
      position.x = THREE.MathUtils.clamp(position.x, -HALF.x + 0.3, HALF.x - 0.3);
      position.z = THREE.MathUtils.clamp(position.z, -HALF.z + 0.3, HALF.z - 0.3);
      if (wall === this.hangingWall && !cut) position.add(shift);
      wall.label.sprite.position.copy(position);
      wall.label.sprite.visible = options.showWallLabels && (wall !== this.hangingWall || options.showHangingWall);
    }

    // Fault surface: its trace on the block faces, and the plane itself (with slickenlines if asked).
    const faultBoxMax = new THREE.Vector3(BOX_MAX.x, top, BOX_MAX.z);
    const polygon = boxSection(upward, CENTER, BOX_MIN, faultBoxMax);
    this.faultMesh.geometry.dispose();
    this.faultMesh.geometry = polygon.length ? fanGeometry(polygon) : new THREE.BufferGeometry();
    if (polygon.length) {
      this.faultMesh.geometry.computeVertexNormals();
      // Slickenline texture: u runs along the slip, v across it.
      const along = this.slip ? toWorld(this.slip).normalize() : updipWorld.clone().negate();
      const across = new THREE.Vector3().crossVectors(upward, along).normalize();
      const uv = polygon.flatMap((point) => {
        const offset = point.clone().sub(CENTER);
        return [offset.dot(along) * 0.5, offset.dot(across) * 0.5];
      });
      this.faultMesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    }
    this.faultTrace.set(polygon.map((point) => point.clone().add(upward.clone().multiplyScalar(0.004))));
    const slicken = options.showSlickenlines;
    const material = this.faultMesh.material;
    if (Boolean(material.map) !== slicken) material.needsUpdate = true;
    material.map = slicken ? this.slickenMap : null;
    material.color.setHex(slicken ? 0xffffff : COLORS.fault);
    material.opacity = slicken ? 0.95 : cut ? 0 : 0.55;
    material.userData.baseOpacity = material.opacity;
    this.faultMesh.visible = !cut;

    // Anchor on the fault for the vectors: along strike toward the viewer, near mid-depth.
    const toViewer = new THREE.Vector3(1, 0, 1);
    const along = strikeWorld.dot(toViewer) >= 0 ? strikeWorld.clone() : strikeWorld.clone().negate();
    const anchor = CENTER.clone().add(along.multiplyScalar(0.95));
    if (cut) anchor.y = Math.min(anchor.y, top - 0.55);

    this.updateDike(walls);
    this.updateSlipVectors(anchor, frame, strikeWorld, updipWorld, shift);
    this.poleArrow.set(anchor, anchor.clone().add(pole.clone().multiplyScalar(UNIT_LENGTH)));
    this.poleLabel.sprite.position.copy(anchor.clone().add(pole.clone().multiplyScalar(UNIT_LENGTH + 0.22)));
    this.poleGroup.visible = options.showPole;
    this.updateStress();
    this.updateTraction(anchor, pole);
    this.updateKinematic(anchor, pole);
    this.updateWell(top);
    this.applyHighlight();
  }

  updateDike(walls) {
    const visible = Boolean(this.marker) && this.options.showDike;
    this.dikeGroup.visible = visible;
    this.separationGroup.visible = false;
    if (!visible) return;
    const normal = toWorld(this.marker.normal).normalize();
    const point = nedPointToWorld(this.marker.point);
    walls.forEach(({ min, max, rockShift }, index) => {
      const part = this.dikeParts[index];
      const polygon = boxSection(normal, point.clone().add(rockShift), min, max);
      part.mesh.geometry.dispose();
      part.mesh.geometry = polygon.length ? fanGeometry(polygon) : new THREE.BufferGeometry();
      part.trace.set(polygon);
      part.mesh.visible = polygon.length > 0 && this.options.blockMode !== 'cut';
      part.trace.group.visible = polygon.length > 0;
    });
    if (!this.options.showSeparation || this.slipAmount < 0.999) return;
    // Draw each separation that lands on the visible block (inside its faces), just off the surface.
    const inside = (point, top) => Math.abs(point.x) <= HALF.x + 1e-6 && Math.abs(point.z) <= HALF.z + 1e-6 && point.y >= BOX_MIN.y - 1e-6 && point.y <= top + 1e-6;
    const top = walls[0].max.y;
    let labelAt = null;
    [this.separation?.map, this.separation?.section].forEach((result, index) => {
      const arrow = this.separationArrows[index];
      arrow.group.visible = false;
      if (!result?.points) return;
      const from = nedPointToWorld(result.points.footwall);
      const to = nedPointToWorld(result.points.hangingWall);
      if (!inside(from, top) || !inside(to, top) || from.distanceTo(to) < 0.04) return;
      const lift = index === 0 ? new THREE.Vector3(0, 0.035, 0) : new THREE.Vector3(Math.abs(from.x) > HALF.x - 1e-3 ? Math.sign(from.x) * 0.035 : 0, 0, Math.abs(from.z) > HALF.z - 1e-3 ? Math.sign(from.z) * 0.035 : 0);
      arrow.set(from.clone().add(lift), to.clone().add(lift));
      arrow.group.visible = true;
      if (!labelAt) labelAt = from.clone().add(to).multiplyScalar(0.5).add(lift.clone().normalize().multiplyScalar(0.3)).add(new THREE.Vector3(0, 0.12, 0));
    });
    this.separationGroup.visible = Boolean(labelAt);
    if (labelAt) this.separationLabel.sprite.position.copy(labelAt);
  }

  updateSlipVectors(anchor, frame, strikeWorld, updipWorld, shift) {
    const options = this.options;
    const hasSlip = Boolean(this.slip) && shift.length() > 1e-4;
    this.slipArrow.set(anchor, anchor.clone().add(shift));
    this.slipLabel.sprite.position.copy(anchor.clone().add(shift.clone().multiplyScalar(1.12)).add(new THREE.Vector3(0, 0.16, 0)));
    this.slipGroup.visible = options.showSlipVector && hasSlip;

    const strikePart = strikeWorld.clone().multiplyScalar(shift.dot(strikeWorld));
    const corner = anchor.clone().add(strikePart);
    this.strikeArrow.set(anchor, corner);
    this.dipArrow.set(corner, anchor.clone().add(shift));
    this.strikeLabel.sprite.position.copy(anchor.clone().add(strikePart.clone().multiplyScalar(0.5)).add(updipWorld.clone().multiplyScalar(shift.dot(updipWorld) > 0 ? -0.2 : 0.2)));
    this.dipLabel.sprite.position.copy(corner.clone().add(shift.clone().sub(strikePart).multiplyScalar(0.5)).add(strikeWorld.clone().multiplyScalar(strikePart.dot(strikeWorld) >= 0 ? 0.3 : -0.3)));
    this.strikeGroup.visible = options.showComponents && hasSlip && strikePart.length() > 0.02;
    this.dipGroup.visible = options.showComponents && hasSlip && shift.clone().sub(strikePart).length() > 0.02;

    // Rake: the angle in the fault plane from the strike direction to the slip, positive toward up-dip.
    const radius = 0.42;
    this.strikeLine.set(anchor.clone().sub(strikeWorld.clone().multiplyScalar(0.75)), anchor.clone().add(strikeWorld.clone().multiplyScalar(0.75)));
    this.strikeLineLabel.sprite.position.copy(anchor.clone().add(strikeWorld.clone().multiplyScalar(0.98)));
    if (this.slip) {
      const s = toWorld(this.slip);
      const rake = Math.atan2(s.dot(updipWorld), s.dot(strikeWorld));
      const count = 36;
      const points = Array.from({ length: count + 1 }, (_, index) => {
        const angle = (index / count) * rake;
        return anchor.clone().add(strikeWorld.clone().multiplyScalar(Math.cos(angle) * radius)).add(updipWorld.clone().multiplyScalar(Math.sin(angle) * radius));
      });
      this.rakeArc.set(points, false);
      const middle = rake / 2;
      this.rakeLabel.sprite.position.copy(anchor.clone().add(strikeWorld.clone().multiplyScalar(Math.cos(middle) * (radius + 0.2))).add(updipWorld.clone().multiplyScalar(Math.sin(middle) * (radius + 0.2))));
    }
    this.rakeGroup.visible = options.showRake && Boolean(this.slip);
  }

  updateStress() {
    const visible = Boolean(this.axes) && this.options.showStress;
    for (const key of ['sigma1', 'sigma2', 'sigma3']) {
      const glyph = this.glyphs[key];
      glyph.group.visible = visible;
      if (!visible) continue;
      const direction = axisWorld(this.axes[key]);
      const toCamera = VIEW.position.clone().sub(CENTER).normalize();
      const vertical = Math.abs(direction.y) > 0.999;
      const primary = vertical ? (direction.y > 0 ? 1 : -1) : direction.dot(toCamera) >= 0 ? 1 : -1;
      [1, -1].forEach((sign, index) => {
        const d = direction.clone().multiplyScalar(sign);
        const surface = exitDistance(d) + 0.12;
        const outer = CENTER.clone().add(d.clone().multiplyScalar(surface + GLYPHS[key].length));
        const inner = CENTER.clone().add(d.clone().multiplyScalar(surface));
        glyph.arrows[index].set(outer, inner);
        if (sign === primary) glyph.label.sprite.position.copy(outer.clone().add(d.clone().multiplyScalar(0.28)));
      });
    }
  }

  /** 𝐭 = σ𝐧 on the fault (𝐧 into the footwall) and its shear part 𝛕, which points the way the hanging wall slides. */
  updateTraction(anchor, pole) {
    const visible = Boolean(this.tensor) && this.options.showTraction;
    this.tractionGroup.visible = visible;
    this.shearGroup.visible = visible;
    if (!visible) return;
    const t = toWorld(applyTensor(this.tensor, planePole(this.plane))).multiplyScalar(TRACTION_SCALE);
    const shear = t.clone().sub(pole.clone().multiplyScalar(t.dot(pole)));
    this.tractionArrow.set(anchor, anchor.clone().add(t));
    this.tractionLabel.sprite.position.copy(anchor.clone().add(t.clone().multiplyScalar(1.12)));
    this.shearArrow.set(anchor, anchor.clone().add(shear));
    this.shearGroup.visible = shear.length() > 1e-3;
    this.shearLabel.sprite.position.copy(anchor.clone().add(shear.clone().multiplyScalar(1.15)).add(new THREE.Vector3(0, 0.16, 0)));
  }

  updateKinematic(anchor, pole) {
    const options = this.options;
    const visible = options.showKinematic && Boolean(this.slip);
    for (const group of [this.pGroup, this.tGroup, this.bGroup, this.unitSlipGroup]) group.visible = visible;
    if (!visible) return;
    const n = pole.clone().multiplyScalar(UNIT_LENGTH);
    const s = toWorld(this.slip).normalize().multiplyScalar(UNIT_LENGTH);
    this.unitSlipArrow.set(anchor, anchor.clone().add(s));
    this.unitSlipLabel.sprite.position.copy(anchor.clone().add(s.clone().multiplyScalar(1.25)));
    const { vectors } = kinematicAxes(planePole(this.plane), this.slip);
    const reach = UNIT_LENGTH * Math.SQRT2;
    const gap = 0.14;
    const P = toWorld(vectors.P);
    const T = toWorld(vectors.T);
    const B = toWorld(vectors.B);
    // P: arrows converge on the fault (shortening). T: arrows diverge (extension).
    [1, -1].forEach((sign, index) => {
      this.pArrows[index].set(anchor.clone().add(P.clone().multiplyScalar(sign * reach)), anchor.clone().add(P.clone().multiplyScalar(sign * gap)));
      this.tArrows[index].set(anchor.clone().add(T.clone().multiplyScalar(sign * gap)), anchor.clone().add(T.clone().multiplyScalar(sign * reach)));
    });
    this.pLabel.sprite.position.copy(anchor.clone().add(P.clone().multiplyScalar(reach + 0.22)));
    this.tLabel.sprite.position.copy(anchor.clone().add(T.clone().multiplyScalar(reach + 0.22)));
    this.bLine.set(anchor.clone().sub(B.clone().multiplyScalar(0.9)), anchor.clone().add(B.clone().multiplyScalar(0.9)));
    // Label the end of B that lands farther, on screen, from the label of 𝐧.
    const onScreen = (point) => point.clone().project(this.camera);
    const nLabel = onScreen(anchor.clone().add(pole.clone().multiplyScalar(UNIT_LENGTH + 0.22)));
    const ends = [1, -1].map((sign) => anchor.clone().add(B.clone().multiplyScalar(1.08 * sign)));
    const [far] = ends.sort((a, b) => onScreen(b).distanceTo(nLabel) - onScreen(a).distanceTo(nLabel));
    this.bLabel.sprite.position.copy(far);
    const nTip = anchor.clone().add(n);
    this.constructionP.set(nTip, nTip.clone().add(s));
    this.constructionT.set(nTip, nTip.clone().sub(s));
    this.constructionP.group.visible = options.showConstruction;
    this.constructionT.group.visible = options.showConstruction;
    this.unitSlipGroup.visible = options.showConstruction;
  }

  updateWell(top) {
    const visible = Boolean(this.well) && this.options.showWell;
    this.wellGroup.visible = visible;
    if (!visible) return;
    const head = nedPointToWorld({ x: this.well.x, y: this.well.y, z: 0 });
    head.y = top;
    const foot = head.clone();
    foot.y = BOX_MIN.y;
    this.wellShaft.set(head.clone().add(new THREE.Vector3(0, 0.36, 0)), foot);
    this.wellRig.position.copy(head.clone().add(new THREE.Vector3(0, 0.18, 0)));
    this.wellLabel.sprite.position.copy(head.clone().add(new THREE.Vector3(0, 0.6, 0)));
    const depth = this.wellFaultDepth;
    this.wellCrossing.visible = depth !== null && depth !== undefined;
    if (this.wellCrossing.visible) this.wellCrossing.position.set(head.x, -depth / METERS_PER_UNIT, head.z);
  }

  highlightGroups() {
    return {
      'sigma-1': [this.glyphs.sigma1.group],
      'sigma-2': [this.glyphs.sigma2.group],
      'sigma-3': [this.glyphs.sigma3.group],
      fault: [this.faultGroup],
      slip: [this.slipGroup, this.unitSlipGroup],
      'strike-slip': [this.strikeGroup],
      'dip-slip': [this.dipGroup],
      rake: [this.rakeGroup],
      pole: [this.poleGroup],
      traction: [this.tractionGroup],
      'shear-stress': [this.shearGroup],
      'p-axis': [this.pGroup],
      't-axis': [this.tGroup],
      'b-axis': [this.bGroup],
      dike: [this.dikeGroup],
      separation: [this.separationGroup],
      well: [this.wellGroup],
      'hanging-wall': [],
      footwall: [],
    };
  }

  /** Dim every bindable object except the highlighted one; a highlighted wall glows instead. */
  applyHighlight() {
    const groups = this.highlightGroups();
    const active = this.highlightRef && groups[this.highlightRef] ? this.highlightRef : null;
    const activeObjects = new Set(active ? groups[active] : []);
    const wallRef = active === 'hanging-wall' || active === 'footwall';
    for (const objects of Object.values(groups)) {
      for (const object of objects) {
        const factor = active && !wallRef && !activeObjects.has(object) ? DIMMED_OPACITY_FACTOR : 1;
        object.traverse((child) => {
          if (!child.material) return;
          if (child.userData.baseOpacity === undefined) child.userData.baseOpacity = child.material.opacity;
          child.material.opacity = child.userData.baseOpacity * factor;
        });
      }
    }
    for (const [wall, ref] of [[this.hangingWall, 'hanging-wall'], [this.footwall, 'footwall']]) {
      const glow = active === ref ? 0x8a7030 : 0x000000;
      for (const material of Object.values(wall.materials)) material.emissive.setHex(glow);
    }
    // The slickenline surface and the fault texture keep their own opacity when nothing is highlighted.
    if (!active) this.faultMesh.material.opacity = this.faultMesh.material.userData.baseOpacity;
  }

  highlight(ref) {
    this.highlightRef = ref;
    this.applyHighlight();
  }

  /**
   * plane: the fault (strike, dip, dipDirection). slip: unit slip vector of the
   * hanging wall (NED) or null. slipLength in metres. axes/tensor: the stress
   * state (optional). marker: the dike { normal, point } in NED metres.
   * separation: from traceSeparation, for the map arrow. well: { x, y } in NED
   * metres, with wellFaultDepth (m) where it crosses the fault.
   */
  setState({ plane, slip, slipLength, axes, tensor, marker, separation, well, wellFaultDepth, options }) {
    if (options) this.options = { ...this.defaultOptions, ...options };
    if (plane) this.plane = plane;
    if (slip !== undefined) this.slip = slip;
    if (slipLength !== undefined) this.slipLength = slipLength;
    if (axes !== undefined) this.axes = axes;
    if (tensor !== undefined) this.tensor = tensor;
    if (marker !== undefined) this.marker = marker;
    if (separation !== undefined) this.separation = separation;
    if (well !== undefined) this.well = well;
    if (wellFaultDepth !== undefined) this.wellFaultDepth = wellFaultDepth;
    this.update();
  }

  /** Move the hanging wall by the full slip (true) or put it back (false). */
  setSlipped(slipped, { animate = true } = {}) {
    this.slipTarget = slipped && this.slip ? 1 : 0;
    if (!animate || this.reducedMotion) {
      this.slipAmount = this.slipTarget;
      this.update();
    }
  }

  /** Camera presets: an oblique 3D view, a map (from straight above), or a section (looking along strike). */
  setView(view) {
    this.view = view;
    this.userMoved = false;
    this.resetCamera();
  }

  resetCamera() {
    this.userMoved = false;
    const factor = Math.max(1, 1.3 / Math.max(this.camera.aspect, 0.1));
    let position = VIEW.position.clone().sub(VIEW.target).multiplyScalar(factor).add(VIEW.target);
    let target = VIEW.target.clone();
    if (this.view === 'map') {
      target = new THREE.Vector3(0, -0.5, 0);
      position = new THREE.Vector3(0, 8.4 * factor, 0.02);
    } else if (this.view === 'section') {
      // Look at the block face most nearly perpendicular to the strike, from the viewer's side.
      const strike = toWorld(faultFrame(this.plane).strike);
      const face = Math.abs(strike.z) >= Math.abs(strike.x) ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
      target = CENTER.clone();
      position = CENTER.clone().add(face.multiplyScalar(8.4 * factor));
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
    if (this.slipAmount !== this.slipTarget) {
      const step = 1 / 70;
      this.slipAmount = this.slipTarget > this.slipAmount ? Math.min(this.slipTarget, this.slipAmount + step) : Math.max(this.slipTarget, this.slipAmount - step);
      this.update();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
