import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { contourRadius, displacementAt, faultDisplacement } from '../domain/faultGrowth.js';
import { dipVector, planePole, planeUpwardNormal, strikeVector } from '../domain/orientation.js';
import { BOX_MAX, BOX_MIN, CENTER, HALF, VIEW, boxSection, overlayArrow, toWorld } from './earthBlock.js';
import { displacementColor } from './plotKit.js';
import { Arrow3D, Label } from './sceneKit.js';

const DIMMED_OPACITY_FACTOR = 0.14;
/** The 3D camera for this lab: a little closer than the other Earth blocks, so the beds read. */
const GROWTH_VIEW = { position: new THREE.Vector3(5.3, 3.9, 6.5), target: new THREE.Vector3(0, -1.05, 0) };
const CUT_VIEW_POSITION = new THREE.Vector3(2.4, 3.1, 8.3);
/** Horizon shading by depth for structure maps (relay steps): high is light, low is dark. */
const SHADE = { high: new THREE.Color('#f3e6c4'), low: new THREE.Color('#4a3322') };
/** Grid cells across a horizon (each way). */
const GRID_CELLS = 160;

const COLORS = {
  fault: 0xd9b27c,
  tipLine: 0xf4f5f7,
  contour: 0xf4f5f7,
  section: 0x56b4e9,
  sectionLine: 0xf4f5f7,
  offset: 0xcc79a7,
  profile: 0xe69f00,
  processZone: 0xcc79a7,
  edge: 0xd8dde4,
  compass: 0xc3c8d0,
  dimension: 0xc3c8d0,
};

const CSS = {
  label: '#f4f5f7',
  tipLine: '#f4f5f7',
  contour: '#f4f5f7',
  offset: '#cc79a7',
  profile: '#e69f00',
  processZone: '#e7a6cb',
  segment: '#f4f5f7',
  ramp: '#3fd0a0',
  compass: '#c3c8d0',
  dimension: '#c3c8d0',
};

/** Structure contours on a horizon: a thin dark line at each whole value of v. */
function contourTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, 4, 64);
  context.fillStyle = '#34302c';
  context.fillRect(0, 0, 4, 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Thick lines with a constant width on screen (WebGL lines are one pixel wide). */
class FatLines {
  constructor(color, width, { overlay = false, opacity = 1, dashed = false } = {}) {
    this.material = new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthTest: !overlay, dashed, dashSize: 0.08, gapSize: 0.06 });
    this.object = new LineSegments2(new LineSegmentsGeometry(), this.material);
    this.object.renderOrder = overlay ? 13 : 8;
    this.object.visible = false;
    this.dashed = dashed;
  }

  /** Draw polylines (arrays of world points); `closed` joins each back to its start. */
  set(polylines, closed = false) {
    const positions = [];
    for (const points of polylines) {
      const count = closed ? points.length : points.length - 1;
      for (let index = 0; index < count; index += 1) {
        const a = points[index];
        const b = points[(index + 1) % points.length];
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    this.object.geometry.dispose();
    this.object.geometry = new LineSegmentsGeometry();
    this.object.visible = positions.length > 0;
    if (!positions.length) return;
    this.object.geometry.setPositions(positions);
    if (this.dashed) this.object.computeLineDistances();
  }
}

/**
 * Fault displacement and growth (B9) in the NED frame. Marker horizons
 * (bedding surfaces) are moved by the displacement field of one or more
 * normal faults (from faultGrowth.js), so their offset shrinks to zero at each
 * fault's tip line, they bend near the fault (drag), and they tilt across a
 * relay ramp. Each fault surface is colored by its displacement D, with
 * contours and the tip line. Setups: 'isolated' (one elliptical fault in a
 * 1 km block), 'relay' (two segments, their relay ramp, process zones ahead of
 * the growing tips, and a breach), and 'through' (a fault whose tips are far
 * away, for drag). The fault zone's anatomy is B11's (FaultZoneScene.js).
 * Scene refs: GROWTH_SCENE_REFS in sceneRefs.js.
 */
export class FaultGrowthScene {
  constructor(container, { onHover } = {}) {
    this.container = container;
    this.onHover = onHover;
    this.model = null;
    this.highlightRef = null;
    this.hoverRef = null;
    this.view = '3d';
    this.lineMaterials = [];

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.copy(VIEW.position);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.localClippingEnabled = true;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Block of crust in the north–east–down frame with marker beds offset by a normal fault; the fault surface is colored by how far it slipped.');
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 24;
    this.controls.target.copy(GROWTH_VIEW.target);
    this.camera.lookAt(GROWTH_VIEW.target);
    this.userMoved = false;
    this.controls.addEventListener('start', () => { this.userMoved = true; });
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    // Extra clipping: the section cut (rock south of it removed) and the top of the fault surfaces.
    this.cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    this.topPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2e36, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(4, 7, 5);
    this.scene.add(key);

    // Everything is clipped to the block, so moved rock that leaves it is cut off at its faces.
    const margin = 1e-3;
    this.blockPlanes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), HALF.x + margin),
      new THREE.Plane(new THREE.Vector3(1, 0, 0), HALF.x + margin),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), margin),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 2 * HALF.y + margin),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), HALF.z + margin),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), HALF.z + margin),
    ];
    this.contourMap = contourTexture();
    this.createBlock();
    this.createCompass();
    this.createHorizons();
    this.createSurfaces();
    this.createSection();
    this.createLabels();
    this.bindPointerEvents();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  fatLines(color, width, options) {
    const lines = new FatLines(color, width, options);
    this.lineMaterials.push(lines.material);
    return lines;
  }

  label(color, height = 0.044) {
    const label = new Label(color, height);
    this.scene.add(label.sprite);
    label.sprite.visible = false;
    return label;
  }

  createBlock() {
    const fill = new THREE.Mesh(new THREE.BoxGeometry(2 * HALF.x, 2 * HALF.y, 2 * HALF.z), new THREE.MeshBasicMaterial({ color: 0x8d95a3, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.BackSide }));
    fill.position.copy(CENTER);
    this.edges = this.fatLines(COLORS.edge, 1.6, { opacity: 0.6 });
    const c = (x, y, z) => new THREE.Vector3(x ? BOX_MAX.x : BOX_MIN.x, y ? BOX_MAX.y : BOX_MIN.y, z ? BOX_MAX.z : BOX_MIN.z);
    const pairs = [
      [[0, 0, 0], [1, 0, 0]], [[0, 1, 0], [1, 1, 0]], [[0, 0, 1], [1, 0, 1]], [[0, 1, 1], [1, 1, 1]],
      [[0, 0, 0], [0, 1, 0]], [[1, 0, 0], [1, 1, 0]], [[0, 0, 1], [0, 1, 1]], [[1, 0, 1], [1, 1, 1]],
      [[0, 0, 0], [0, 0, 1]], [[1, 0, 0], [1, 0, 1]], [[0, 1, 0], [0, 1, 1]], [[1, 1, 0], [1, 1, 1]],
    ];
    this.edges.set(pairs.map(([a, b]) => [c(...a), c(...b)]));
    this.scene.add(fill, this.edges.object);
  }

  createCompass() {
    this.compass = new THREE.Group();
    this.scene.add(this.compass);
    const origin = new THREE.Vector3();
    for (const [name, direction, axis] of [['N', { x: 1, y: 0, z: 0 }, 'x'], ['E', { x: 0, y: 1, z: 0 }, 'y'], ['D', { x: 0, y: 0, z: 1 }, 'z']]) {
      const arrow = new Arrow3D({ color: COLORS.compass, radius: 0.018, headLength: 0.16, headRadius: 0.06 });
      arrow.set(origin, origin.clone().add(toWorld(direction).multiplyScalar(0.75)));
      const label = new Label(CSS.compass, 0.042);
      label.setParts([[name], [` (${axis})`, 'var']]);
      label.sprite.position.copy(origin.clone().add(toWorld(direction).multiplyScalar(1.12)));
      this.compass.add(arrow.group, label.sprite);
    }
    // Scale bar along the south edge of the block.
    this.scaleBar = overlayArrow({ color: COLORS.dimension, radius: 0.012, head: false });
    this.scaleLabel = new Label(CSS.dimension, 0.036);
    this.scene.add(this.scaleBar.group, this.scaleLabel.sprite);
  }

  createHorizons() {
    this.horizonGroup = new THREE.Group();
    this.horizons = Array.from({ length: 4 }, () => {
      const material = new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.DoubleSide, clippingPlanes: this.blockPlanes, transparent: true });
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
      mesh.visible = false;
      this.horizonGroup.add(mesh);
      return mesh;
    });
    this.scene.add(this.horizonGroup);
  }

  createSurfaces() {
    this.surfaceGroup = new THREE.Group();
    this.surfaces = Array.from({ length: 3 }, () => {
      const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.92, clippingPlanes: this.blockPlanes, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
      mesh.renderOrder = 4;
      mesh.visible = false;
      this.surfaceGroup.add(mesh);
      return mesh;
    });
    this.tipLines = this.fatLines(COLORS.tipLine, 4.5);
    this.contourLines = this.fatLines(COLORS.contour, 2, { opacity: 0.8 });
    this.contourLabels = Array.from({ length: 5 }, () => this.label(CSS.contour, 0.034));
    this.profileLine = this.fatLines(COLORS.profile, 5, { overlay: true });
    this.profileLabel = this.label(CSS.profile, 0.04);
    this.scene.add(this.surfaceGroup, this.tipLines.object, this.contourLines.object, this.profileLine.object);
  }

  createSection() {
    this.sectionGroup = new THREE.Group();
    this.sectionPlane = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF.x, 2 * HALF.y), new THREE.MeshBasicMaterial({ color: COLORS.section, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
    this.sectionEdges = this.fatLines(COLORS.section, 2.4, { opacity: 0.9 });
    this.sectionLines = this.fatLines(COLORS.sectionLine, 3.2, { overlay: true });
    this.sectionGroup.add(this.sectionPlane, this.sectionEdges.object, this.sectionLines.object);
    this.offsetArrow = overlayArrow({ color: COLORS.offset, radius: 0.03, headLength: 0.13, headRadius: 0.075 });
    this.offsetLabel = this.label(CSS.offset, 0.046);
    this.offsetGroup = new THREE.Group();
    this.offsetGroup.add(this.offsetArrow.group);
    this.scene.add(this.sectionGroup, this.offsetGroup);
  }

  createLabels() {
    this.wallLabels = { foot: this.label(CSS.label), hanging: this.label(CSS.label) };
    this.wallLabels.foot.setParts([['footwall']]);
    this.wallLabels.hanging.setParts([['hanging wall']]);
    this.tipLabel = this.label(CSS.tipLine, 0.04);
    this.tipLabel.setParts([['tip line']]);
    this.segmentLabels = { A: this.label(CSS.segment, 0.05), B: this.label(CSS.segment, 0.05), breach: this.label(CSS.segment, 0.042) };
    this.segmentLabels.A.setParts([['fault A']]);
    this.segmentLabels.B.setParts([['fault B']]);
    this.segmentLabels.breach.setParts([['breach']]);
    this.rampLabel = this.label(CSS.ramp, 0.046);
    this.rampOutline = this.fatLines(0x3fd0a0, 3, { dashed: true, overlay: true });
    this.scene.add(this.rampOutline.object);
    this.rampLabel.setParts([['relay ramp']]);
    // Process zones: cracked rock ahead of each growing tip (B11 callback).
    this.processOutline = this.fatLines(COLORS.processZone, 2.6, { dashed: true, overlay: true });
    this.processLabel = this.label(CSS.processZone, 0.04);
    this.processLabel.setParts([['process zone']]);
    this.scene.add(this.processOutline.object);
    this.dimension = { arrows: [0, 1].map(() => overlayArrow({ color: COLORS.dimension, radius: 0.012, headLength: 0.1, headRadius: 0.045 })), label: this.label(CSS.dimension, 0.042) };
    for (const arrow of this.dimension.arrows) this.scene.add(arrow.group);
  }

  /* ---------- Geometry helpers ---------- */

  /** NED metres → world. */
  world(point) {
    return toWorld(point).multiplyScalar(1 / this.model.metersPerUnit);
  }

  faultD(fault, u, w) {
    return fault.profile ? fault.profile(u, w) : displacementAt(fault.field, u, w);
  }

  /** Where a point of rock at `point` (NED) ends up after all the faults moved it, with each fault's side and D there. */
  moved(point) {
    const result = { x: point.x, y: point.y, z: point.z };
    const sides = [];
    const values = [];
    const distances = [];
    for (const fault of this.model.faults) {
      const motion = faultDisplacement(point, fault);
      result.x += motion.vector.x;
      result.y += motion.vector.y;
      result.z += motion.vector.z;
      sides.push(motion.side === 'hanging' ? 1 : 0);
      values.push(motion.D);
      distances.push(motion.d);
    }
    return { point: result, sides, values, distances };
  }

  /** North–south lines where a strike-north fault meets the depth z (extra grid columns keep the cutoffs sharp). */
  traceColumns(depth) {
    const columns = [];
    for (const fault of this.model.faults) {
      if (Math.abs(Math.sin((fault.plane.strike * Math.PI) / 180)) > 1e-6) continue;
      const down = dipVector(fault.plane);
      const y = fault.center.y + ((depth - fault.center.z) / down.z) * down.y;
      const epsilon = 1e-3 * this.model.metersPerUnit;
      columns.push(y - epsilon, y + epsilon);
    }
    return columns;
  }

  /* ---------- Updates ---------- */

  /** Clipping planes: the block, the section cut when the rock south of the section is removed, and optionally the top of the fault surfaces. */
  clipping({ top = false } = {}) {
    const model = this.model;
    const planes = [...this.blockPlanes];
    if (model.section?.cut) {
      this.cutPlane.constant = -model.section.x / model.metersPerUnit;
      planes.push(this.cutPlane);
    }
    if (top && model.surfaceTop !== undefined && model.surfaceTop !== null) {
      this.topPlane.constant = -model.surfaceTop / model.metersPerUnit;
      planes.push(this.topPlane);
    }
    return planes;
  }

  updateHorizons() {
    const model = this.model;
    const options = model.options;
    const mpu = model.metersPerUnit;
    const extentX = HALF.z * mpu * 1.04;
    const extentY = HALF.x * mpu * 1.04;
    const threshold = 0.004 * mpu;
    const hideFault = options.showHangingWall === false ? 0 : -1;
    this.horizons.forEach((mesh, index) => {
      const horizon = model.horizons[index];
      mesh.visible = Boolean(horizon);
      if (!horizon) return;
      const xs = Array.from({ length: GRID_CELLS + 1 }, (_, i) => -extentX + (2 * extentX * i) / GRID_CELLS);
      const ys = [...Array.from({ length: GRID_CELLS + 1 }, (_, j) => -extentY + (2 * extentY * j) / GRID_CELLS), ...this.traceColumns(horizon.depth)].sort((a, b) => a - b);
      const nx = xs.length;
      const ny = ys.length;
      const faultCount = model.faults.length;
      const positions = new Float32Array(nx * ny * 3);
      const uvs = new Float32Array(nx * ny * 2);
      const shading = model.horizonShading;
      const colors = shading ? new Float32Array(nx * ny * 3) : null;
      const shade = new THREE.Color();
      const sides = new Uint8Array(nx * ny * faultCount);
      const values = new Float32Array(nx * ny * faultCount);
      for (let i = 0; i < nx; i += 1) {
        for (let j = 0; j < ny; j += 1) {
          const v = i * ny + j;
          const result = this.moved({ x: xs[i], y: ys[j], z: horizon.depth });
          const world = this.world(result.point);
          positions.set([world.x, world.y, world.z], v * 3);
          uvs.set([0, (result.point.z - horizon.depth) / model.contourInterval + 0.5], v * 2);
          if (colors) {
            const t = THREE.MathUtils.clamp((result.point.z - horizon.depth + shading.range) / (2 * shading.range), 0, 1);
            shade.copy(SHADE.high).lerp(SHADE.low, t);
            colors.set([shade.r, shade.g, shade.b], v * 3);
          }
          for (let f = 0; f < faultCount; f += 1) {
            sides[v * faultCount + f] = result.sides[f];
            values[v * faultCount + f] = result.values[f];
          }
        }
      }
      const keep = (a, b, c) => {
        for (let f = 0; f < faultCount; f += 1) {
          const sa = sides[a * faultCount + f];
          const sb = sides[b * faultCount + f];
          const sc = sides[c * faultCount + f];
          if (f === hideFault && (sa || sb || sc)) return false;
          if ((sa !== sb || sa !== sc) && Math.max(values[a * faultCount + f], values[b * faultCount + f], values[c * faultCount + f]) > threshold) return false;
        }
        return true;
      };
      const indices = [];
      for (let i = 0; i < nx - 1; i += 1) {
        for (let j = 0; j < ny - 1; j += 1) {
          const a = i * ny + j;
          const b = (i + 1) * ny + j;
          const c = i * ny + j + 1;
          const d = (i + 1) * ny + j + 1;
          if (keep(a, b, d)) indices.push(a, b, d);
          if (keep(a, d, c)) indices.push(a, d, c);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      if (colors) geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      mesh.geometry.dispose();
      mesh.geometry = geometry;
      const map = options.bedContours ? this.contourMap : null;
      if (mesh.material.map !== map || mesh.material.vertexColors !== Boolean(colors)) {
        mesh.material.map = map;
        mesh.material.vertexColors = Boolean(colors);
        mesh.material.needsUpdate = true;
      }
      mesh.material.color.set(colors ? '#ffffff' : horizon.color);
      mesh.material.clippingPlanes = this.clipping();
      mesh.userData.depth = horizon.depth;
    });
  }

  /** Point on a fault at (u, w), nudged toward the hanging wall so lines sit on top of the surface. */
  faultPoint(fault, u, w, lift = 0) {
    const s = strikeVector(fault.plane);
    const d = dipVector(fault.plane);
    const up = planeUpwardNormal(fault.plane);
    const c = fault.center;
    const lifted = lift * this.model.metersPerUnit;
    return this.world({ x: c.x + u * s.x + w * d.x + lifted * up.x, y: c.y + u * s.y + w * d.y + lifted * up.y, z: c.z + u * s.z + w * d.z + lifted * up.z });
  }

  updateSurfaces() {
    const model = this.model;
    const options = model.options;
    const tipPolylines = [];
    const contourPolylines = [];
    const labelSpots = [];
    const neutral = new THREE.Color(COLORS.fault);
    this.surfaces.forEach((mesh, index) => {
      const fault = model.faults[index];
      const surface = fault?.surface;
      mesh.visible = Boolean(surface) && options.showFaultSurface !== false;
      mesh.userData.ref = fault?.ref ?? 'fault';
      if (!mesh.visible) return;
      const positions = [];
      const colors = [];
      const indices = [];
      const color = (u, w) => (options.colorFault ? new THREE.Color(displacementColor(this.faultD(fault, u, w) / model.colorMax)) : neutral);
      const push = (u, w) => {
        const point = this.faultPoint(fault, u, w);
        positions.push(point.x, point.y, point.z);
        const c = color(u, w);
        colors.push(c.r, c.g, c.b);
      };
      if (surface.kind === 'ellipse') {
        const rings = 22;
        const sectors = 96;
        push(surface.u0 ?? 0, 0);
        for (let ring = 1; ring <= rings; ring += 1) {
          const r = ring / rings;
          for (let sector = 0; sector < sectors; sector += 1) {
            const angle = (sector / sectors) * Math.PI * 2;
            push((surface.u0 ?? 0) + surface.a * r * Math.cos(angle), surface.b * r * Math.sin(angle) * 0.999);
          }
        }
        for (let sector = 0; sector < sectors; sector += 1) indices.push(0, 1 + sector, 1 + ((sector + 1) % sectors));
        for (let ring = 1; ring < rings; ring += 1) {
          const inner = 1 + (ring - 1) * sectors;
          const outer = 1 + ring * sectors;
          for (let sector = 0; sector < sectors; sector += 1) {
            const next = (sector + 1) % sectors;
            indices.push(inner + sector, outer + sector, outer + next, inner + sector, outer + next, inner + next);
          }
        }
      } else {
        const nu = 60;
        const nw = 30;
        for (let i = 0; i <= nu; i += 1) {
          for (let j = 0; j <= nw; j += 1) push(surface.uMin + ((surface.uMax - surface.uMin) * i) / nu, surface.wMin + ((surface.wMax - surface.wMin) * j) / nw);
        }
        for (let i = 0; i < nu; i += 1) {
          for (let j = 0; j < nw; j += 1) {
            const a = i * (nw + 1) + j;
            indices.push(a, a + nw + 1, a + nw + 2, a, a + nw + 2, a + 1);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      mesh.geometry.dispose();
      mesh.geometry = geometry;
      mesh.material.clippingPlanes = this.clipping({ top: true });
      mesh.material.opacity = options.colorFault ? 0.94 : 0.5;
      mesh.material.depthWrite = options.colorFault;
      mesh.material.userData.baseOpacity = mesh.material.opacity;

      const tip = fault.tipLine ?? (surface.kind === 'ellipse' ? { u0: surface.u0 ?? 0, a: surface.a, b: surface.b } : null);
      if (tip && tip.a > 0 && options.showTipLine !== false) {
        const ellipse = (r) => Array.from({ length: 120 }, (_, k) => {
          const angle = (k / 120) * Math.PI * 2;
          return this.faultPoint(fault, tip.u0 + tip.a * r * Math.cos(angle), tip.b * r * Math.sin(angle), 0.004);
        });
        tipPolylines.push(ellipse(1));
        if (options.showContours && fault.field && !fault.field.uniform) {
          (model.contourLevels ?? []).forEach((level, k) => {
            const r = contourRadius(level, fault.field.dMax, fault.field.model);
            if (r <= 0 || r >= 1) return;
            contourPolylines.push(ellipse(r));
            const angle = -Math.PI / 2 + 0.55 + k * 0.28;
            labelSpots.push({ text: `${level} m`, position: this.faultPoint(fault, tip.u0 + tip.a * r * Math.cos(angle), tip.b * r * Math.sin(angle), 0.01) });
          });
        }
        if (index === 0) this.tipAnchor = this.faultPoint(fault, tip.u0 + tip.a * 1.03, 0, 0.01);
      }
    });
    this.tipLines.set(tipPolylines, true);
    this.contourLines.set(contourPolylines, true);
    this.tipLines.material.clippingPlanes = this.clipping();
    this.contourLines.material.clippingPlanes = this.clipping();
    this.contourLabels.forEach((label, index) => {
      const spot = labelSpots[index];
      label.sprite.visible = Boolean(spot);
      if (!spot) return;
      label.setParts([[spot.text]]);
      label.sprite.position.copy(spot.position);
    });
    this.tipLabel.sprite.visible = tipPolylines.length > 0 && Boolean(model.options.showTipLabel) && Boolean(this.tipAnchor);
    if (this.tipLabel.sprite.visible) this.tipLabel.sprite.position.copy(this.tipAnchor).add(new THREE.Vector3(0, 0.3, -0.2));

    // The profile line: a horizontal line on the first fault at down-dip distance w.
    const profile = model.profile;
    if (profile && profile.halfLength > 0) {
      const fault = model.faults[0];
      const points = Array.from({ length: 41 }, (_, k) => this.faultPoint(fault, -profile.halfLength + (2 * profile.halfLength * k) / 40, profile.w, 0.008));
      this.profileLine.set([points]);
      this.profileLabel.setParts([['profile line']]);
      this.profileLabel.sprite.visible = true;
      this.profileLabel.sprite.position.copy(points[0]).add(new THREE.Vector3(0, 0.14, 0.3));
    } else {
      this.profileLine.set([]);
      this.profileLabel.sprite.visible = false;
    }
  }

  updateSection() {
    const model = this.model;
    const section = model.section;
    this.sectionGroup.visible = Boolean(section);
    this.offsetGroup.visible = false;
    this.offsetLabel.sprite.visible = false;
    if (!section) return;
    const mpu = model.metersPerUnit;
    const x = section.x;
    const world = this.world({ x, y: 0, z: HALF.y * mpu });
    this.sectionPlane.position.copy(world);
    this.sectionPlane.rotation.set(0, 0, 0);
    const corners = [[-1, 0], [1, 0], [1, 2], [-1, 2]].map(([east, down]) => this.world({ x, y: east * HALF.x * mpu, z: down * HALF.y * mpu }));
    this.sectionEdges.set([corners], true);
    const threshold = 0.004 * mpu;
    const polylines = [];
    for (const horizon of model.horizons) {
      const ys = [...Array.from({ length: 321 }, (_, j) => -HALF.x * mpu + (2 * HALF.x * mpu * j) / 320), ...this.traceColumns(horizon.depth)].sort((a, b) => a - b);
      let current = [];
      let previous = null;
      for (const y of ys) {
        const result = this.moved({ x, y, z: horizon.depth });
        if (options(this.model).showHangingWall === false && result.sides[0]) {
          previous = result;
          continue;
        }
        const broken = previous && result.sides.some((side, f) => side !== previous.sides[f] && Math.max(result.values[f], previous.values[f]) > threshold);
        if (broken && current.length > 1) {
          polylines.push(current);
          current = [];
        }
        if (Math.abs(result.point.y) <= HALF.x * mpu && result.point.z >= 0 && result.point.z <= 2 * HALF.y * mpu) current.push(this.world(result.point));
        previous = result;
      }
      if (current.length > 1) polylines.push(current);
    }
    this.sectionLines.set(polylines);

    // The offset of one horizon at the section: from the footwall cutoff to the hanging-wall cutoff.
    const horizon = model.horizons[section.horizon ?? 0];
    const columns = this.traceColumns(horizon.depth);
    if (columns.length >= 2 && section.showOffset) {
      const foot = this.moved({ x, y: columns[0], z: horizon.depth });
      const hanging = this.moved({ x, y: columns[1], z: horizon.depth });
      const from = this.world(foot.point);
      const to = this.world(hanging.point);
      if (from.distanceTo(to) > 0.02) {
        this.offsetArrow.set(from, to);
        this.offsetGroup.visible = true;
        this.offsetLabel.setParts(section.offsetLabel ?? [['offset']]);
        this.offsetLabel.sprite.visible = true;
        this.offsetLabel.sprite.position.copy(from.clone().add(to).multiplyScalar(0.5)).add(new THREE.Vector3(0.5, 0.05, 0.1));
      }
    }
  }

  updateLabels() {
    const model = this.model;
    // The compass sits off the block's southwest corner, or nearer the middle when the camera zooms in.
    const zoomed = (model.camera?.zoom ?? 1) < 1;
    this.compass.position.set(zoomed ? -1.5 : -HALF.x - 0.45, zoomed ? 0.25 : 0.25, zoomed ? 1.4 : HALF.z + 0.2);
    this.compass.scale.setScalar(zoomed ? 0.7 : 1);
    const options = model.options;
    const mpu = model.metersPerUnit;
    const fault = model.faults[0];
    const showWalls = Boolean(options.showWallLabels) && fault;
    for (const [side, label] of Object.entries(this.wallLabels)) {
      label.sprite.visible = showWalls && (side === 'foot' || options.showHangingWall !== false);
      if (!label.sprite.visible) continue;
      const east = side === 'foot' ? -0.66 : 0.66;
      const north = 0.8;
      label.sprite.position.copy(this.world({ x: HALF.z * mpu * north, y: east * HALF.x * mpu, z: 0 })).add(new THREE.Vector3(0, 0.18, 0));
    }
    const relay = model.relay;
    for (const [id, label] of Object.entries(this.segmentLabels)) {
      const where = relay?.labels?.[id];
      label.sprite.visible = Boolean(where);
      if (where) label.sprite.position.copy(this.world(where)).add(new THREE.Vector3(0, 0.22, 0));
    }
    this.rampLabel.sprite.visible = Boolean(relay?.ramp);
    if (relay?.ramp) this.rampLabel.sprite.position.copy(this.world(relay.ramp)).add(new THREE.Vector3(0, 0.5, 0));
    // The relay ramp's outline on the moved bed: between the segments, over the overlap.
    const zone = relay?.rampZone;
    if (zone) {
      const depth = model.horizons[0].depth;
      const inset = 6;
      const corners = [[zone.xMin, zone.yMin + inset], [zone.xMax, zone.yMin + inset], [zone.xMax, zone.yMax - inset], [zone.xMin, zone.yMax - inset]];
      const points = [];
      corners.forEach(([x, y], index) => {
        const [nextX, nextY] = corners[(index + 1) % corners.length];
        for (let k = 0; k < 16; k += 1) {
          const t = k / 16;
          points.push(this.world(this.moved({ x: x + (nextX - x) * t, y: y + (nextY - y) * t, z: depth }).point).add(new THREE.Vector3(0, 0.012, 0)));
        }
      });
      this.rampOutline.set([points], true);
    } else {
      this.rampOutline.set([]);
    }
    // Process zones: dashed ellipses on the moved bed just ahead of each growing tip.
    const zones = relay?.processZones ?? [];
    this.processLabel.sprite.visible = zones.length > 0;
    this.processOutline.set(zones.map((zone) => Array.from({ length: 40 }, (_, k) => {
      const angle = (k / 40) * Math.PI * 2;
      const point = { x: zone.x + zone.rx * Math.cos(angle), y: zone.y + zone.ry * Math.sin(angle), z: model.horizons[0].depth };
      return this.world(this.moved(point).point).add(new THREE.Vector3(0, 0.014, 0));
    })), true);
    if (zones.length) this.processLabel.sprite.position.copy(this.world(this.moved({ x: zones[0].x, y: zones[0].y, z: model.horizons[0].depth }).point)).add(new THREE.Vector3(0, 0.3, 0));

    // A dimension line over the fault's length, and the scale of the block.
    const dimension = model.dimension;
    const tip = fault?.surface?.kind === 'ellipse' ? fault.surface : null;
    const showDimension = Boolean(dimension && tip);
    this.dimension.label.sprite.visible = showDimension;
    for (const arrow of this.dimension.arrows) arrow.group.visible = showDimension;
    if (showDimension) {
      const w = -tip.b * 1.12;
      const middle = this.faultPoint(fault, 0, w, 0.01);
      this.dimension.arrows[0].set(middle, this.faultPoint(fault, -tip.a, w, 0.01));
      this.dimension.arrows[1].set(middle, this.faultPoint(fault, tip.a, w, 0.01));
      this.dimension.label.setParts(dimension.parts);
      this.dimension.label.sprite.position.copy(middle).add(new THREE.Vector3(0, 0.16, 0));
    }
    const south = -HALF.z * mpu;
    const bottom = 2 * HALF.y * mpu;
    const from = this.world({ x: south, y: -HALF.x * mpu, z: bottom }).add(new THREE.Vector3(0, 0, 0.3));
    const to = this.world({ x: south, y: HALF.x * mpu, z: bottom }).add(new THREE.Vector3(0, 0, 0.3));
    this.scaleBar.set(from, to);
    this.scaleLabel.setParts(model.scaleParts ?? [[`${formatLength(2 * HALF.x * mpu)}`]]);
    this.scaleLabel.sprite.position.copy(from.clone().add(to).multiplyScalar(0.5)).add(new THREE.Vector3(0, -0.16, 0.1));
  }

  update() {
    if (!this.model) return;
    this.updateHorizons();
    this.updateSurfaces();
    this.updateSection();
    this.updateLabels();
    this.applyHighlight();
  }

  /* ---------- Hover and highlight ---------- */

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

  hoverCandidates() {
    const arrow = (ref, item) => [[ref, item.shaft], [ref, item.head]];
    const lines = (ref, item) => [[ref, item.object]];
    return [
      ...arrow('offset', this.offsetArrow),
      ...lines('profile-line', this.profileLine),
      ...lines('tip-line', this.tipLines),
      ...lines('contours', this.contourLines),
      ...lines('section', this.sectionLines),
      ...lines('relay-ramp', this.rampOutline),
      ['core', this.coreMesh],
      ...this.surfaces.map((mesh) => [mesh.userData.ref ?? 'fault', mesh]),
      ...this.horizons.map((mesh) => ['horizon', mesh]),
      ...lines('process-zone', this.processOutline),
      ['section', this.sectionPlane],
    ].filter(([, object]) => {
      let visible = object.visible;
      object.traverseAncestors((ancestor) => { if (!ancestor.visible) visible = false; });
      return visible;
    });
  }

  reportHover() {
    const candidates = this.hoverCandidates();
    this.raycaster.params.Line2 = { threshold: 6 };
    const hits = this.raycaster.intersectObjects(candidates.map(([, object]) => object), false);
    // Clipped geometry outside the block still intersects rays; ignore those hits.
    const inside = (point) => point.x >= BOX_MIN.x - 1e-3 && point.x <= BOX_MAX.x + 1e-3 && point.y >= BOX_MIN.y - 1e-3 && point.y <= BOX_MAX.y + 1e-3 && point.z >= BOX_MIN.z - 1e-3 && point.z <= BOX_MAX.z + 1e-3;
    const hit = hits.find((candidate) => inside(candidate.point));
    let ref = candidates.find(([, object]) => object === hit?.object)?.[0] ?? null;
    if (ref === 'horizon' && this.model?.relay?.rampZone) {
      const point = { x: -hit.point.z * this.model.metersPerUnit, y: hit.point.x * this.model.metersPerUnit };
      const zone = this.model.relay.rampZone;
      if (point.x >= zone.xMin && point.x <= zone.xMax && point.y >= zone.yMin && point.y <= zone.yMax) ref = 'relay-ramp';
    }
    this.setHoverRef(ref);
  }

  setHoverRef(ref) {
    if (ref === this.hoverRef) return;
    this.hoverRef = ref;
    this.onHover?.(ref);
  }

  highlightGroups() {
    const surfaceFor = (ref) => this.surfaces.filter((mesh) => mesh.visible && mesh.userData.ref === ref);
    return {
      horizon: [this.horizonGroup],
      fault: [...surfaceFor('fault')],
      displacement: [this.surfaceGroup, this.contourLines.object],
      contours: [this.contourLines.object, ...this.contourLabels.map((label) => label.sprite)],
      'tip-line': [this.tipLines.object, this.tipLabel.sprite],
      section: [this.sectionGroup],
      offset: [this.offsetGroup, this.offsetLabel.sprite],
      'profile-line': [this.profileLine.object, this.profileLabel.sprite],
      'process-zone': [this.processOutline.object, this.processLabel.sprite],
      'segment-a': [...surfaceFor('segment-a'), this.segmentLabels.A.sprite],
      'segment-b': [...surfaceFor('segment-b'), this.segmentLabels.B.sprite],
      breach: [...surfaceFor('breach'), this.segmentLabels.breach.sprite],
      'relay-ramp': [this.rampOutline.object, this.rampLabel.sprite],
      'hanging-wall': [this.wallLabels.hanging.sprite],
      footwall: [this.wallLabels.foot.sprite],
    };
  }

  /** Dim every bindable object except the highlighted ones (groups may overlap, so this works per mesh). */
  applyHighlight() {
    const groups = this.highlightGroups();
    const active = this.highlightRef && groups[this.highlightRef]?.length ? this.highlightRef : null;
    const lit = new Set();
    if (active) for (const object of groups[active]) object.traverse((child) => lit.add(child));
    const seen = new Set();
    for (const object of Object.values(groups).flat()) {
      object.traverse((child) => {
        if (!child.material || seen.has(child)) return;
        seen.add(child);
        if (child.material.userData.baseOpacity === undefined) child.material.userData.baseOpacity = child.material.opacity;
        child.material.opacity = child.material.userData.baseOpacity * (active && !lit.has(child) ? DIMMED_OPACITY_FACTOR : 1);
      });
    }
  }

  highlight(ref) {
    this.highlightRef = ref;
    this.applyHighlight();
  }

  /* ---------- State, camera, render loop ---------- */

  /**
   * model: { setup, metersPerUnit, faults (faultGrowth.js field descriptors, with
   * surface and ref), horizons [{ depth, color }], contourInterval, colorMax,
   * contourLevels, section { x, horizon, showOffset, offsetLabel } | null,
   * profile { w, halfLength } | null, relay { labels, ramp, rampZone,
   * processZones [{ x, y, rx, ry }] } | null, dimension { parts } | null,
   * scaleParts, options }.
   */
  setState(model) {
    this.model = model;
    for (const surface of this.surfaces) surface.material.userData.baseOpacity = undefined;
    this.update();
  }

  /** Camera presets: oblique 3D, map (from above), section (looking north along strike), and face-on to the fault. */
  setView(view) {
    this.view = view;
    this.userMoved = false;
    this.resetCamera();
  }

  resetCamera() {
    this.userMoved = false;
    const factor = Math.max(1, 1.3 / Math.max(this.camera.aspect, 0.1));
    // With a section cut, look more from the south, so the cut face is seen nearly face on.
    const eye = this.model?.section?.cut ? CUT_VIEW_POSITION : GROWTH_VIEW.position;
    // A step can zoom in on part of the block (the relay zone) and aim at a depth.
    const zoom = this.model?.camera?.zoom ?? 1;
    const aim = this.model?.camera?.depth !== undefined ? new THREE.Vector3(0, -this.model.camera.depth / this.model.metersPerUnit, 0) : GROWTH_VIEW.target;
    let position = eye.clone().sub(GROWTH_VIEW.target).multiplyScalar(factor * zoom).add(aim);
    let target = aim.clone();
    if (this.view === 'map') {
      target = new THREE.Vector3(0, -0.5, 0);
      position = new THREE.Vector3(0, 8.4 * factor * zoom, 0.02);
    } else if (this.view === 'section') {
      target = CENTER.clone();
      position = CENTER.clone().add(new THREE.Vector3(0, 0.6, 8.4 * factor));
    } else if (this.view === 'fault' && this.model?.faults?.[0]) {
      const fault = this.model.faults[0];
      target = this.world(fault.center);
      position = target.clone().add(toWorld(planeUpwardNormal(fault.plane)).normalize().multiplyScalar(7.6 * factor));
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
    for (const material of this.lineMaterials) material.resolution.set(width, height);
    if (width > 1 && height > 1 && !this.userMoved) this.resetCamera();
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

function options(model) {
  return model.options ?? {};
}

/** 1000 m → "1 km", 40 m → "40 m". */
export function formatLength(metres) {
  if (metres >= 1000) return `${Number((metres / 1000).toFixed(metres >= 10000 ? 0 : 1))} km`;
  return `${Number(metres.toFixed(metres >= 10 ? 0 : 1))} m`;
}
