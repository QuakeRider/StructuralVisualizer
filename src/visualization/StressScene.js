import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { applyDeformation, computeDeformation, lerpStress, volumeChangePercent } from '../domain/deformation.js';

const ZERO_STRESS = { xx: 0, yy: 0, zz: 0, xy: 0, xz: 0, yz: 0 };
const HALF = 1.15;

const CORNERS = [
  [-HALF, -HALF, -HALF], [HALF, -HALF, -HALF],
  [-HALF, HALF, -HALF], [HALF, HALF, -HALF],
  [-HALF, -HALF, HALF], [HALF, -HALF, HALF],
  [-HALF, HALF, HALF], [HALF, HALF, HALF],
];

const EDGE_PAIRS = [
  [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3],
  [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
];

const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

export class StressScene {
  constructor(container, { onVolumeChange } = {}) {
    this.container = container;
    this.onVolumeChange = onVolumeChange;
    this.targetStress = { ...ZERO_STRESS };
    this.currentStress = { ...ZERO_STRESS };
    this.exaggeration = 1.2;
    this.lastVolume = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.camera.position.set(5.2, 3.6, 5.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive three-dimensional block showing qualitative deformation under the selected stress state.',
    );
    this.renderer.domElement.setAttribute('role', 'img');
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 11;
    this.controls.target.set(0, 0, 0);

    this.clock = new THREE.Clock();
    this.arrowGroup = new THREE.Group();
    this.scene.add(this.arrowGroup);

    this.createLighting();
    this.createSpecimen();
    this.createReferenceObjects();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  createLighting() {
    this.scene.add(new THREE.HemisphereLight(0xd9f3ef, 0x18243a, 2.4));

    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x6dd8d2, 2.1);
    rim.position.set(-5, 2, -4);
    this.scene.add(rim);
  }

  createSpecimen() {
    this.geometry = new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2, 10, 10, 10);
    this.originalPositions = Float32Array.from(this.geometry.attributes.position.array);

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x84b9b2,
      roughness: 0.48,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.75,
    });
    this.block = new THREE.Mesh(this.geometry, material);
    this.block.castShadow = true;
    this.block.receiveShadow = true;
    this.scene.add(this.block);

    const edgePositions = new Float32Array(EDGE_PAIRS.length * 2 * 3);
    this.edgeGeometry = new THREE.BufferGeometry();
    this.edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    this.deformedEdges = new THREE.LineSegments(
      this.edgeGeometry,
      new THREE.LineBasicMaterial({ color: 0xd9f6f1, transparent: true, opacity: 0.78 }),
    );
    this.scene.add(this.deformedEdges);

    const originalGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2));
    this.originalOutline = new THREE.LineSegments(
      originalGeometry,
      new THREE.LineDashedMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        dashSize: 0.09,
        gapSize: 0.07,
      }),
    );
    this.originalOutline.computeLineDistances();
    this.scene.add(this.originalOutline);
  }

  createReferenceObjects() {
    const grid = new THREE.GridHelper(8, 16, 0x34516c, 0x263c54);
    grid.position.y = -1.6;
    grid.material.transparent = true;
    grid.material.opacity = 0.48;
    this.grid = grid;
    this.scene.add(grid);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 48),
      new THREE.MeshBasicMaterial({ color: 0x06121f, transparent: true, opacity: 0.24, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.58;
    shadow.scale.set(1.25, 0.72, 1);
    this.scene.add(shadow);

    this.axes = new THREE.AxesHelper(1.05);
    this.axes.position.set(-1.82, -1.48, -1.8);
    this.scene.add(this.axes);
  }

  setStress(stress, { immediate = false } = {}) {
    this.targetStress = { ...stress };
    if (immediate || this.reducedMotion) {
      this.currentStress = { ...stress };
    }
    this.rebuildArrows();
  }

  setExaggeration(value) {
    this.exaggeration = value;
  }

  setShowOriginal(show) {
    this.originalOutline.visible = show;
  }

  setShowVectors(show) {
    this.arrowGroup.visible = show;
  }

  setShowGrid(show) {
    this.grid.visible = show;
    this.axes.visible = show;
  }

  replay() {
    this.currentStress = { ...ZERO_STRESS };
  }

  resetCamera() {
    this.camera.position.set(5.2, 3.6, 5.8);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  rebuildArrows() {
    for (const child of [...this.arrowGroup.children]) {
      this.arrowGroup.remove(child);
      child.dispose?.();
    }

    this.addNormalArrows('x', this.targetStress.xx);
    this.addNormalArrows('y', this.targetStress.yy);
    this.addNormalArrows('z', this.targetStress.zz);
    this.addShearArrows('x', 'y', this.targetStress.xy);
    this.addShearArrows('x', 'z', this.targetStress.xz);
    this.addShearArrows('y', 'z', this.targetStress.yz);
  }

  arrowLength(value) {
    return 0.42 + Math.min(Math.abs(value) / 60, 1) * 0.58;
  }

  makeArrow(direction, origin, length, color) {
    const arrow = new THREE.ArrowHelper(
      direction.clone().normalize(),
      origin,
      length,
      color,
      Math.min(0.24, length * 0.32),
      Math.min(0.15, length * 0.2),
    );
    this.arrowGroup.add(arrow);
  }

  addNormalArrows(axisName, value) {
    if (Math.abs(value) < 0.05) return;
    const axis = AXES[axisName];
    const length = this.arrowLength(value);
    const color = value > 0 ? 0xffa45f : 0x56ded4;

    if (value > 0) {
      this.makeArrow(axis.clone().negate(), axis.clone().multiplyScalar(HALF + length + 0.18), length, color);
      this.makeArrow(axis.clone(), axis.clone().multiplyScalar(-(HALF + length + 0.18)), length, color);
    } else {
      this.makeArrow(axis, axis.clone().multiplyScalar(HALF + 0.08), length, color);
      this.makeArrow(axis.clone().negate(), axis.clone().multiplyScalar(-(HALF + 0.08)), length, color);
    }
  }

  addShearArrows(directionName, normalName, value) {
    if (Math.abs(value) < 0.05) return;
    const direction = AXES[directionName];
    const normal = AXES[normalName];
    const sign = Math.sign(value);
    const length = this.arrowLength(value) * 0.86;
    const color = 0xc99aff;

    const addOnFace = (faceNormal, tangent) => {
      const face = faceNormal.clone().multiplyScalar(HALF + 0.16);
      const arrowDirection = tangent.clone().multiplyScalar(sign).normalize();
      const origin = face.clone().add(arrowDirection.clone().multiplyScalar(-length / 2));
      this.makeArrow(arrowDirection, origin, length, color);
    };

    addOnFace(normal, direction);
    addOnFace(normal.clone().negate(), direction.clone().negate());
    addOnFace(direction, normal);
    addOnFace(direction.clone().negate(), normal.clone().negate());
  }

  updateGeometry(matrix) {
    const positions = this.geometry.attributes.position.array;
    for (let index = 0; index < positions.length; index += 3) {
      const point = applyDeformation(
        [this.originalPositions[index], this.originalPositions[index + 1], this.originalPositions[index + 2]],
        matrix,
      );
      positions[index] = point[0];
      positions[index + 1] = point[1];
      positions[index + 2] = point[2];
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    const edgePositions = this.edgeGeometry.attributes.position.array;
    let cursor = 0;
    for (const [startIndex, endIndex] of EDGE_PAIRS) {
      for (const cornerIndex of [startIndex, endIndex]) {
        const point = applyDeformation(CORNERS[cornerIndex], matrix);
        edgePositions[cursor++] = point[0];
        edgePositions[cursor++] = point[1];
        edgePositions[cursor++] = point[2];
      }
    }
    this.edgeGeometry.attributes.position.needsUpdate = true;
  }

  resize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate = () => {
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const amount = this.reducedMotion ? 1 : 1 - Math.exp(-5.5 * delta);
    this.currentStress = lerpStress(this.currentStress, this.targetStress, amount);

    const deformation = computeDeformation(this.currentStress, this.exaggeration);
    this.updateGeometry(deformation.matrix);

    const volume = volumeChangePercent(deformation.determinant);
    const roundedVolume = Math.round(volume * 10) / 10;
    if (roundedVolume !== this.lastVolume) {
      this.lastVolume = roundedVolume;
      this.onVolumeChange?.(roundedVolume);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
