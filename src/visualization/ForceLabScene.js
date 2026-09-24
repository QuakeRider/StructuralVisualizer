import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const HALF = 1.25;
const FORCE_COLOR = 0xf4f5f7;
const NORMAL_COLOR = 0x56b4e9;
const SHEAR_COLOR = 0xcc79a7;
const SURFACE_COLOR = 0xe69f00;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function vectorFromObject(value) {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function objectFromVector(value) {
  return { x: value.x, y: value.y, z: value.z };
}

function makeTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '600 34px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f4f5f7';
  context.fillText(text, 64, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(0.42, 0.21, 1);
  return sprite;
}

export class ForceLabScene {
  constructor(container, { onForceChange, onSurfaceChange } = {}) {
    this.container = container;
    this.onForceChange = onForceChange;
    this.onSurfaceChange = onSurfaceChange;
    this.force = new THREE.Vector3(0, -5_000, 0);
    this.surfaceNormal = new THREE.Vector3(0, 1, 0);
    this.area = 100;
    this.options = {
      showSurfaceNormal: false,
      showArea: false,
      showDecomposition: false,
      allowSurfaceSelection: false,
      allowForceDrag: true,
    };
    this.pointerStart = null;
    this.draggingForce = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    this.camera.position.set(5.8, 4.4, 6.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('role', 'application');
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive three-dimensional force laboratory. Drag the round force handle, select block faces, orbit, or use the numerical controls.',
    );
    container.append(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 12;
    this.controls.target.set(0, 0.12, 0);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragPlane = new THREE.Plane();
    this.dragIntersection = new THREE.Vector3();

    this.createLighting();
    this.createBlock();
    this.createReferenceObjects();
    this.createForceObjects();
    this.bindPointerEvents();
    this.updateVisuals();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  createLighting() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x20242c, 2.3));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x8db4ff, 1.4);
    rim.position.set(-5, 2, -4);
    this.scene.add(rim);
  }

  createBlock() {
    const geometry = new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x8f99a6,
      roughness: 0.58,
      metalness: 0.01,
      clearcoat: 0.08,
    });
    this.block = new THREE.Mesh(geometry, material);
    this.block.castShadow = true;
    this.block.receiveShadow = true;
    this.scene.add(this.block);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xe7eaee, transparent: true, opacity: 0.62 }),
    );
    this.scene.add(edges);

    this.patch = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        color: SURFACE_COLOR,
        transparent: true,
        opacity: 0.68,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.scene.add(this.patch);
  }

  createReferenceObjects() {
    this.grid = new THREE.GridHelper(9, 18, 0x555d68, 0x343a44);
    this.grid.position.y = -1.62;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.34;
    this.scene.add(this.grid);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.75, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.6;
    shadow.scale.set(1.35, 0.75, 1);
    this.scene.add(shadow);

    const axisOrigin = new THREE.Vector3(-1.85, -1.45, 1.72);
    const axes = [
      { label: 'X', direction: new THREE.Vector3(1, 0, 0), color: NORMAL_COLOR },
      { label: 'Y', direction: new THREE.Vector3(0, 1, 0), color: SURFACE_COLOR },
      { label: 'Z', direction: new THREE.Vector3(0, 0, 1), color: SHEAR_COLOR },
    ];
    this.axesGroup = new THREE.Group();
    for (const axis of axes) {
      const arrow = new THREE.ArrowHelper(axis.direction, axisOrigin, 0.72, axis.color, 0.14, 0.08);
      arrow.line.material.depthTest = false;
      arrow.cone.material.depthTest = false;
      arrow.renderOrder = 5;
      const label = makeTextSprite(axis.label);
      label.position.copy(axisOrigin).add(axis.direction.clone().multiplyScalar(0.9));
      this.axesGroup.add(arrow, label);
    }
    this.scene.add(this.axesGroup);
  }

  createForceObjects() {
    this.forceArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1.6, FORCE_COLOR, 0.3, 0.18);
    this.normalArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.75, NORMAL_COLOR, 0.18, 0.1);
    this.normalComponentArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, NORMAL_COLOR, 0.22, 0.12);
    this.shearComponentArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, SHEAR_COLOR, 0.22, 0.12);
    this.handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x2b3038, emissiveIntensity: 0.35 }),
    );
    this.handle.scale.setScalar(1.05);
    this.scene.add(this.forceArrow, this.normalArrow, this.normalComponentArrow, this.shearComponentArrow, this.handle);
  }

  bindPointerEvents() {
    this.onPointerDown = (event) => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const handleHit = this.raycaster.intersectObject(this.handle, false)[0];
      if (!handleHit || !this.options.allowForceDrag) return;

      event.preventDefault();
      event.stopPropagation();
      this.draggingForce = true;
      this.controls.enabled = false;
      this.renderer.domElement.setPointerCapture(event.pointerId);
      const cameraDirection = this.camera.getWorldDirection(new THREE.Vector3());
      this.dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, this.handle.position);
      this.renderer.domElement.classList.add('is-dragging-force');
    };

    this.onPointerMove = (event) => {
      if (!this.draggingForce) return;
      event.preventDefault();
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) return;

      const contact = this.contactPoint();
      const appliedDirection = contact.clone().sub(this.dragIntersection);
      if (appliedDirection.lengthSq() < 0.04) return;
      const magnitude = clamp((appliedDirection.length() - 0.55) / 0.14, 1, 10) * 1_000;
      this.force.copy(appliedDirection.normalize().multiplyScalar(magnitude));
      this.updateVisuals();
      this.onForceChange?.(objectFromVector(this.force));
    };

    this.onPointerUp = (event) => {
      if (this.draggingForce) {
        this.draggingForce = false;
        this.controls.enabled = true;
        this.renderer.domElement.releasePointerCapture?.(event.pointerId);
        this.renderer.domElement.classList.remove('is-dragging-force');
        return;
      }

      if (!this.options.allowSurfaceSelection || !this.pointerStart) return;
      const moved = Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y);
      if (moved > 5) return;
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObject(this.block, false)[0];
      if (!hit?.face) return;
      const normal = hit.face.normal.clone().transformDirection(this.block.matrixWorld);
      normal.set(Math.round(normal.x), Math.round(normal.y), Math.round(normal.z)).normalize();
      this.setSurfaceNormal(objectFromVector(normal));
      this.onSurfaceChange?.(objectFromVector(normal));
    };

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointercancel', this.onPointerUp);
  }

  updatePointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  contactPoint() {
    return this.surfaceNormal.clone().multiplyScalar(HALF + 0.025);
  }

  displayLength() {
    return 0.55 + clamp(this.force.length() / 1_000, 1, 10) * 0.14;
  }

  updateVisuals() {
    const normal = this.surfaceNormal.clone().normalize();
    const contact = this.contactPoint();
    const forceMagnitude = Math.max(this.force.length(), 1);
    const forceDirection = this.force.clone().normalize();
    const length = this.displayLength();
    const tail = contact.clone().sub(forceDirection.clone().multiplyScalar(length));

    this.forceArrow.position.copy(tail);
    this.forceArrow.setDirection(forceDirection);
    this.forceArrow.setLength(length, Math.min(0.34, length * 0.23), Math.min(0.19, length * 0.13));
    this.handle.position.copy(tail);

    this.normalArrow.position.copy(contact.clone().add(normal.clone().multiplyScalar(0.08)));
    this.normalArrow.setDirection(normal);
    this.normalArrow.setLength(0.72, 0.18, 0.1);
    this.normalArrow.visible = this.options.showSurfaceNormal;

    const patchSize = 0.62 + Math.sqrt(this.area / 200) * 0.95;
    this.patch.position.copy(contact.clone().add(normal.clone().multiplyScalar(0.008)));
    this.patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.patch.scale.set(patchSize, patchSize, 1);
    this.patch.visible = this.options.showArea;
    this.patch.material.opacity = 0.42 + (1 - clamp(this.area / 200, 0, 1)) * 0.38;

    const normalScalar = this.force.dot(normal);
    const normalForce = normal.clone().multiplyScalar(normalScalar);
    const shearForce = this.force.clone().sub(normalForce);
    const scale = length / forceMagnitude;
    const shearVisual = shearForce.clone().multiplyScalar(scale);
    const normalVisual = normalForce.clone().multiplyScalar(scale);

    this.shearComponentArrow.position.copy(tail);
    if (shearVisual.lengthSq() > 0.0001) {
      this.shearComponentArrow.setDirection(shearVisual.clone().normalize());
      this.shearComponentArrow.setLength(shearVisual.length(), 0.2, 0.11);
    }
    this.shearComponentArrow.visible = this.options.showDecomposition && shearVisual.lengthSq() > 0.0001;

    const normalOrigin = tail.clone().add(shearVisual);
    this.normalComponentArrow.position.copy(normalOrigin);
    if (normalVisual.lengthSq() > 0.0001) {
      this.normalComponentArrow.setDirection(normalVisual.clone().normalize());
      this.normalComponentArrow.setLength(normalVisual.length(), 0.2, 0.11);
    }
    this.normalComponentArrow.visible = this.options.showDecomposition && normalVisual.lengthSq() > 0.0001;
  }

  setForce(forceVectorNewtons) {
    const next = vectorFromObject(forceVectorNewtons);
    if (next.lengthSq() < 1) next.copy(this.surfaceNormal).multiplyScalar(-1_000);
    this.force.copy(next);
    this.updateVisuals();
  }

  setArea(areaSquareCentimeters) {
    this.area = clamp(Number(areaSquareCentimeters), 25, 200);
    this.updateVisuals();
  }

  setSurfaceNormal(surfaceNormal) {
    const next = vectorFromObject(surfaceNormal);
    if (next.lengthSq() < 0.5) return;
    this.surfaceNormal.copy(next.normalize());
    this.updateVisuals();
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.updateVisuals();
  }

  resetCamera() {
    this.camera.position.set(5.8, 4.4, 6.8);
    this.controls.target.set(0, 0.12, 0);
    this.controls.update();
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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
