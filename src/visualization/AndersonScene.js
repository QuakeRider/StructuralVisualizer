import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { andersonFaults, faultSlip, principalStressTensor } from '../domain/anderson.js';
import { planePole, planeUpwardNormal, strikeVector } from '../domain/orientation.js';
import { applyTensor } from '../domain/tensor.js';
import { CENTER, HALF, VIEW, axisWorld, exitDistance, fanGeometry, groundTexture, layerTexture, loopSegments, overlayArrow, planeSection, toWorld } from './earthBlock.js';
import { Arrow3D, Label, arcPoints, setPoints, setTube, tubeMesh } from './sceneKit.js';

const DIMMED_OPACITY_FACTOR = 0.14;
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
  plane: 0xd9b27c,
  pole: 0xf4f5f7,
  traction: 0xe69f00,
  normalStress: 0x9a8cff,
  shearStress: 0xcc79a7,
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
  plane: '#d9b27c',
  pole: '#f4f5f7',
  traction: '#e69f00',
  normalStress: '#9a8cff',
  shearStress: '#cc79a7',
};
/** World units per MPa for the traction arrows on an existing plane (B6). */
const TRACTION_SCALE = 1 / 110;

/** Glyph size and line pattern by rank, so σ1, σ2, σ3 read without color. */
const GLYPHS = {
  sigma1: { radius: 0.07, length: 1.15, pattern: 'solid', head: 0.3, headRadius: 0.16 },
  sigma2: { radius: 0.05, length: 0.85, pattern: 'dashed', head: 0.24, headRadius: 0.12 },
  sigma3: { radius: 0.035, length: 0.55, pattern: 'dotted', head: 0.2, headRadius: 0.09 },
};

/**
 * Earth-block laboratory in the NED frame, used by B7 (Anderson) and B6
 * (friction). It draws the three principal-stress glyphs and the conjugate
 * Coulomb fault pair cut through the block, with the angles β (σ1 to fault)
 * and δ (dip), and slides the hanging wall along the resolved shear
 * direction. Given an existing plane (B6), that plane splits the block
 * instead, with its pole 𝐧 and the traction 𝐭 on it split into σn and τ
 * parts; the Coulomb pair then stands for a new fault in intact rock.
 * Equation symbols highlight scene objects by reference (sceneRefs.js), and
 * hovering an object reports its reference through onHover.
 */
export class AndersonScene {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.defaultOptions = { showAxes: true, showFaults: true, showConjugate: true, showAngles: true, showSlip: false, showTraction: false, showPole: false, canSlip: true };
    this.options = { ...this.defaultOptions };
    this.regime = 'normal';
    this.mu = 0.6;
    this.shmaxTrend = 0;
    this.plane = null;
    this.magnitudes = null;
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
    this.createExistingPlane();
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

  /** A pre-existing weak plane (B6) with its pole and the traction acting on it. */
  createExistingPlane() {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: COLORS.plane, roughness: 0.6, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    mesh.renderOrder = 5;
    const outline = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COLORS.plane, transparent: true }));
    outline.renderOrder = 6;
    this.existing = { group: new THREE.Group(), mesh, outline };
    this.existing.group.add(mesh, outline);
    this.scene.add(this.existing.group);

    this.poleArrow = overlayArrow({ color: COLORS.pole, radius: 0.022, headLength: 0.16, headRadius: 0.07 });
    this.tractionArrow = overlayArrow({ color: COLORS.traction, radius: 0.04, headLength: 0.2, headRadius: 0.1 });
    this.normalArrow = overlayArrow({ color: COLORS.normalStress, radius: 0.03, headLength: 0.18, headRadius: 0.085, pattern: 'dashed', period: 0.12 });
    this.shearArrow = overlayArrow({ color: COLORS.shearStress, radius: 0.03, headLength: 0.18, headRadius: 0.085, pattern: 'dashed', period: 0.12 });
    const label = (color, parts) => {
      const sprite = new Label(color, 0.05);
      sprite.setParts(parts);
      return sprite;
    };
    this.poleLabel = label(CSS_COLORS.pole, [['n', 'vec']]);
    this.tractionLabel = label(CSS_COLORS.traction, [['t', 'vec']]);
    this.normalLabel = label(CSS_COLORS.normalStress, [['σ', 'var'], ['n', 'sub']]);
    this.shearLabel = label(CSS_COLORS.shearStress, [['τ', 'var']]);
    this.poleGroup = new THREE.Group();
    this.poleGroup.add(this.poleArrow.group, this.poleLabel.sprite);
    this.tractionGroup = new THREE.Group();
    this.tractionGroup.add(this.tractionArrow.group, this.tractionLabel.sprite);
    this.normalGroup = new THREE.Group();
    this.normalGroup.add(this.normalArrow.group, this.normalLabel.sprite);
    this.shearGroup = new THREE.Group();
    this.shearGroup.add(this.shearArrow.group, this.shearLabel.sprite);
    this.scene.add(this.poleGroup, this.tractionGroup, this.normalGroup, this.shearGroup);
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
      ...[['pole', this.poleArrow], ['traction', this.tractionArrow], ['normal-stress', this.normalArrow], ['shear-stress', this.shearArrow]].flatMap(([ref, arrow]) => [[ref, arrow.shaft], [ref, arrow.head]]),
      ['plane', this.existing.mesh],
      ['free-surface', this.surfaceOverlay],
    ].filter(([, object]) => {
      let visible = object.visible;
      object.traverseAncestors((ancestor) => { if (!ancestor.visible) visible = false; });
      return visible;
    });
    const hit = this.raycaster.intersectObjects(candidates.map(([, object]) => object), false)[0];
    const ref = candidates.find(([, object]) => object === hit?.object)?.[0] ?? null;
    // With an existing plane (B6) the Coulomb pair is the new fault that would form instead.
    this.setHoverRef(this.plane && (ref === 'fault' || ref === 'conjugate') ? 'new-fault' : ref);
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
    const tensor = principalStressTensor(axes, this.magnitudes ?? SLIP_STRESS);
    const weak = this.plane;

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

    // The block splits along the existing plane (B6) or the active fault (B7).
    const splitPlane = weak ?? active;
    const splitNormal = toWorld(planeUpwardNormal(splitPlane));
    this.existing.group.visible = Boolean(weak);
    if (weak) {
      const polygon = planeSection(splitNormal);
      this.existing.mesh.geometry.dispose();
      this.existing.mesh.geometry = fanGeometry(polygon);
      this.existing.mesh.geometry.computeVertexNormals();
      setPoints(this.existing.outline, loopSegments(polygon));
    }
    // The hanging wall (upward-normal side) is clipped from the footwall.
    this.clipPlanes.hanging.setFromNormalAndCoplanarPoint(splitNormal, CENTER);
    this.clipPlanes.foot.copy(this.clipPlanes.hanging).negate();
    const { slip } = faultSlip(tensor, splitPlane);
    this.slipDirection = slip ? toWorld(slip) : new THREE.Vector3();
    const canSlip = weak ? this.options.canSlip : this.options.showFaults;
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

    this.updateTraction(tensor, weak, splitNormal);

    // Slip arrows on either side of the split plane, away from the angle markers.
    const along = toWorld(strikeVector(splitPlane));
    // On a vertical fault the β arc sits on the σ1 side of the ground, so the arrows go to the other side.
    const anchor = (sectionIsHorizontal ? new THREE.Vector3(0, 0.02, 0) : CENTER.clone()).add(along.multiplyScalar(sectionIsHorizontal ? -1.2 : 1.35));
    const offset = splitNormal.clone().multiplyScalar(0.22);
    const half = this.slipDirection.clone().multiplyScalar(0.42);
    this.slipArrows[0].set(anchor.clone().add(offset).sub(half), anchor.clone().add(offset).add(half));
    this.slipArrows[1].set(anchor.clone().sub(offset).add(half), anchor.clone().sub(offset).sub(half));
    this.slipGroup.visible = canSlip && this.options.showSlip && Boolean(slip);

    this.applyHighlight();
  }

  /**
   * The traction on the existing plane, drawn where the plane meets the block
   * center. 𝐧 is the downward pole (the stereonet pole), which points into
   * the footwall, so 𝐭 = σ𝐧 is the push of the hanging wall on the footwall
   * (compression positive). Its normal part σn𝐧 points along 𝐧 and its
   * shear part 𝛕 lies in the plane, the way the hanging wall would slide.
   */
  updateTraction(tensor, weak, upward) {
    const pole = upward.clone().negate();
    this.poleGroup.visible = Boolean(weak) && this.options.showPole;
    const visible = Boolean(weak) && this.options.showTraction;
    for (const group of [this.tractionGroup, this.normalGroup, this.shearGroup]) group.visible = visible;
    if (!weak) return;
    const along = toWorld(strikeVector(weak));
    // The pole sits beside the traction arrows so the two never overlap.
    const poleAnchor = CENTER.clone().add(along.clone().multiplyScalar(this.options.showTraction ? -1.05 : 0));
    this.poleArrow.set(poleAnchor, poleAnchor.clone().add(pole.clone().multiplyScalar(0.9)));
    this.poleLabel.sprite.position.copy(poleAnchor.clone().add(pole.clone().multiplyScalar(1.14)));
    if (!visible) return;
    const anchor = CENTER.clone();
    const t = toWorld(applyTensor(tensor, planePole(weak))).multiplyScalar(TRACTION_SCALE);
    const normalPart = pole.clone().multiplyScalar(t.dot(pole));
    const shear = t.clone().sub(normalPart);
    const hasShear = shear.length() > 1e-4;
    const side = hasShear ? shear.clone().normalize().multiplyScalar(-0.26) : new THREE.Vector3();
    this.tractionArrow.set(anchor, anchor.clone().add(t));
    this.tractionLabel.sprite.position.copy(anchor.clone().add(t.clone().multiplyScalar(1.12)));
    this.normalArrow.set(anchor, anchor.clone().add(normalPart));
    this.normalLabel.sprite.position.copy(anchor.clone().add(normalPart.clone().multiplyScalar(0.55)).add(side));
    this.shearArrow.set(anchor, anchor.clone().add(shear));
    this.shearLabel.sprite.visible = hasShear;
    this.shearLabel.sprite.position.copy(anchor.clone().add(shear.clone().multiplyScalar(1.12)).add(upward.clone().multiplyScalar(0.2)));
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
      'new-fault': [this.fault.group, this.conjugate.group],
      plane: [this.existing.group],
      pole: [this.poleGroup],
      traction: [this.tractionGroup],
      'normal-stress': [this.normalGroup],
      'shear-stress': [this.shearGroup],
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

  setState({ regime, mu, shmaxTrend, plane, magnitudes, options }) {
    if (options) this.options = { ...this.defaultOptions, ...options };
    if (plane !== undefined) this.plane = plane;
    if (magnitudes !== undefined) this.magnitudes = magnitudes;
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
    const allowed = this.plane ? this.options.canSlip : this.options.showFaults;
    this.slipTarget = slipped && allowed ? 1 : 0;
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
