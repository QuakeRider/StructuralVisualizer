import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { calculateLoadResponse, pointOnFace } from '../domain/loadResponse.js';

const HALF = 1.25;
const FORCE_COLOR = 0xf4f5f7;
const NORMAL_COLOR = 0x56b4e9;
const SHEAR_COLOR = 0xcc79a7;
const SURFACE_COLOR = 0xe69f00;
const REACTION_COLOR = 0x009e73;

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

function configureArrow(arrow) {
  arrow.line.material.depthTest = false;
  arrow.cone.material.depthTest = false;
  arrow.line.material.depthWrite = false;
  arrow.cone.material.depthWrite = false;
  arrow.line.material.transparent = true;
  arrow.cone.material.transparent = true;
  arrow.line.material.opacity = 0.96;
  arrow.cone.material.opacity = 0.96;
  arrow.line.renderOrder = 8;
  arrow.cone.renderOrder = 8;
  return arrow;
}

function faceNormalFromPoint(point) {
  const values = [Math.abs(point.x), Math.abs(point.y), Math.abs(point.z)];
  const axis = values.indexOf(Math.max(...values));
  const normal = new THREE.Vector3();
  normal.setComponent(axis, Math.sign(point.getComponent(axis)) || 1);
  return normal;
}

function faceBasis(normal) {
  const reference = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();
  return { u, v };
}

export class ForceLabScene {
  constructor(container, { onForceChange, onSurfaceChange, onApplicationPointChange } = {}) {
    this.container = container;
    this.onForceChange = onForceChange;
    this.onSurfaceChange = onSurfaceChange;
    this.onApplicationPointChange = onApplicationPointChange;
    this.force = new THREE.Vector3(0, -5_000, 0);
    this.surfaceNormal = new THREE.Vector3(0, 1, 0);
    this.applicationPoint = new THREE.Vector3(0, HALF, 0);
    this.area = 100;
    this.constraintMode = 'free';
    this.cutPosition = 0;
    this.defaultOptions = {
      showSurfaceNormal: false,
      showArea: false,
      showDecomposition: false,
      showApplicationPoint: false,
      showResultants: false,
      showSupport: false,
      showReactions: false,
      showResponse: false,
      showDistribution: false,
      showCut: false,
      showInternalActions: false,
      allowSurfaceSelection: false,
      allowApplicationPoint: false,
      allowForceDrag: true,
    };
    this.options = { ...this.defaultOptions };
    this.pointerStart = null;
    this.draggingForce = false;
    this.draggingPoint = false;

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
      'Interactive three-dimensional load laboratory. Drag the force handle or load point, select faces, orbit the view, or use the numerical controls.',
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
    this.createLoadObjects();
    this.createResponseObjects();
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
    const geometry = new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2, 8, 8, 8);
    this.basePositions = new Float32Array(geometry.attributes.position.array);
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

    const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2));
    this.originalOutline = new THREE.LineSegments(
      outlineGeometry,
      new THREE.LineBasicMaterial({ color: 0xe7eaee, transparent: true, opacity: 0.48 }),
    );
    this.scene.add(this.originalOutline);

    this.motionGhost = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2)),
      new THREE.LineBasicMaterial({ color: 0x8db4ff, transparent: true, opacity: 0.52, depthTest: false }),
    );
    this.motionGhost.renderOrder = 4;
    this.scene.add(this.motionGhost);

    this.patch = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: SURFACE_COLOR, transparent: true, opacity: 0.68, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.patch.renderOrder = 3;
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
      const arrow = configureArrow(new THREE.ArrowHelper(axis.direction, axisOrigin, 0.72, axis.color, 0.14, 0.08));
      const label = makeTextSprite(axis.label);
      label.position.copy(axisOrigin).add(axis.direction.clone().multiplyScalar(0.9));
      this.axesGroup.add(arrow, label);
    }
    this.scene.add(this.axesGroup);
  }

  createLoadObjects() {
    this.forceArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1.6, FORCE_COLOR, 0.3, 0.18));
    this.normalArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.75, NORMAL_COLOR, 0.18, 0.1));
    this.normalComponentArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, NORMAL_COLOR, 0.22, 0.12));
    this.shearComponentArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, SHEAR_COLOR, 0.22, 0.12));
    this.handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x2b3038, emissiveIntensity: 0.35, depthTest: false }),
    );
    this.handle.renderOrder = 10;
    this.contactMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.055, 10, 32),
      new THREE.MeshBasicMaterial({ color: SURFACE_COLOR, depthTest: false }),
    );
    this.contactMarker.renderOrder = 11;
    this.distributionGroup = new THREE.Group();
    for (let index = 0; index < 9; index += 1) {
      this.distributionGroup.add(configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 0.36, SURFACE_COLOR, 0.1, 0.055)));
    }
    this.scene.add(
      this.forceArrow,
      this.normalArrow,
      this.normalComponentArrow,
      this.shearComponentArrow,
      this.handle,
      this.contactMarker,
      this.distributionGroup,
    );
  }

  createResponseObjects() {
    this.translationArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 0.9, NORMAL_COLOR, 0.2, 0.11));
    this.reactionArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.85, REACTION_COLOR, 0.2, 0.11));
    this.internalNormalArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.7, NORMAL_COLOR, 0.17, 0.09));
    this.internalShearArrow = configureArrow(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.7, SHEAR_COLOR, 0.17, 0.09));

    this.rotationArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.035, 8, 48, Math.PI * 1.55),
      new THREE.MeshBasicMaterial({ color: SHEAR_COLOR, transparent: true, opacity: 0.9, depthTest: false }),
    );
    this.rotationArc.renderOrder = 7;

    this.supportGroup = new THREE.Group();
    const supportMaterial = new THREE.MeshBasicMaterial({ color: REACTION_COLOR, transparent: true, opacity: 0.62, depthTest: false });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.07, 2.72), supportMaterial);
    this.supportGroup.add(plate);
    for (const x of [-0.82, 0, 0.82]) {
      for (const z of [-0.82, 0, 0.82]) {
        const anchor = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 4), supportMaterial);
        anchor.position.set(x, -0.17, z);
        anchor.rotation.y = Math.PI / 4;
        this.supportGroup.add(anchor);
      }
    }

    this.cutPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.62, 2.62),
      new THREE.MeshBasicMaterial({ color: 0x56b4e9, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.cutPlane.renderOrder = 2;
    this.scene.add(
      this.translationArrow,
      this.reactionArrow,
      this.internalNormalArrow,
      this.internalShearArrow,
      this.rotationArc,
      this.supportGroup,
      this.cutPlane,
    );
  }

  bindPointerEvents() {
    this.onPointerDown = (event) => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const handleHit = this.raycaster.intersectObject(this.handle, false)[0];
      const pointHit = this.raycaster.intersectObject(this.contactMarker, false)[0];
      if (handleHit && this.options.allowForceDrag) {
        event.preventDefault();
        event.stopPropagation();
        this.draggingForce = true;
        this.controls.enabled = false;
        this.renderer.domElement.setPointerCapture(event.pointerId);
        const cameraDirection = this.camera.getWorldDirection(new THREE.Vector3());
        this.dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, this.handle.position);
        this.renderer.domElement.classList.add('is-dragging-force');
      } else if (pointHit && this.options.allowApplicationPoint) {
        event.preventDefault();
        event.stopPropagation();
        this.draggingPoint = true;
        this.controls.enabled = false;
        this.renderer.domElement.setPointerCapture(event.pointerId);
        this.dragPlane.setFromNormalAndCoplanarPoint(this.surfaceNormal, this.applicationPoint);
        this.renderer.domElement.classList.add('is-dragging-point');
      }
    };

    this.onPointerMove = (event) => {
      if (!this.draggingForce && !this.draggingPoint) return;
      event.preventDefault();
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) return;

      if (this.draggingForce) {
        const contact = this.contactPoint();
        const appliedDirection = contact.clone().sub(this.dragIntersection);
        if (appliedDirection.lengthSq() < 0.04) return;
        const magnitude = clamp((appliedDirection.length() - 0.55) / 0.14, 1, 10) * 1_000;
        this.force.copy(appliedDirection.normalize().multiplyScalar(magnitude));
        this.updateVisuals();
        this.onForceChange?.(objectFromVector(this.force));
      } else {
        const next = pointOnFace(objectFromVector(this.surfaceNormal), objectFromVector(this.dragIntersection), HALF);
        this.applicationPoint.copy(vectorFromObject(next));
        this.updateVisuals();
        this.onApplicationPointChange?.(next);
      }
    };

    this.onPointerUp = (event) => {
      if (this.draggingForce || this.draggingPoint) {
        this.draggingForce = false;
        this.draggingPoint = false;
        this.controls.enabled = true;
        this.renderer.domElement.releasePointerCapture?.(event.pointerId);
        this.renderer.domElement.classList.remove('is-dragging-force', 'is-dragging-point');
        return;
      }

      if (!this.options.allowSurfaceSelection || !this.pointerStart) return;
      const moved = Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y);
      if (moved > 5) return;
      this.updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObject(this.block, false)[0];
      if (!hit) return;
      const localPoint = this.block.worldToLocal(hit.point.clone());
      const normal = faceNormalFromPoint(localPoint);
      const nextPoint = pointOnFace(objectFromVector(normal), objectFromVector(localPoint), HALF);
      this.surfaceNormal.copy(normal);
      this.applicationPoint.copy(vectorFromObject(nextPoint));
      this.updateVisuals();
      this.onSurfaceChange?.(objectFromVector(normal));
      this.onApplicationPointChange?.(nextPoint);
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
    return this.applicationPoint.clone().add(this.surfaceNormal.clone().multiplyScalar(0.028));
  }

  displayLength() {
    return 0.55 + clamp(this.force.length() / 1_000, 1, 10) * 0.14;
  }

  currentResponse() {
    return calculateLoadResponse({
      forceVector: objectFromVector(this.force),
      applicationPoint: objectFromVector(this.applicationPoint),
      surfaceNormal: objectFromVector(this.surfaceNormal),
      constraintMode: this.constraintMode,
      cutPosition: this.cutPosition,
      blockHalfSize: HALF,
    });
  }

  updateVisuals() {
    const normal = this.surfaceNormal.clone().normalize();
    const contact = this.contactPoint();
    const forceMagnitude = Math.max(this.force.length(), 1);
    const forceDirection = this.force.clone().normalize();
    const length = this.displayLength();
    const tail = contact.clone().sub(forceDirection.clone().multiplyScalar(length));
    const response = this.currentResponse();

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

    this.contactMarker.position.copy(contact.clone().add(normal.clone().multiplyScalar(0.03)));
    this.contactMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.contactMarker.visible = this.options.showApplicationPoint;

    const normalScalar = this.force.dot(normal);
    const normalForce = normal.clone().multiplyScalar(normalScalar);
    const shearForce = this.force.clone().sub(normalForce);
    const visualScale = length / forceMagnitude;
    const shearVisual = shearForce.clone().multiplyScalar(visualScale);
    const normalVisual = normalForce.clone().multiplyScalar(visualScale);

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

    this.updateDistributedLoad(normal, patchSize, forceDirection);
    this.updateSupport(normal, response);
    this.updateResultants(response);
    this.updateCut(normal, response);
    this.updateBlockResponse(response);
  }

  updateDistributedLoad(normal, patchSize, forceDirection) {
    const { u, v } = faceBasis(normal);
    const spacing = patchSize * 0.32;
    this.distributionGroup.visible = this.options.showDistribution;
    this.distributionGroup.children.forEach((arrow, index) => {
      const row = Math.floor(index / 3) - 1;
      const column = (index % 3) - 1;
      const point = this.contactPoint()
        .add(u.clone().multiplyScalar(column * spacing))
        .add(v.clone().multiplyScalar(row * spacing));
      const arrowLength = 0.34;
      arrow.position.copy(point.clone().sub(forceDirection.clone().multiplyScalar(arrowLength)));
      arrow.setDirection(forceDirection);
      arrow.setLength(arrowLength, 0.1, 0.055);
    });
  }

  updateSupport(normal, response) {
    const supportNormal = normal.clone().negate();
    this.supportGroup.position.copy(supportNormal.clone().multiplyScalar(HALF + 0.11));
    this.supportGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    this.supportGroup.visible = this.options.showSupport && this.constraintMode === 'fixed';

    const reaction = vectorFromObject(response.reactionForce);
    const supportPoint = vectorFromObject(response.supportPoint);
    const hasReaction = reaction.lengthSq() > 1;
    if (hasReaction) {
      const visualLength = 0.55 + clamp(reaction.length() / 10_000, 0, 1) * 0.55;
      this.reactionArrow.position.copy(supportPoint);
      this.reactionArrow.setDirection(reaction.normalize());
      this.reactionArrow.setLength(visualLength, 0.2, 0.11);
    }
    this.reactionArrow.visible = this.options.showReactions && this.constraintMode === 'fixed' && hasReaction;
  }

  updateResultants(response) {
    const force = this.force.clone();
    const hasForce = force.lengthSq() > 1;
    if (hasForce) {
      this.translationArrow.position.set(0, 0, 0);
      this.translationArrow.setDirection(force.normalize());
      this.translationArrow.setLength(0.72 + clamp(response.forceMagnitude / 10_000, 0, 1) * 0.4, 0.2, 0.11);
    }
    this.translationArrow.visible = this.options.showResultants && hasForce;

    const moment = vectorFromObject(response.resultantMoment);
    const hasMoment = moment.lengthSq() > 1;
    if (hasMoment) {
      this.rotationArc.position.set(0, 0, 0);
      this.rotationArc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), moment.normalize());
    }
    this.rotationArc.visible = this.options.showResultants && hasMoment;
  }

  updateCut(normal, response) {
    const cutPoint = vectorFromObject(response.cutPoint);
    this.cutPlane.position.copy(cutPoint);
    this.cutPlane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.cutPlane.visible = this.options.showCut;

    const internalForce = vectorFromObject(response.internalForce);
    const internalNormal = normal.clone().multiplyScalar(internalForce.dot(normal));
    const internalShear = internalForce.clone().sub(internalNormal);
    const hasInternalNormal = internalNormal.lengthSq() > 1;
    const hasInternalShear = internalShear.lengthSq() > 1;
    if (hasInternalNormal) {
      this.internalNormalArrow.position.copy(cutPoint);
      this.internalNormalArrow.setDirection(internalNormal.normalize());
      this.internalNormalArrow.setLength(0.52 + clamp(Math.abs(response.normalForce) / 10_000, 0, 1) * 0.45, 0.17, 0.09);
    }
    if (hasInternalShear) {
      this.internalShearArrow.position.copy(cutPoint);
      this.internalShearArrow.setDirection(internalShear.normalize());
      this.internalShearArrow.setLength(0.52 + clamp(response.shearForce / 10_000, 0, 1) * 0.45, 0.17, 0.09);
    }
    this.internalNormalArrow.visible = this.options.showInternalActions && hasInternalNormal;
    this.internalShearArrow.visible = this.options.showInternalActions && hasInternalShear;
  }

  updateBlockResponse(response) {
    const positions = this.block.geometry.attributes.position;
    const normal = this.surfaceNormal.clone().normalize();
    const force = this.force.clone();
    const normalScalar = force.dot(normal);
    const shear = force.clone().sub(normal.clone().multiplyScalar(normalScalar));
    const moment = vectorFromObject(response.momentAboutSupport);
    const torsionScalar = moment.dot(normal);
    const bendingMoment = moment.clone().sub(normal.clone().multiplyScalar(torsionScalar));
    const bendDirection = bendingMoment.lengthSq() > 1 ? bendingMoment.clone().cross(normal).normalize() : new THREE.Vector3();
    const responseVisible = this.options.showResponse;

    for (let index = 0; index < positions.count; index += 1) {
      const original = new THREE.Vector3(
        this.basePositions[index * 3],
        this.basePositions[index * 3 + 1],
        this.basePositions[index * 3 + 2],
      );
      const next = original.clone();
      if (responseVisible && this.constraintMode === 'fixed') {
        const longitudinal = original.dot(normal);
        const lambda = clamp((longitudinal + HALF) / (HALF * 2), 0, 1);
        const radial = original.clone().sub(normal.clone().multiplyScalar(longitudinal));
        const axialAmount = clamp(normalScalar / 10_000, -1, 1) * 0.34 * lambda;
        const shearOffset = shear.clone().multiplyScalar((0.26 * lambda) / 10_000);
        const bendAmount = clamp(bendingMoment.length() / (10_000 * HALF * 2), 0, 1) * 0.52 * lambda * lambda;
        const twistAngle = clamp(torsionScalar / (10_000 * HALF), -1, 1) * 0.34 * lambda;
        const twistedRadial = radial.clone().applyAxisAngle(normal, twistAngle);
        const poissonOffset = radial.clone().multiplyScalar(-axialAmount * 0.08);
        next
          .add(normal.clone().multiplyScalar(axialAmount))
          .add(shearOffset)
          .add(bendDirection.clone().multiplyScalar(bendAmount))
          .add(twistedRadial.sub(radial))
          .add(poissonOffset);
      }
      positions.setXYZ(index, next.x, next.y, next.z);
    }
    positions.needsUpdate = true;
    this.block.geometry.computeVertexNormals();

    const freeResponse = responseVisible && this.constraintMode === 'free';
    this.motionGhost.visible = freeResponse;
    this.originalOutline.visible = responseVisible;
    const cutResponse = this.options.showCut;
    this.block.material.transparent = freeResponse || cutResponse;
    this.block.material.opacity = freeResponse ? 0.48 : cutResponse ? 0.42 : 1;
    if (freeResponse) {
      const movement = this.force.clone().normalize().multiplyScalar(0.18 + clamp(response.forceMagnitude / 10_000, 0, 1) * 0.22);
      this.motionGhost.position.copy(movement);
      const moment = vectorFromObject(response.resultantMoment);
      this.motionGhost.quaternion.identity();
      if (moment.lengthSq() > 1) {
        this.motionGhost.quaternion.setFromAxisAngle(moment.normalize(), clamp(response.resultantMomentMagnitude / 20_000, 0, 1) * 0.22);
      }
    } else {
      this.motionGhost.position.set(0, 0, 0);
      this.motionGhost.quaternion.identity();
    }
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
    const projected = pointOnFace(objectFromVector(this.surfaceNormal), objectFromVector(this.applicationPoint), HALF);
    this.applicationPoint.copy(vectorFromObject(projected));
    this.updateVisuals();
  }

  setApplicationPoint(applicationPoint) {
    const next = pointOnFace(objectFromVector(this.surfaceNormal), applicationPoint, HALF);
    this.applicationPoint.copy(vectorFromObject(next));
    this.updateVisuals();
  }

  setConstraintMode(mode) {
    this.constraintMode = mode === 'free' ? 'free' : 'fixed';
    this.updateVisuals();
  }

  setCutPosition(position) {
    this.cutPosition = clamp(Number(position), -1, 1);
    this.updateVisuals();
  }

  setOptions(options) {
    this.options = { ...this.defaultOptions, ...options };
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
