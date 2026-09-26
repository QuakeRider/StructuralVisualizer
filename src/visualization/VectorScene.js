import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { formatNumber } from '../domain/format.js';
import { add, clampVector, fromPolar, magnitude, polarAngle, rotate2D, scale, snapVector, subtract } from '../domain/vector.js';
import { CURVE_PLOT_SCENE_REFS, VECTOR_LAB_SCENE_REFS } from './sceneRefs.js';
import { Arrow3D, Label, arcPoints, makeLine, setPoints, setTube, tubeMesh } from './sceneKit.js';

/** World units per math unit, and the largest component the lab shows. */
const UNIT = 0.36;
const LIMIT = 6;
const SNAP = 0.5;
/** Polar dragging (M2) snaps the angle to this many degrees. */
const ANGLE_SNAP = 5;
const DIMMED_OPACITY_FACTOR = 0.14;

const COLORS = {
  vector: 0xf4f5f7,
  b: 0xf0e442,
  result: 0x3fd0a0,
  x: 0x56b4e9,
  y: 0xe69f00,
  z: 0xcc79a7,
  guide: 0xb1b7c2,
  prop: 0x8f99a6,
  theta: 0x3fd0a0,
  elevation: 0x9a8cff,
  plane: 0xb08a5a,
};

const CSS_COLORS = {
  vector: '#f4f5f7',
  b: '#f0e442',
  result: '#3fd0a0',
  x: '#56b4e9',
  y: '#e69f00',
  z: '#cc79a7',
  guide: '#c3c8d0',
  tick: '#858d99',
  theta: '#3fd0a0',
  elevation: '#9a8cff',
  plane: '#d9b27c',
};

const VIEW_3D = { position: new THREE.Vector3(3.2, 3.5, 5.7), target: new THREE.Vector3(0, 0.55, 0), up: new THREE.Vector3(0, 1, 0) };
const VIEW_3D_CLOSE = { position: new THREE.Vector3(2.0, 2.1, 3.6), target: new THREE.Vector3(0, 0.3, 0), up: new THREE.Vector3(0, 1, 0) };
const VIEW_2D = { position: new THREE.Vector3(0, 8.9, 0.0001), target: new THREE.Vector3(0, 0, 0), up: new THREE.Vector3(0, 0, -1) };
const VIEW_2D_CLOSE = { position: new THREE.Vector3(0, 2.5, 0.0001), target: new THREE.Vector3(0, 0, 0), up: new THREE.Vector3(0, 0, -1) };
const VIEWS = { '2d': VIEW_2D, '2d-close': VIEW_2D_CLOSE, '3d': VIEW_3D, '3d-close': VIEW_3D_CLOSE };

/**
 * Math frame (right-handed x, y, z with z drawn up) → Three.js (y up).
 * The student never sees renderer coordinates.
 */
function toWorld(vector) {
  return new THREE.Vector3(vector.x * UNIT, vector.z * UNIT, -vector.y * UNIT);
}

function fromWorld(point) {
  return { x: point.x / UNIT, y: -point.z / UNIT, z: point.y / UNIT };
}

function boxEdges(tip) {
  const corners = [];
  for (const x of [0, tip.x]) for (const y of [0, tip.y]) for (const z of [0, tip.z]) corners.push({ x, y, z });
  const edges = [];
  for (let i = 0; i < corners.length; i += 1) {
    for (let j = i + 1; j < corners.length; j += 1) {
      const a = corners[i];
      const b = corners[j];
      const differences = (a.x !== b.x) + (a.y !== b.y) + (a.z !== b.z);
      if (differences === 1) edges.push(toWorld(a), toWorld(b));
    }
  }
  return edges;
}

function componentParts(symbol, axis, value, hidden = false) {
  return [[symbol, 'var'], [axis, 'sub'], [` = ${hidden ? '?' : formatNumber(value)}`]];
}

/** Points on a circular arc in the x–y plane (math frame), from angle `from` to `to` in degrees. */
function planarArc(radius, from, to, count = 48) {
  const points = [];
  for (let index = 0; index <= count; index += 1) points.push(toWorld(fromPolar(radius, from + ((to - from) * index) / count)));
  return points;
}

/**
 * Generic vector laboratory for Unit 0. Draws vectors from the origin in the
 * math frame with a component box, the stacked right triangles of the 3D
 * magnitude, unit and scaled vectors, tip-to-tail addition, and optional
 * geological context props. Equation symbols highlight scene objects by
 * reference (see sceneRefs.js), and hovering an object reports its reference
 * back through onHover.
 */
export class VectorScene {
  constructor(container, { onVectorChange, onHover } = {}) {
    this.container = container;
    this.onVectorChange = onVectorChange;
    this.onHover = onHover;
    this.defaultOptions = {
      layout: 'single',
      showComponents: true,
      showTriangles: false,
      showUnit: false,
      showScaled: false,
      showStacks: false,
      context: null,
      draggable: ['v'],
      // M2 options.
      polar: false,
      fixedLength: null,
      showAngle: false,
      showUnitCircle: false,
      showDirectionAngles: false,
      rotatedAxes: false,
      showPrimedComponents: false,
      hideComponentValues: false,
      showElevation: false,
      planeTrace: false,
    };
    this.options = { ...this.defaultOptions };
    this.theta = 0;
    this.vectors = { v: { x: 3, y: -4, z: 0 }, b: { x: 1, y: 2, z: 0 } };
    this.scalar = 2;
    this.dimension = 3;
    this.viewKey = '3d';
    this.dragging = null;
    this.highlightRef = null;
    this.hoverRef = null;
    this.cameraAnimation = null;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.copy(VIEW_3D.position);
    this.camera.lookAt(VIEW_3D.target);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('role', 'application');
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive vector laboratory with x, y, and z axes. Drag a vector tip, or use the component fields in the lesson panel.',
    );
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 20;
    this.controls.target.copy(VIEW_3D.target);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane();
    this.dragIntersection = new THREE.Vector3();

    this.createLighting();
    this.createAxes();
    this.createVectorObjects();
    this.createContextProps();
    this.createAngleObjects();
    this.allArrows = [
      ...this.axisArrows, this.primaryArrow, this.bArrow, this.resultArrow, this.diagonal,
      ...Object.values(this.componentArrows),
      ...Object.values(this.stacks).flatMap((stack) => [stack.aPart, stack.bPart]),
      ...Object.values(this.primeAxes).map((entry) => entry.arrow),
      ...Object.values(this.primedArrows),
      this.planeTrace,
    ];
    this.highlightGroups = this.createHighlightGroups();
    this.bindPointerEvents();
    this.updateVisuals();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  createLighting() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x20242c, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3, 6, 4);
    this.scene.add(key);
  }

  createAxes() {
    const extent = LIMIT * UNIT;
    this.grid = new THREE.GridHelper(extent * 2, LIMIT * 2, 0x4a515c, 0x2c323b);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.55;
    this.scene.add(this.grid);

    this.axisObjects = {};
    const axes = [
      { key: 'x', direction: { x: 1, y: 0, z: 0 } },
      { key: 'y', direction: { x: 0, y: 1, z: 0 } },
      { key: 'z', direction: { x: 0, y: 0, z: 1 } },
    ];
    for (const axis of axes) {
      const group = new THREE.Group();
      const arrow = new Arrow3D({ color: COLORS[axis.key], radius: 0.009, headLength: 0.16, headRadius: 0.05 });
      arrow.set(new THREE.Vector3(), toWorld(scale(axis.direction, LIMIT + 0.8)));
      this.axisArrows = [...(this.axisArrows ?? []), arrow];
      for (const part of [arrow.shaft, arrow.head]) part.material.opacity = 0.75;
      const negative = makeLine([new THREE.Vector3(), toWorld(scale(axis.direction, -LIMIT))], COLORS[axis.key], { dashed: true, opacity: 0.45 });
      const label = new Label(CSS_COLORS[axis.key], 0.06);
      label.setParts([[axis.key, 'var']]);
      label.sprite.position.copy(toWorld(scale(axis.direction, LIMIT + 1.3)));
      group.add(arrow.group, negative, label.sprite);
      for (const value of [-6, -4, -2, 2, 4, 6]) {
        const tick = new Label(CSS_COLORS.tick, 0.032);
        tick.setParts([[formatNumber(value)]]);
        const position = toWorld(scale(axis.direction, value));
        const offset = axis.key === 'z' ? { x: -0.45, y: 0, z: 0 } : axis.key === 'x' ? { x: 0, y: -0.45, z: 0 } : { x: -0.45, y: 0, z: 0 };
        tick.sprite.position.copy(position.add(toWorld(offset)));
        group.add(tick.sprite);
      }
      group.userData.axisKey = axis.key;
      this.axisObjects[axis.key] = group;
      this.scene.add(group);
    }
  }

  createVectorObjects() {
    const handleMaterial = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0.25, transparent: true, depthTest: false });

    this.primaryArrow = new Arrow3D({ color: COLORS.vector, radius: 0.034 });
    this.primaryLabel = new Label(CSS_COLORS.vector, 0.06);
    this.primaryHandle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), handleMaterial(COLORS.vector));
    this.primaryHandle.renderOrder = 15;

    this.bArrow = new Arrow3D({ color: COLORS.b, radius: 0.032, pattern: 'dashed', period: 0.16 });
    this.bLabel = new Label(CSS_COLORS.b, 0.06);
    this.bHandle = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), handleMaterial(COLORS.b));
    this.bHandle.renderOrder = 15;

    this.resultArrow = new Arrow3D({ color: COLORS.result, radius: 0.045, pattern: 'dotted', period: 0.1 });
    this.resultLabel = new Label(CSS_COLORS.result, 0.06);

    this.componentArrows = {};
    this.componentLabels = {};
    for (const axis of ['x', 'y', 'z']) {
      this.componentArrows[axis] = new Arrow3D({ color: COLORS[axis], radius: 0.02, headLength: 0.14, headRadius: 0.055 });
      this.componentLabels[axis] = new Label(CSS_COLORS[axis], 0.046);
    }
    this.box = makeLine([new THREE.Vector3(), new THREE.Vector3()], COLORS.guide, { dashed: true, opacity: 0.5 });

    this.diagonal = new Arrow3D({ color: COLORS.guide, radius: 0.016, pattern: 'dashed', head: false, period: 0.14 });
    this.diagonalLabel = new Label(CSS_COLORS.guide, 0.046);
    const triangleMaterial = () => new THREE.MeshBasicMaterial({ color: COLORS.guide, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });
    this.floorTriangle = new THREE.Mesh(new THREE.BufferGeometry(), triangleMaterial());
    this.riseTriangle = new THREE.Mesh(new THREE.BufferGeometry(), triangleMaterial());
    this.rightAngles = [0, 1].map(() => makeLine([new THREE.Vector3(), new THREE.Vector3()], COLORS.guide, { opacity: 0.9 }));

    this.unitSphere = new THREE.Group();
    const circle = (rotate) => {
      const points = [];
      for (let index = 0; index <= 96; index += 1) {
        const angle = (index / 96) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * UNIT, 0, Math.sin(angle) * UNIT));
      }
      const loop = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: COLORS.result, transparent: true, opacity: 0.55 }));
      rotate(loop);
      return loop;
    };
    this.unitEquator = circle(() => {});
    this.unitMeridians = [circle((loop) => { loop.rotation.x = Math.PI / 2; }), circle((loop) => { loop.rotation.z = Math.PI / 2; })];
    this.unitSphere.add(this.unitEquator, ...this.unitMeridians);

    this.stacks = {};
    for (const axis of ['x', 'y', 'z']) {
      const group = new THREE.Group();
      const aPart = new Arrow3D({ color: COLORS.vector, radius: 0.026, head: false });
      const bPart = new Arrow3D({ color: COLORS.b, radius: 0.026, head: false, pattern: 'dashed', period: 0.12 });
      const end = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), new THREE.MeshBasicMaterial({ color: COLORS.result, transparent: true }));
      group.add(aPart.group, bPart.group, end);
      this.stacks[axis] = { group, aPart, bPart, end };
    }

    this.scene.add(
      this.primaryArrow.group, this.primaryLabel.sprite, this.primaryHandle,
      this.bArrow.group, this.bLabel.sprite, this.bHandle,
      this.resultArrow.group, this.resultLabel.sprite,
      ...Object.values(this.componentArrows).map((arrow) => arrow.group),
      ...Object.values(this.componentLabels).map((label) => label.sprite),
      this.box,
      this.diagonal.group, this.diagonalLabel.sprite, this.floorTriangle, this.riseTriangle, ...this.rightAngles,
      this.unitSphere,
      ...Object.values(this.stacks).map((stack) => stack.group),
    );
  }

  /** M2: angle arcs, the rotated (primed) axis triad, primed components, and a plane trace. */
  createAngleObjects() {
    const arcLabel = (color) => new Label(color, 0.055);
    this.alphaArc = tubeMesh(COLORS.x);
    this.alphaLabel = arcLabel(CSS_COLORS.x);
    this.alphaLabel.setParts([['α', 'var']]);
    this.directionArcs = {
      x: { arc: tubeMesh(COLORS.x), label: arcLabel(CSS_COLORS.x), symbol: 'α' },
      y: { arc: tubeMesh(COLORS.y), label: arcLabel(CSS_COLORS.y), symbol: 'β' },
      z: { arc: tubeMesh(COLORS.z), label: arcLabel(CSS_COLORS.z), symbol: 'γ' },
    };
    for (const entry of Object.values(this.directionArcs)) entry.label.setParts([[entry.symbol, 'var']]);
    this.elevationArc = tubeMesh(COLORS.elevation);
    this.elevationLabel = arcLabel(CSS_COLORS.elevation);
    this.elevationLabel.setParts([['ε', 'var']]);

    // Primed axes: dashed, in the colors of the axes they replace.
    this.primeAxes = {};
    for (const axis of ['x', 'y']) {
      const group = new THREE.Group();
      const arrow = new Arrow3D({ color: COLORS[axis], radius: 0.012, headLength: 0.16, headRadius: 0.05, pattern: 'dashed', period: 0.16 });
      const negative = makeLine([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)], COLORS[axis], { dashed: true, opacity: 0.4 });
      const label = new Label(CSS_COLORS[axis], 0.06);
      label.setParts([[`${axis}′`, 'var']]);
      group.add(arrow.group, negative, label.sprite);
      this.primeAxes[axis] = { group, arrow, negative, label };
    }
    this.thetaArc = tubeMesh(COLORS.theta);
    this.thetaLabel = arcLabel(CSS_COLORS.theta);
    this.thetaLabel.setParts([['θ', 'var']]);
    this.primedArrows = {
      x: new Arrow3D({ color: COLORS.x, radius: 0.022, headLength: 0.14, headRadius: 0.055, pattern: 'dashed', period: 0.12 }),
      y: new Arrow3D({ color: COLORS.y, radius: 0.022, headLength: 0.14, headRadius: 0.055, pattern: 'dashed', period: 0.12 }),
    };
    this.primedLabels = { x: new Label(CSS_COLORS.x, 0.046), y: new Label(CSS_COLORS.y, 0.046) };
    this.planeTrace = new Arrow3D({ color: COLORS.plane, radius: 0.028, head: false });
    this.planeLabel = new Label(CSS_COLORS.plane, 0.046);
    this.planeLabel.setParts([['plane']]);

    this.scene.add(
      this.alphaArc, this.alphaLabel.sprite,
      ...Object.values(this.directionArcs).flatMap((entry) => [entry.arc, entry.label.sprite]),
      this.elevationArc, this.elevationLabel.sprite,
      ...Object.values(this.primeAxes).map((entry) => entry.group),
      this.thetaArc, this.thetaLabel.sprite,
      ...Object.values(this.primedArrows).map((arrow) => arrow.group),
      ...Object.values(this.primedLabels).map((label) => label.sprite),
      this.planeTrace.group, this.planeLabel.sprite,
    );
  }

  /** Illustrative props for the "where vectors show up" step. Not to scale. */
  createContextProps() {
    const rockMaterial = new THREE.MeshStandardMaterial({ color: COLORS.prop, roughness: 0.7, transparent: true, opacity: 0.55, depthWrite: false });
    this.rockBlock = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), rockMaterial);

    this.faultPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.8, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.faultOutline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0xd9b27c, transparent: true, opacity: 0.8 }));
    this.faultPlane.add(this.faultOutline);

    this.foldSurface = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x7fa37a, roughness: 0.65, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.foldProfiles = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xc9e3c4, transparent: true, opacity: 0.9 }));
    this.foldSurface.add(this.foldProfiles);
    this.contextProps = { 'rock-face': this.rockBlock, fault: this.faultPlane, 'fold-hinge': this.foldSurface };
    this.scene.add(this.rockBlock, this.faultPlane, this.foldSurface);
  }

  createHighlightGroups() {
    const groups = {
      vector: [this.primaryArrow.group, this.primaryHandle, this.primaryLabel.sprite],
      'vector-a': [this.primaryArrow.group, this.primaryHandle, this.primaryLabel.sprite],
      'comp-x': [this.componentArrows.x.group, this.componentLabels.x.sprite],
      'comp-y': [this.componentArrows.y.group, this.componentLabels.y.sprite],
      'comp-z': [this.componentArrows.z.group, this.componentLabels.z.sprite],
      'axis-x': [this.axisObjects.x],
      'axis-y': [this.axisObjects.y],
      'axis-z': [this.axisObjects.z],
      'xy-diagonal': [this.diagonal.group, this.diagonalLabel.sprite, this.floorTriangle],
      'unit-vector': [this.resultArrow.group, this.resultLabel.sprite, this.unitSphere],
      'scaled-vector': [this.resultArrow.group, this.resultLabel.sprite],
      'vector-b': [this.bArrow.group, this.bHandle, this.bLabel.sprite],
      'vector-sum': [this.resultArrow.group, this.resultLabel.sprite],
      'stack-x': [this.stacks.x.group],
      'stack-y': [this.stacks.y.group],
      'stack-z': [this.stacks.z.group],
      'angle-alpha': [this.alphaArc, this.alphaLabel.sprite, this.directionArcs.x.arc, this.directionArcs.x.label.sprite],
      'angle-beta': [this.directionArcs.y.arc, this.directionArcs.y.label.sprite],
      'angle-gamma': [this.directionArcs.z.arc, this.directionArcs.z.label.sprite],
      'unit-circle': [this.unitSphere],
      'axis-x-prime': [this.primeAxes.x.group],
      'axis-y-prime': [this.primeAxes.y.group],
      'comp-x-prime': [this.primedArrows.x.group, this.primedLabels.x.sprite],
      'comp-y-prime': [this.primedArrows.y.group, this.primedLabels.y.sprite],
      'angle-theta': [this.thetaArc, this.thetaLabel.sprite],
      'elevation-angle': [this.elevationArc, this.elevationLabel.sprite],
      'plane-trace': [this.planeTrace.group, this.planeLabel.sprite],
    };
    const missing = VECTOR_LAB_SCENE_REFS.filter((ref) => !groups[ref] && !CURVE_PLOT_SCENE_REFS.includes(ref));
    if (missing.length) throw new Error(`Scene refs without objects: ${missing.join(', ')}`);
    for (const objects of Object.values(groups)) {
      for (const object of objects) {
        object.traverse((child) => {
          if (child.material && child.userData.baseOpacity === undefined) child.userData.baseOpacity = child.material.opacity;
        });
      }
    }
    return groups;
  }

  bindPointerEvents() {
    this.onPointerDown = (event) => {
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const handles = this.activeHandles();
      const hit = this.raycaster.intersectObjects(handles.map(([, handle]) => handle), false)[0];
      if (!hit) return;
      const [name, handle] = handles.find(([, candidate]) => candidate === hit.object);
      event.preventDefault();
      event.stopPropagation();
      const vertical = event.shiftKey && this.dimension === 3;
      this.dragging = { name, vertical };
      this.controls.enabled = false;
      this.renderer.domElement.setPointerCapture(event.pointerId);
      if (vertical) {
        const facing = this.camera.getWorldDirection(new THREE.Vector3()).setY(0);
        if (facing.lengthSq() < 1e-6) facing.set(0, 0, -1);
        this.dragPlane.setFromNormalAndCoplanarPoint(facing.normalize(), handle.position);
      } else {
        this.dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), handle.position);
      }
      this.renderer.domElement.classList.add('is-dragging-force');
    };

    this.onPointerMove = (event) => {
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (!this.dragging) {
        this.reportHover();
        return;
      }
      event.preventDefault();
      if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) return;
      const point = fromWorld(this.dragIntersection);
      const { name, vertical } = this.dragging;
      if (this.options.polar && name === 'v') {
        // Length-and-angle dragging: the angle snaps to 5°, the length to half units (or stays fixed).
        const angle = Math.round(polarAngle(point) / ANGLE_SNAP) * ANGLE_SNAP;
        const length = this.options.fixedLength ?? Math.min(LIMIT, Math.max(SNAP, Math.round(Math.hypot(point.x, point.y) / SNAP) * SNAP));
        const next = fromPolar(length, angle);
        next.x = Math.round(next.x * 1e9) / 1e9 + 0;
        next.y = Math.round(next.y * 1e9) / 1e9 + 0;
        if (Math.abs(next.x - this.vectors.v.x) < 1e-9 && Math.abs(next.y - this.vectors.v.y) < 1e-9) return;
        this.vectors.v = next;
        this.updateVisuals();
        this.onVectorChange?.('v', { ...next });
        return;
      }
      const currentTip = name === 'b' ? add(this.vectors.v, this.vectors.b) : this.vectors.v;
      let tip = vertical ? { ...currentTip, z: point.z } : { x: point.x, y: point.y, z: currentTip.z };
      if (this.dimension === 2) tip.z = 0;
      tip = snapVector(tip, SNAP);
      let next = name === 'b' ? subtract(tip, this.vectors.v) : tip;
      next = clampVector(next, LIMIT);
      if (magnitude(next) < 1e-9) return;
      const key = name === 'b' ? 'b' : 'v';
      if (next.x === this.vectors[key].x && next.y === this.vectors[key].y && next.z === this.vectors[key].z) return;
      this.vectors[key] = next;
      this.updateVisuals();
      this.onVectorChange?.(key, { ...next });
    };

    this.onPointerUp = (event) => {
      if (!this.dragging) return;
      this.dragging = null;
      this.controls.enabled = true;
      this.renderer.domElement.releasePointerCapture?.(event.pointerId);
      this.renderer.domElement.classList.remove('is-dragging-force');
    };

    this.onPointerLeave = () => this.setHoverRef(null);

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointercancel', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeave);
  }

  activeHandles() {
    const handles = [];
    if (this.options.draggable.includes('v') && this.primaryHandle.visible) handles.push(['v', this.primaryHandle]);
    if (this.options.draggable.includes('b') && this.bHandle.visible) handles.push(['b', this.bHandle]);
    return handles;
  }

  /** Raycast the pickable objects under the pointer and report their scene ref. */
  reportHover() {
    const primaryRef = this.options.layout === 'sum' ? 'vector-a' : 'vector';
    const resultRef = this.options.layout === 'sum' ? 'vector-sum' : this.options.showUnit ? 'unit-vector' : 'scaled-vector';
    const candidates = [
      [primaryRef, this.primaryHandle],
      [primaryRef, this.primaryArrow.shaft],
      [primaryRef, this.primaryArrow.head],
      ['vector-b', this.bHandle],
      ['vector-b', this.bArrow.shaft],
      ['vector-b', this.bArrow.head],
      [resultRef, this.resultArrow.shaft],
      [resultRef, this.resultArrow.head],
      ['comp-x', this.componentArrows.x.shaft],
      ['comp-x', this.componentArrows.x.head],
      ['comp-y', this.componentArrows.y.shaft],
      ['comp-y', this.componentArrows.y.head],
      ['comp-z', this.componentArrows.z.shaft],
      ['comp-z', this.componentArrows.z.head],
      ['xy-diagonal', this.diagonal.shaft],
      ['stack-x', this.stacks.x.aPart.shaft],
      ['stack-x', this.stacks.x.bPart.shaft],
      ['stack-y', this.stacks.y.aPart.shaft],
      ['stack-y', this.stacks.y.bPart.shaft],
      ['stack-z', this.stacks.z.aPart.shaft],
      ['stack-z', this.stacks.z.bPart.shaft],
      ['angle-alpha', this.alphaArc],
      ['angle-alpha', this.directionArcs.x.arc],
      ['angle-beta', this.directionArcs.y.arc],
      ['angle-gamma', this.directionArcs.z.arc],
      ['angle-theta', this.thetaArc],
      ['elevation-angle', this.elevationArc],
      ['comp-x-prime', this.primedArrows.x.shaft],
      ['comp-x-prime', this.primedArrows.x.head],
      ['comp-y-prime', this.primedArrows.y.shaft],
      ['comp-y-prime', this.primedArrows.y.head],
      ['axis-x-prime', this.primeAxes.x.arrow.shaft],
      ['axis-y-prime', this.primeAxes.y.arrow.shaft],
      ['plane-trace', this.planeTrace.shaft],
    ].filter(([, object]) => {
      let visible = object.visible;
      object.traverseAncestors((ancestor) => { if (!ancestor.visible) visible = false; });
      return visible;
    });
    const hits = this.raycaster.intersectObjects(candidates.map(([, object]) => object), false);
    const hitObject = hits[0]?.object;
    this.setHoverRef(candidates.find(([, object]) => object === hitObject)?.[0] ?? null);
  }

  setHoverRef(ref) {
    if (ref === this.hoverRef) return;
    this.hoverRef = ref;
    this.onHover?.(ref);
  }

  updatePointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  updateVisuals() {
    const { layout } = this.options;
    const v = this.vectors.v;
    const origin = new THREE.Vector3();
    const tip = toWorld(v);
    const sumLayout = layout === 'sum';

    this.primaryArrow.set(origin, tip);
    this.primaryHandle.position.copy(tip);
    this.primaryHandle.visible = this.options.draggable.includes('v');
    this.primaryLabel.setParts(sumLayout ? [['a', 'vec']] : [[this.options.fixedLength === 1 ? 'v̂' : 'v', 'vec']]);
    this.placeLabel(this.primaryLabel, v, 0.55);

    // Tip-to-tail addition: b starts at the tip of a.
    const b = this.vectors.b;
    const sum = add(v, b);
    this.bArrow.set(tip, toWorld(sum));
    this.bArrow.group.visible = sumLayout && magnitude(b) > 1e-9;
    this.bHandle.position.copy(toWorld(sum));
    this.bHandle.visible = sumLayout && this.options.draggable.includes('b');
    this.bLabel.sprite.visible = sumLayout;
    this.bLabel.setParts([['b', 'vec']]);
    this.bLabel.sprite.position.copy(toWorld(add(v, scale(b, 0.5)))).add(new THREE.Vector3(0.24, 0, 0));

    // Result vector: a + b, c·v, or the unit vector v̂, depending on the step.
    let result = null;
    let resultParts = [];
    if (sumLayout) {
      result = sum;
      resultParts = [['a', 'vec'], [' + '], ['b', 'vec']];
    } else if (this.options.showUnit && magnitude(v) > 1e-9) {
      result = scale(v, 1 / magnitude(v));
      resultParts = [['v̂', 'vec']];
    } else if (this.options.showScaled) {
      result = scale(v, this.scalar);
      resultParts = [[`${formatNumber(this.scalar)} `], ['v', 'vec']];
    }
    this.resultArrow.group.visible = Boolean(result) && magnitude(result) > 1e-9;
    this.resultLabel.sprite.visible = this.resultArrow.group.visible;
    if (this.resultArrow.group.visible) {
      this.resultArrow.set(origin, toWorld(result));
      this.resultLabel.setParts(resultParts);
      if (this.options.showUnit) {
        this.resultLabel.sprite.position.copy(toWorld(result)).add(new THREE.Vector3(0, 0.16, 0));
      } else {
        this.placeLabel(this.resultLabel, result, sumLayout ? -0.5 : -0.55);
      }
    }
    this.unitSphere.visible = this.options.showUnit || this.options.showUnitCircle;
    this.axisObjects.z.visible = this.dimension === 3;
    for (const meridian of this.unitMeridians) meridian.visible = this.dimension === 3;

    // Component box of v (single layout) or of a + b (sum layout).
    const boxed = sumLayout ? sum : v;
    const showComponents = this.options.showComponents && !sumLayout;
    const corners = { x: { x: boxed.x, y: 0, z: 0 }, y: { x: boxed.x, y: boxed.y, z: 0 }, z: boxed };
    const starts = { x: { x: 0, y: 0, z: 0 }, y: corners.x, z: corners.y };
    // The z label moves outward along the floor direction so it clears the y label near the tip.
    const floorLength = Math.hypot(boxed.x, boxed.y);
    const outward = floorLength > 1e-9 ? toWorld({ x: boxed.x / floorLength, y: boxed.y / floorLength, z: 0 }).normalize() : new THREE.Vector3(1, 0, 0);
    const labelOffsets = {
      x: new THREE.Vector3(0, 0, Math.sign(boxed.y || 1) * 0.3),
      y: new THREE.Vector3(Math.sign(boxed.x || 1) * 0.42, 0, 0),
      z: outward.multiplyScalar(0.5),
    };
    for (const axis of ['x', 'y', 'z']) {
      const arrow = this.componentArrows[axis];
      const label = this.componentLabels[axis];
      arrow.set(toWorld(starts[axis]), toWorld(corners[axis]));
      const visible = showComponents && Math.abs(boxed[axis]) > 1e-9 && !(axis === 'z' && this.dimension === 2);
      arrow.group.visible = visible;
      label.sprite.visible = showComponents && !(axis === 'z' && this.dimension === 2);
      label.setParts(componentParts(sumLayout ? 's' : 'v', axis, boxed[axis], this.options.hideComponentValues));
      const middle = toWorld(scale(add(starts[axis], corners[axis]), 0.5));
      label.sprite.position.copy(middle.add(labelOffsets[axis]));
    }
    setPoints(this.box, boxEdges(boxed));
    this.box.visible = this.options.showComponents || this.options.showStacks;

    this.updateTriangles(v);
    this.updateStacks(v, b, sum);
    this.updateContext(v);
    this.updateAngles(v);
    this.applyHighlight();
  }

  /** M2 objects: the α arc, direction angles, elevation angle, primed axes and components, and the plane trace. */
  updateAngles(v) {
    const options = this.options;
    const length = magnitude(v);
    const floorLength = Math.hypot(v.x, v.y);
    const arcRadius = (reach) => Math.min(Math.max(reach * 0.42, 0.35), 1.5);

    // α: from +x counterclockwise to the vector (in the x–y plane).
    const alpha = polarAngle(v);
    const showAlpha = options.showAngle && floorLength > 1e-9 && alpha > 0.5;
    this.alphaArc.visible = showAlpha;
    this.alphaLabel.sprite.visible = showAlpha;
    if (showAlpha) {
      const radius = arcRadius(floorLength);
      setTube(this.alphaArc, planarArc(radius, 0, alpha), 0.014);
      this.alphaLabel.sprite.position.copy(toWorld(fromPolar(radius + 0.45, alpha / 2)));
    }

    // Direction angles α, β, γ between the vector and each axis (3D).
    const showDirections = options.showDirectionAngles && length > 1e-9;
    const unit = length > 1e-9 ? toWorld(v).normalize() : new THREE.Vector3(1, 0, 0);
    for (const [axis, entry] of Object.entries(this.directionArcs)) {
      const axisUnit = { x: 0, y: 0, z: 0 };
      axisUnit[axis] = 1;
      const from = toWorld(axisUnit).normalize();
      entry.arc.visible = showDirections;
      entry.label.sprite.visible = showDirections;
      if (!showDirections) continue;
      const radius = arcRadius(length) * UNIT * (axis === 'x' ? 1 : axis === 'y' ? 1.15 : 1.3);
      setTube(entry.arc, arcPoints(new THREE.Vector3(), from, unit, radius), 0.014);
      const middle = from.clone().add(unit).normalize();
      entry.label.sprite.position.copy(middle.multiplyScalar(radius + 0.16));
    }

    // ε: from the floor (the vector's shadow) up to the vector.
    const showElevation = options.showElevation && floorLength > 1e-9 && Math.abs(v.z) > 1e-9 && this.dimension === 3;
    this.elevationArc.visible = showElevation;
    this.elevationLabel.sprite.visible = showElevation;
    if (showElevation) {
      const floor = toWorld({ x: v.x, y: v.y, z: 0 }).normalize();
      const radius = arcRadius(length) * UNIT;
      setTube(this.elevationArc, arcPoints(new THREE.Vector3(), floor, unit, radius), 0.014);
      this.elevationLabel.sprite.position.copy(floor.clone().add(unit).normalize().multiplyScalar(radius + 0.16));
    }

    // Primed axes x′, y′: the x and y axes turned by θ about z. The vector does not move.
    const theta = this.theta;
    const showPrimed = options.rotatedAxes;
    // In a close-up view the axis labels and the θ arc come in to stay on screen.
    const reach = this.viewKey.endsWith('close') ? 1.4 : LIMIT;
    for (const [axis, entry] of Object.entries(this.primeAxes)) {
      entry.group.visible = showPrimed;
      if (!showPrimed) continue;
      const angle = axis === 'x' ? theta : theta + 90;
      entry.arrow.set(new THREE.Vector3(), toWorld(fromPolar(LIMIT + 0.8, angle)));
      setPoints(entry.negative, [new THREE.Vector3(), toWorld(fromPolar(-LIMIT, angle))]);
      entry.label.sprite.position.copy(toWorld(fromPolar(reach + (reach < LIMIT ? 0.35 : 1.3), angle)));
    }
    const showTheta = showPrimed && Math.abs(theta) > 0.5;
    this.thetaArc.visible = showTheta;
    this.thetaLabel.sprite.visible = showTheta;
    if (showTheta) {
      const radius = reach * 0.62;
      setTube(this.thetaArc, planarArc(radius, 0, theta), reach < LIMIT ? 0.008 : 0.016);
      this.thetaLabel.sprite.position.copy(toWorld(fromPolar(radius + (reach < LIMIT ? 0.2 : 0.55), theta / 2)));
    }

    // Primed components: v′x along x′, then v′y parallel to y′, ending at the vector's floor point.
    const primed = rotate2D(v, theta);
    const ex = fromPolar(1, theta);
    const ey = fromPolar(1, theta + 90);
    const corner = scale(ex, primed.x);
    const floorTip = add(corner, scale(ey, primed.y));
    const showPrimedComponents = options.showPrimedComponents;
    this.primedArrows.x.set(new THREE.Vector3(), toWorld(corner));
    this.primedArrows.y.set(toWorld(corner), toWorld(floorTip));
    this.primedArrows.x.group.visible = showPrimedComponents && Math.abs(primed.x) > 1e-6;
    this.primedArrows.y.group.visible = showPrimedComponents && Math.abs(primed.y) > 1e-6;
    for (const axis of ['x', 'y']) {
      const label = this.primedLabels[axis];
      label.sprite.visible = showPrimedComponents;
      // Written v′ₓ, as in the equations: the prime marks the turned frame.
      label.setParts(componentParts('v′', axis, primed[axis], options.hideComponentValues));
    }
    // Labels sit outside the primed box, on the side away from the vector.
    const outward = (direction, sign) => toWorld(scale(direction, sign * 0.55));
    this.primedLabels.x.sprite.position.copy(toWorld(scale(corner, 0.5)).add(outward(ey, primed.y >= 0 ? -1 : 1)));
    // A short v′y leg leaves no room beside it, so its label goes past the leg's end instead.
    const legSign = primed.y >= 0 ? 1 : -1;
    const yLabelAt = Math.abs(primed.y) < 1.2 ? add(corner, scale(ey, primed.y / 2 - legSign * 0.75)) : add(corner, scale(ey, primed.y / 2));
    this.primedLabels.y.sprite.position.copy(toWorld(yLabelAt).add(outward(ex, primed.x >= 0 ? 1 : -1)));

    // A plane seen edge-on, normal to x′: the S5 preview.
    const showPlane = options.planeTrace && showPrimed;
    this.planeTrace.group.visible = showPlane;
    this.planeLabel.sprite.visible = showPlane;
    if (showPlane) {
      this.planeTrace.set(toWorld(fromPolar(-LIMIT * 0.8, theta + 90)), toWorld(fromPolar(LIMIT * 0.8, theta + 90)));
      this.planeLabel.sprite.position.copy(toWorld(add(fromPolar(LIMIT * 0.8, theta + 90), fromPolar(-0.6, theta))));
    }
  }

  updateTriangles(v) {
    const show = this.options.showTriangles && this.options.layout !== 'sum';
    const floor = { x: v.x, y: v.y, z: 0 };
    const hasRise = this.dimension === 3 && Math.abs(v.z) > 1e-9;
    this.diagonal.set(new THREE.Vector3(), toWorld(floor));
    this.diagonal.group.visible = show && hasRise && Math.hypot(v.x, v.y) > 1e-9;
    this.diagonalLabel.sprite.visible = this.diagonal.group.visible;
    this.diagonalLabel.setParts([['d', 'var']]);
    this.diagonalLabel.sprite.position.copy(toWorld(scale(floor, 0.5))).add(new THREE.Vector3(0, 0.2, 0));

    const corner = { x: v.x, y: 0, z: 0 };
    setPoints(this.floorTriangle, [new THREE.Vector3(), toWorld(corner), toWorld(floor)]);
    this.floorTriangle.visible = show && Math.abs(v.x) > 1e-9 && Math.abs(v.y) > 1e-9;
    setPoints(this.riseTriangle, [new THREE.Vector3(), toWorld(floor), toWorld(v)]);
    this.riseTriangle.visible = show && hasRise && Math.hypot(v.x, v.y) > 1e-9;

    const marker = (line, at, towardA, towardB, visible) => {
      line.visible = visible;
      if (!visible) return;
      const size = 0.13;
      const p = toWorld(at);
      const u = toWorld(subtract(towardA, at)).normalize().multiplyScalar(size);
      const w = toWorld(subtract(towardB, at)).normalize().multiplyScalar(size);
      setPoints(line, [p.clone().add(u), p.clone().add(u).add(w), p.clone().add(u).add(w), p.clone().add(w)]);
    };
    marker(this.rightAngles[0], corner, { x: 0, y: 0, z: 0 }, floor, this.floorTriangle.visible);
    marker(this.rightAngles[1], floor, { x: 0, y: 0, z: 0 }, v, this.riseTriangle.visible);
  }

  updateStacks(a, b, sum) {
    for (const axis of ['x', 'y', 'z']) {
      const stack = this.stacks[axis];
      const unitAxis = { x: 0, y: 0, z: 0 };
      unitAxis[axis] = 1;
      stack.group.visible = this.options.showStacks && !(axis === 'z' && this.dimension === 2);
      stack.aPart.set(new THREE.Vector3(), toWorld(scale(unitAxis, a[axis])));
      stack.aPart.group.visible = Math.abs(a[axis]) > 1e-9;
      stack.bPart.set(toWorld(scale(unitAxis, a[axis])), toWorld(scale(unitAxis, sum[axis])));
      stack.bPart.group.visible = Math.abs(b[axis]) > 1e-9;
      stack.end.position.copy(toWorld(scale(unitAxis, sum[axis])));
    }
  }

  updateContext(v) {
    const context = this.options.context;
    for (const [name, prop] of Object.entries(this.contextProps)) prop.visible = name === context;
    if (!context || magnitude(v) < 1e-9) return;
    if (context === 'rock-face') {
      // A block whose top face receives the vector's tip.
      const size = { x: 3.2, y: 3.2, z: 2.4 };
      this.rockBlock.scale.set(size.x * UNIT, size.z * UNIT, size.y * UNIT);
      this.rockBlock.position.copy(toWorld({ x: v.x, y: v.y, z: v.z - size.z / 2 }));
      return;
    }
    const along = toWorld(v).normalize();
    let across = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 1, 0));
    if (across.lengthSq() < 1e-6) across = new THREE.Vector3(1, 0, 0);
    across.normalize();
    if (context === 'fault') {
      // A plane containing the slip vector and a horizontal (strike) line.
      const normal = new THREE.Vector3().crossVectors(across, along).normalize();
      const basis = new THREE.Matrix4().makeBasis(across, along, normal);
      this.faultPlane.quaternion.setFromRotationMatrix(basis);
      this.faultPlane.position.copy(toWorld(scale(v, 0.5)));
      const length = Math.max(magnitude(v) + 3, 7) * UNIT;
      this.faultPlane.scale.set(7 * UNIT, length, 1);
      return;
    }
    // Fold hinge: a cylindrical fold whose crest line runs along the vector.
    const up = new THREE.Vector3().crossVectors(across, along).normalize();
    if (up.y < 0) up.negate();
    // Antiform crest on the vector, flanked by synforms: lift = A (cos(2πt/λ) − 1).
    const positions = [];
    const indices = [];
    const profilePoints = [];
    const start = -1.5 * UNIT;
    const end = (magnitude(v) + 1.5) * UNIT;
    const wavelength = 4.4 * UNIT;
    const width = wavelength * 1.25;
    const amplitude = 1.1 * UNIT;
    const rows = 16;
    const columns = 72;
    const pointAt = (s, t) => along.clone().multiplyScalar(s)
      .add(across.clone().multiplyScalar(t))
      .add(up.clone().multiplyScalar(amplitude * (Math.cos((2 * Math.PI * t) / wavelength) - 1) - 0.02));
    for (let row = 0; row <= rows; row += 1) {
      const s = start + (row / rows) * (end - start);
      for (let column = 0; column <= columns; column += 1) {
        const point = pointAt(s, -width + (column / columns) * width * 2);
        positions.push(point.x, point.y, point.z);
      }
    }
    for (const s of [start, end]) {
      for (let column = 0; column < columns; column += 1) {
        profilePoints.push(pointAt(s, -width + (column / columns) * width * 2), pointAt(s, -width + ((column + 1) / columns) * width * 2));
      }
    }
    setPoints(this.foldProfiles, profilePoints);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.foldSurface.geometry.dispose();
    this.foldSurface.geometry = geometry;
  }

  placeLabel(label, vector, side) {
    const length = magnitude(vector);
    const position = toWorld(vector);
    if (length > 1e-9) position.add(toWorld(scale(vector, 0.35 / length)));
    position.y += side > 0 ? 0.2 : -0.2;
    label.sprite.position.copy(position);
  }

  /** Dim every bindable object except the highlighted one (equation–model binding). */
  applyHighlight() {
    const active = this.highlightRef && this.highlightGroups[this.highlightRef] ? this.highlightRef : null;
    const activeObjects = new Set(active ? this.highlightGroups[active] : []);
    for (const objects of Object.values(this.highlightGroups)) {
      for (const object of objects) {
        const factor = active && !activeObjects.has(object) ? DIMMED_OPACITY_FACTOR : 1;
        object.traverse((child) => {
          if (!child.material) return;
          child.material.transparent = true;
          child.material.opacity = (child.userData.baseOpacity ?? 1) * factor;
        });
      }
    }
  }

  highlight(ref) {
    this.highlightRef = ref;
    this.applyHighlight();
  }

  /** Update what the scene shows. `vectors.v` is the primary vector (a in the sum layout). */
  setState({ vectors, scalar, options, theta }) {
    if (options) this.options = { ...this.defaultOptions, ...options };
    if (theta !== undefined) this.theta = theta;
    if (vectors?.v) this.vectors.v = { ...vectors.v };
    if (vectors?.b) this.vectors.b = { ...vectors.b };
    if (scalar !== undefined) this.scalar = scalar;
    this.updateVisuals();
  }

  /**
   * Switch between the 2D (x–y, seen from above) and 3D views, animating the
   * camera. `close` frames the region near the origin (for the unit sphere).
   */
  setDimension(dimension, { animate = true, close = false } = {}) {
    const viewKey = dimension === 2 ? (close ? '2d-close' : '2d') : close ? '3d-close' : '3d';
    if (viewKey === this.viewKey) return;
    this.dimension = dimension;
    this.viewKey = viewKey;
    this.controls.enableRotate = dimension === 3;
    // Close-up views are about three times nearer, so arrows are drawn thinner to keep their on-screen weight.
    const thickness = viewKey.endsWith('close') ? 0.4 : 1;
    for (const arrow of this.allArrows) arrow.setThickness(thickness);
    this.flyTo(this.fittedView(viewKey), animate && !this.reducedMotion);
    this.updateVisuals();
  }

  /** The named view, pulled back on narrow (portrait) viewports so the axes still fit. */
  fittedView(viewKey) {
    const view = VIEWS[viewKey];
    const factor = Math.max(1, 1.25 / Math.max(this.camera.aspect, 0.1));
    const position = view.position.clone().sub(view.target).multiplyScalar(factor).add(view.target);
    return { ...view, position };
  }

  flyTo(view, animate) {
    const from = { position: this.camera.position.clone(), up: this.camera.up.clone(), target: this.controls.target.clone() };
    if (!animate) {
      this.camera.position.copy(view.position);
      this.camera.up.copy(view.up);
      this.controls.target.copy(view.target);
      this.camera.lookAt(this.controls.target);
      this.cameraAnimation = null;
      return;
    }
    this.cameraAnimation = { from, to: view, start: performance.now(), duration: 1100 };
  }

  stepCameraAnimation(now) {
    const animation = this.cameraAnimation;
    const progress = Math.min((now - animation.start) / animation.duration, 1);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    // Interpolate on a sphere so the camera swings around the origin rather than cutting through it.
    const fromSpherical = new THREE.Spherical().setFromVector3(animation.from.position.clone().sub(animation.from.target));
    const toSpherical = new THREE.Spherical().setFromVector3(animation.to.position.clone().sub(animation.to.target));
    let thetaDelta = toSpherical.theta - fromSpherical.theta;
    if (Math.abs(thetaDelta) > Math.PI) thetaDelta -= Math.sign(thetaDelta) * Math.PI * 2;
    const spherical = new THREE.Spherical(
      THREE.MathUtils.lerp(fromSpherical.radius, toSpherical.radius, eased),
      THREE.MathUtils.lerp(fromSpherical.phi, toSpherical.phi, eased),
      fromSpherical.theta + thetaDelta * eased,
    );
    this.controls.target.copy(animation.from.target).lerp(animation.to.target, eased);
    this.camera.position.setFromSpherical(spherical).add(this.controls.target);
    this.camera.up.copy(animation.from.up).lerp(animation.to.up, eased).normalize();
    this.camera.lookAt(this.controls.target);
    if (progress >= 1) this.cameraAnimation = null;
  }

  resetCamera() {
    this.flyTo(this.fittedView(this.viewKey), false);
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    // The 2D view cannot be orbited, so it can always be refitted to the new shape.
    if (this.viewKey.startsWith('2d') && !this.cameraAnimation) this.flyTo(this.fittedView(this.viewKey), false);
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    if (this.cameraAnimation) this.stepCameraAnimation(performance.now());
    else this.controls.update();
    // Keep the drag handles about the same size on screen at any zoom.
    const handleScale = this.camera.position.distanceTo(this.controls.target) / 7.2;
    this.primaryHandle.scale.setScalar(handleScale);
    this.bHandle.scale.setScalar(handleScale);
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
