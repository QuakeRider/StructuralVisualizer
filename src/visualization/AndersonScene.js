import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { andersonFaults, faultSlip, principalStressTensor } from '../domain/anderson.js';
import { lineVector, planeUpwardNormal, strikeVector } from '../domain/orientation.js';
import { Arrow3D, Label, arcPoints, setPoints, setTube, tubeMesh } from './sceneKit.js';

const DIMMED_OPACITY_FACTOR = 0.14;
/** Half-sizes of the Earth block in world units (east–west, depth, north–south). */
const HALF = { x: 2, y: 1, z: 2 };
const CENTER = new THREE.Vector3(0, -HALF.y, 0);
const SLIP_DISTANCE = 0.5;
/** Illustrative principal stresses used only to find the slip direction (MPa). */
const SLIP_STRESS = { sigma1: 100, sigma2: 60, sigma3: 20 };

const COLORS = {
  sigma1: 0xf07a3c,
  sigma2: 0xf0e442,
  sigma3: 0x56b4e9,
  fault: 0xf4f5f7,
  conjugate: 0xa7aeb8,
  slip: 0x3fd0a0,
  beta: 0xcc79a7,
  dip: 0x9a8cff,
  guide: 0xb1b7c2,
  compass: 0xc3c8d0,
};

const CSS_COLORS = {
  sigma1: '#f07a3c',
  sigma2: '#f0e442',
  sigma3: '#56b4e9',
  beta: '#cc79a7',
  dip: '#9a8cff',
  slip: '#3fd0a0',
  fault: '#f4f5f7',
  compass: '#c3c8d0',
};

/** Glyph size and line pattern by rank, so σ1, σ2, σ3 read without color. */
const GLYPHS = {
  sigma1: { radius: 0.07, length: 1.15, pattern: 'solid', head: 0.3, headRadius: 0.16 },
  sigma2: { radius: 0.05, length: 0.85, pattern: 'dashed', head: 0.24, headRadius: 0.12 },
  sigma3: { radius: 0.035, length: 0.55, pattern: 'dotted', head: 0.2, headRadius: 0.09 },
};

const VIEW = { position: new THREE.Vector3(6.4, 4.2, 7.6), target: new THREE.Vector3(0, -0.85, 0), up: new THREE.Vector3(0, 1, 0) };

/**
 * Geological frame (north, east, down) → Three.js (y up): north is −z,
 * east is +x, down is −y. The student never sees renderer coordinates.
 */
function toWorld(v) {
  return new THREE.Vector3(v.y, -v.z, -v.x);
}

function axisWorld({ trend, plunge }) {
  return toWorld(lineVector(trend, plunge));
}

/** Distance from the block center to the block surface along a unit direction. */
function exitDistance(direction) {
  let distance = Infinity;
  for (const axis of ['x', 'y', 'z']) {
    if (Math.abs(direction[axis]) > 1e-6) distance = Math.min(distance, HALF[axis] / Math.abs(direction[axis]));
  }
  return distance;
}

/** Polygon where a plane through the block center cuts the block, in order around its centroid. */
function planeSection(normal) {
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, CENTER);
  const corners = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push(new THREE.Vector3(x * HALF.x, CENTER.y + y * HALF.y, z * HALF.z));
  const points = [];
  for (let i = 0; i < corners.length; i += 1) {
    for (let j = i + 1; j < corners.length; j += 1) {
      const a = corners[i];
      const b = corners[j];
      const differences = (a.x !== b.x) + (a.y !== b.y) + (a.z !== b.z);
      if (differences !== 1) continue;
      const da = plane.distanceToPoint(a);
      const db = plane.distanceToPoint(b);
      if (Math.abs(da) < 1e-9) points.push(a.clone());
      else if (da * db < 0) points.push(a.clone().lerp(b, da / (da - db)));
    }
  }
  const unique = points.filter((point, index) => points.findIndex((other) => other.distanceTo(point) < 1e-6) === index);
  const centroid = unique.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / unique.length);
  const u = unique[0].clone().sub(centroid).normalize();
  const w = new THREE.Vector3().crossVectors(normal, u).normalize();
  return unique
    .map((point) => ({ point, angle: Math.atan2(point.clone().sub(centroid).dot(w), point.clone().sub(centroid).dot(u)) }))
    .sort((a, b) => a.angle - b.angle)
    .map(({ point }) => point);
}

function fanGeometry(polygon) {
  const positions = polygon.flatMap((point) => [point.x, point.y, point.z]);
  const indices = [];
  for (let index = 1; index < polygon.length - 1; index += 1) indices.push(0, index, index + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function loopSegments(polygon) {
  return polygon.flatMap((point, index) => [point, polygon[(index + 1) % polygon.length]]);
}

function layerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const layers = ['#b99a6b', '#6f6a64', '#a8adb1', '#9a5b45', '#c2a878', '#5f6570', '#b99a6b', '#8b6f56'];
  const height = canvas.height / layers.length;
  layers.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(0, index * height, canvas.width, height);
    context.fillStyle = 'rgba(20, 20, 20, 0.35)';
    context.fillRect(0, index * height, canvas.width, 2);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function groundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#56644a';
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = 'rgba(214, 226, 190, 0.55)';
  context.lineWidth = 3;
  for (let index = 1; index < 8; index += 1) {
    const at = index * 32;
    context.beginPath();
    context.moveTo(at, 0);
    context.lineTo(at, 256);
    context.moveTo(0, at);
    context.lineTo(256, at);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** An arrow drawn on top of the translucent block. */
function overlayArrow(options) {
  const arrow = new Arrow3D(options);
  for (const part of [arrow.shaft, arrow.head]) {
    part.material.depthTest = false;
    part.renderOrder = 13;
  }
  return arrow;
}

/**
 * Anderson laboratory (lesson B7): an Earth block in the NED frame with the
 * three principal-stress glyphs, the conjugate Coulomb fault pair cut
 * through the block, the angles β (σ1 to fault) and δ (dip), and the
 * hanging wall sliding along the resolved shear direction. Equation symbols
 * highlight scene objects by reference (sceneRefs.js), and hovering an
 * object reports its reference through onHover.
 */
export class AndersonScene {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.defaultOptions = { showAxes: true, showFaults: true, showConjugate: true, showAngles: true, showSlip: false };
    this.options = { ...this.defaultOptions };
    this.regime = 'normal';
    this.mu = 0.6;
    this.shmaxTrend = 0;
    this.slipTarget = 0;
    this.slipAmount = 0;
    this.highlightRef = null;
    this.hoverRef = null;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.copy(VIEW.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Block of crust in the north–east–down frame with principal stress arrows and the predicted fault planes.');
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 24;
    this.controls.target.copy(VIEW.target);
    this.camera.lookAt(VIEW.target);
    // Refit the view on resize until the student orbits or zooms.
    this.userMoved = false;
    this.controls.addEventListener('start', () => { this.userMoved = true; });

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2e36, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(4, 7, 5);
    this.scene.add(key);

    this.createBlock();
    this.createCompass();
    this.createStressGlyphs();
    this.createFaults();
    this.createAngles();
    this.createSlipArrows();
    this.bindPointerEvents();
    this.update();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  /** Two clipped copies of one layered block: the footwall and the hanging wall. */
  createBlock() {
    const layers = layerTexture();
    const ground = groundTexture();
    this.clipPlanes = { hanging: new THREE.Plane(), foot: new THREE.Plane() };
    const geometry = new THREE.BoxGeometry(HALF.x * 2, HALF.y * 2, HALF.z * 2);
    const edges = new THREE.EdgesGeometry(geometry);
    const makeCopy = (plane) => {
      const side = () => new THREE.MeshStandardMaterial({ map: layers, roughness: 0.9, transparent: true, opacity: 0.58, depthWrite: false, clippingPlanes: [plane], side: THREE.DoubleSide });
      const top = new THREE.MeshStandardMaterial({ map: ground, roughness: 0.95, transparent: true, opacity: 0.86, depthWrite: false, clippingPlanes: [plane], side: THREE.DoubleSide });
      const bottom = new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 1, transparent: true, opacity: 0.35, depthWrite: false, clippingPlanes: [plane], side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, [side(), side(), top, bottom, side(), side()]);
      const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xd8dde4, transparent: true, opacity: 0.55, clippingPlanes: [plane] }));
      const group = new THREE.Group();
      group.add(mesh, outline);
      group.position.copy(CENTER);
      this.scene.add(group);
      return { group, mesh };
    };
    this.footwall = makeCopy(this.clipPlanes.foot);
    this.hangingWall = makeCopy(this.clipPlanes.hanging);

    // Highlight overlay for the free surface (the ground).
    this.surfaceOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(HALF.x * 2, HALF.z * 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.surfaceOverlay.rotation.x = -Math.PI / 2;
    this.surfaceOverlay.position.y = 0.006;
    this.scene.add(this.surfaceOverlay);
  }

  createCompass() {
    const origin = new THREE.Vector3(-HALF.x - 0.9, 0, HALF.z + 0.5);
    const group = new THREE.Group();
    const entries = [
      ['N', { x: 1, y: 0, z: 0 }, 'x'],
      ['E', { x: 0, y: 1, z: 0 }, 'y'],
      ['D', { x: 0, y: 0, z: 1 }, 'z'],
    ];
    for (const [name, direction, axis] of entries) {
      const arrow = new Arrow3D({ color: COLORS.compass, radius: 0.018, headLength: 0.16, headRadius: 0.06 });
      const end = origin.clone().add(toWorld(direction).multiplyScalar(0.75));
      arrow.set(origin, end);
      const label = new Label(CSS_COLORS.compass, 0.042);
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
      const label = new Label(CSS_COLORS[key], 0.055);
      label.setParts([['σ', 'var'], [key.slice(-1), 'nsub']]);
      const group = new THREE.Group();
      group.add(...arrows.map((arrow) => arrow.group), label.sprite);
      this.scene.add(group);
      this.glyphs[key] = { arrows, label, group };
    }
  }

  createFaults() {
    const make = (color, opacity, dashed) => {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
      mesh.renderOrder = 5;
      const material = dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.09, transparent: true })
        : new THREE.LineBasicMaterial({ color, transparent: true });
      const outline = new THREE.LineSegments(new THREE.BufferGeometry(), material);
      outline.renderOrder = 6;
      const group = new THREE.Group();
      group.add(mesh, outline);
      this.scene.add(group);
      return { group, mesh, outline };
    };
    this.fault = make(COLORS.fault, 0.5, false);
    this.conjugate = make(COLORS.conjugate, 0.2, true);
  }

  createAngles() {
    this.sigma1Line = overlayArrow({ color: COLORS.sigma1, radius: 0.014, head: false, pattern: 'dashed', period: 0.14 });
    this.traceLine = overlayArrow({ color: COLORS.fault, radius: 0.016, head: false });
    this.horizontalLine = overlayArrow({ color: COLORS.guide, radius: 0.012, head: false, pattern: 'dashed', period: 0.14 });
    this.betaArc = tubeMesh(COLORS.beta);
    this.dipArc = tubeMesh(COLORS.dip);
    this.betaLabel = new Label(CSS_COLORS.beta, 0.055);
    this.betaLabel.setParts([['β', 'var']]);
    this.dipLabel = new Label(CSS_COLORS.dip, 0.055);
    this.dipLabel.setParts([['δ', 'var']]);
    this.angleGroup = new THREE.Group();
    this.angleGroup.add(this.sigma1Line.group, this.traceLine.group, this.horizontalLine.group, this.betaArc, this.dipArc, this.betaLabel.sprite, this.dipLabel.sprite);
    this.scene.add(this.angleGroup);
  }

  createSlipArrows() {
    this.slipArrows = [0, 1].map(() => overlayArrow({ color: COLORS.slip, radius: 0.04, headLength: 0.2, headRadius: 0.1 }));
    this.slipGroup = new THREE.Group();
    this.slipGroup.add(...this.slipArrows.map((arrow) => arrow.group));
    this.scene.add(this.slipGroup);
  }

  bindPointerEvents() {
    this.onPointerMove = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      this.reportHover();
    };
    this.onPointerLeave = () => this.setHoverRef(null);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeave);
  }

  /** Raycast the pickable objects under the pointer and report their scene ref. */
  reportHover() {
    const candidates = [
      ...['sigma1', 'sigma2', 'sigma3'].flatMap((key) => this.glyphs[key].arrows.flatMap((arrow) => [[`sigma-${key.slice(-1)}`, arrow.shaft], [`sigma-${key.slice(-1)}`, arrow.head]])),
      ...this.slipArrows.flatMap((arrow) => [['slip', arrow.shaft], ['slip', arrow.head]]),
      ['beta', this.betaArc],
      ['dip', this.dipArc],
      ['fault', this.fault.mesh],
      ['conjugate', this.conjugate.mesh],
      ['free-surface', this.surfaceOverlay],
    ].filter(([, object]) => {
      let visible = object.visible;
      object.traverseAncestors((ancestor) => { if (!ancestor.visible) visible = false; });
      return visible;
    });
    const hit = this.raycaster.intersectObjects(candidates.map(([, object]) => object), false)[0];
    this.setHoverRef(candidates.find(([, object]) => object === hit?.object)?.[0] ?? null);
  }

  setHoverRef(ref) {
    if (ref === this.hoverRef) return;
    this.hoverRef = ref;
    this.onHover?.(ref);
  }

  update() {
    const result = andersonFaults(this.regime, this.mu, this.shmaxTrend);
    this.result = result;
    const axes = result.axes;
    const tensor = principalStressTensor(axes, SLIP_STRESS);

    // Principal-stress glyphs: inward arrows on opposite sides of the block.
    for (const key of ['sigma1', 'sigma2', 'sigma3']) {
      const glyph = this.glyphs[key];
      const direction = axisWorld(axes[key]);
      // Label the arrow nearer the viewer: the upper one for a vertical axis.
      const vertical = axes[key].plunge === 90;
      const toCamera = VIEW.position.clone().sub(CENTER).normalize();
      const primary = vertical ? (direction.y > 0 ? 1 : -1) : (direction.dot(toCamera) >= 0 ? 1 : -1);
      [1, -1].forEach((sign, index) => {
        const d = direction.clone().multiplyScalar(sign);
        const surface = exitDistance(d) + 0.12;
        const outer = CENTER.clone().add(d.clone().multiplyScalar(surface + GLYPHS[key].length));
        const inner = CENTER.clone().add(d.clone().multiplyScalar(surface));
        glyph.arrows[index].set(outer, inner);
        if (sign === primary) glyph.label.sprite.position.copy(outer.clone().add(d.clone().multiplyScalar(0.28)));
      });
      glyph.group.visible = this.options.showAxes;
    }

    // Fault planes.
    const [active, other] = result.faults;
    const activeNormal = toWorld(planeUpwardNormal(active));
    const otherNormal = toWorld(planeUpwardNormal(other));
    for (const [fault, normal] of [[this.fault, activeNormal], [this.conjugate, otherNormal]]) {
      const polygon = planeSection(normal);
      fault.mesh.geometry.dispose();
      fault.mesh.geometry = fanGeometry(polygon);
      fault.mesh.geometry.computeVertexNormals();
      setPoints(fault.outline, loopSegments(polygon));
    }
    this.fault.group.visible = this.options.showFaults;
    this.conjugate.group.visible = this.options.showFaults && this.options.showConjugate;

    // The hanging wall (upward-normal side of the active fault) is clipped from the footwall.
    this.clipPlanes.hanging.setFromNormalAndCoplanarPoint(activeNormal, CENTER);
    this.clipPlanes.foot.copy(this.clipPlanes.hanging).negate();
    const { slip } = faultSlip(tensor, active);
    this.slipDirection = slip ? toWorld(slip) : new THREE.Vector3();
    const canSlip = this.options.showFaults;
    if (!canSlip) this.slipTarget = 0;
    this.applySlipOffset();

    // Angles in the σ1–σ3 plane: β from σ1 to the fault trace, δ from horizontal to the fault.
    const s1 = axisWorld(axes.sigma1);
    const s2 = axisWorld(axes.sigma2);
    let trace = new THREE.Vector3().crossVectors(activeNormal, s2).normalize();
    if (trace.dot(s1) < 0) trace.negate();
    const sectionIsHorizontal = Math.abs(s2.y) > 0.99;
    const origin = sectionIsHorizontal ? new THREE.Vector3(0, 0.02, 0) : CENTER.clone();
    const reach = (direction) => Math.min(exitDistance(direction), 2.4);
    this.sigma1Line.set(origin.clone().sub(s1.clone().multiplyScalar(reach(s1))), origin.clone().add(s1.clone().multiplyScalar(reach(s1))));
    this.traceLine.set(origin.clone().sub(trace.clone().multiplyScalar(reach(trace))), origin.clone().add(trace.clone().multiplyScalar(reach(trace))));
    const betaRadius = 0.8;
    const betaPoints = arcPoints(origin, s1, trace, betaRadius);
    setTube(this.betaArc, betaPoints);
    const betaMiddle = s1.clone().add(trace).normalize();
    this.betaLabel.sprite.position.copy(origin.clone().add(betaMiddle.multiplyScalar(betaRadius + 0.28)));

    const dipping = active.dip < 89.5;
    this.dipArc.visible = dipping;
    this.dipLabel.sprite.visible = dipping;
    this.horizontalLine.group.visible = dipping;
    if (dipping) {
      const down = trace.y < 0 ? trace.clone() : trace.clone().negate();
      const horizontal = new THREE.Vector3(down.x, 0, down.z).normalize();
      const dipRadius = 1.45;
      setTube(this.dipArc, arcPoints(origin, horizontal, down, dipRadius));
      this.horizontalLine.set(origin.clone(), origin.clone().add(horizontal.clone().multiplyScalar(reach(horizontal))));
      const dipMiddle = horizontal.clone().add(down).normalize();
      this.dipLabel.sprite.position.copy(origin.clone().add(dipMiddle.multiplyScalar(dipRadius + 0.28)));
    }
    this.angleGroup.visible = this.options.showFaults && this.options.showAngles;
    this.sigma1Line.group.visible = this.options.showAxes;

    // Slip arrows on either side of the active fault, away from the angle markers.
    const along = toWorld(strikeVector(active));
    // On a vertical fault the β arc sits on the σ1 side of the ground, so the arrows go to the other side.
    const anchor = (sectionIsHorizontal ? new THREE.Vector3(0, 0.02, 0) : CENTER.clone()).add(along.multiplyScalar(sectionIsHorizontal ? -1.2 : 1.35));
    const offset = activeNormal.clone().multiplyScalar(0.22);
    const half = this.slipDirection.clone().multiplyScalar(0.42);
    this.slipArrows[0].set(anchor.clone().add(offset).sub(half), anchor.clone().add(offset).add(half));
    this.slipArrows[1].set(anchor.clone().sub(offset).add(half), anchor.clone().sub(offset).sub(half));
    this.slipGroup.visible = this.options.showFaults && this.options.showSlip && Boolean(slip);

    this.applyHighlight();
  }

  applySlipOffset() {
    this.hangingWall.group.position.copy(CENTER).add(this.slipDirection.clone().multiplyScalar(this.slipAmount * SLIP_DISTANCE));
  }

  /** Objects for each scene ref. The vertical axis depends on the regime. */
  highlightGroups() {
    const vertical = { normal: 'sigma1', 'strike-slip': 'sigma2', thrust: 'sigma3' }[this.regime];
    return {
      'sigma-1': [this.glyphs.sigma1.group, this.sigma1Line.group],
      'sigma-2': [this.glyphs.sigma2.group],
      'sigma-3': [this.glyphs.sigma3.group],
      'vertical-axis': [this.glyphs[vertical].group],
      'free-surface': [],
      fault: [this.fault.group],
      conjugate: [this.conjugate.group],
      beta: [this.betaArc, this.betaLabel.sprite, this.traceLine.group],
      dip: [this.dipArc, this.dipLabel.sprite, this.horizontalLine.group],
      slip: [this.slipGroup],
    };
  }

  /** Dim every bindable object except the highlighted one (equation–model binding). */
  applyHighlight() {
    const groups = this.highlightGroups();
    const active = this.highlightRef && groups[this.highlightRef] ? this.highlightRef : null;
    const activeObjects = new Set(active ? groups[active] : []);
    for (const objects of Object.values(groups)) {
      for (const object of objects) {
        const factor = active && active !== 'free-surface' && !activeObjects.has(object) ? DIMMED_OPACITY_FACTOR : 1;
        object.traverse((child) => {
          if (!child.material) return;
          if (child.userData.baseOpacity === undefined) child.userData.baseOpacity = child.material.opacity;
          child.material.opacity = child.userData.baseOpacity * factor;
        });
      }
    }
    this.surfaceOverlay.material.opacity = active === 'free-surface' ? 0.32 : 0;
  }

  highlight(ref) {
    this.highlightRef = ref;
    this.applyHighlight();
  }

  setState({ regime, mu, shmaxTrend, options }) {
    if (options) this.options = { ...this.defaultOptions, ...options };
    if (regime && regime !== this.regime) {
      this.regime = regime;
      // A new regime starts with the block intact.
      this.slipTarget = 0;
      this.slipAmount = 0;
    }
    if (mu !== undefined) this.mu = mu;
    if (shmaxTrend !== undefined) this.shmaxTrend = shmaxTrend;
    this.update();
  }

  /** Slide the hanging wall along the fault (true) or put it back (false). */
  setSlipped(slipped, { animate = true } = {}) {
    this.slipTarget = slipped && this.options.showFaults ? 1 : 0;
    if (!animate || this.reducedMotion) {
      this.slipAmount = this.slipTarget;
      this.applySlipOffset();
    }
  }

  resetCamera() {
    this.userMoved = false;
    const factor = Math.max(1, 1.3 / Math.max(this.camera.aspect, 0.1));
    this.camera.position.copy(VIEW.position.clone().sub(VIEW.target).multiplyScalar(factor).add(VIEW.target));
    this.camera.up.copy(VIEW.up);
    this.controls.target.copy(VIEW.target);
    this.camera.lookAt(VIEW.target);
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    // Frame the block for the new shape unless the student has moved the camera.
    if (width > 1 && height > 1 && !this.userMoved) this.resetCamera();
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (this.slipAmount !== this.slipTarget) {
      const step = 1 / 70;
      this.slipAmount = this.slipTarget > this.slipAmount ? Math.min(this.slipTarget, this.slipAmount + step) : Math.max(this.slipTarget, this.slipAmount - step);
      this.applySlipOffset();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
