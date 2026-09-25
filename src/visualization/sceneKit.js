// Shared Three.js building blocks for the lesson scenes: patterned arrows,
// screen-sized text labels, and line helpers.

import * as THREE from 'three';

export const LABEL_FONT = "'STIX Two Text', 'Cambria', 'Times New Roman', serif";

export function patternTexture(pattern) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, 4, 64);
  context.fillStyle = '#fff';
  if (pattern === 'dashed') context.fillRect(0, 0, 4, 40);
  if (pattern === 'dotted') context.fillRect(0, 0, 4, 22);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

/** A thick 3D arrow whose shaft can be solid, dashed, or dotted, so it reads without color. */
export class Arrow3D {
  constructor({ color, radius = 0.03, headLength = 0.2, headRadius = 0.08, pattern = 'solid', head = true, period = 0.2 }) {
    this.radius = radius;
    this.headLength = headLength;
    this.headRadius = headRadius;
    this.period = period;
    this.pattern = pattern;
    this.group = new THREE.Group();
    const shaftMaterial = new THREE.MeshBasicMaterial({ color, transparent: true });
    if (pattern !== 'solid') {
      shaftMaterial.alphaMap = patternTexture(pattern);
      shaftMaterial.alphaTest = 0.5;
    }
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14, 1), shaftMaterial);
    this.head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 20), new THREE.MeshBasicMaterial({ color, transparent: true }));
    this.head.visible = head;
    this.hasHead = head;
    this.group.add(this.shaft, this.head);
  }

  set(from, to) {
    const direction = to.clone().sub(from);
    const length = direction.length();
    this.group.visible = length > 1e-4;
    if (!this.group.visible) return;
    direction.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    const headLength = this.hasHead ? Math.min(this.headLength, length * 0.45) : 0;
    const shaftLength = Math.max(length - headLength, 1e-4);
    this.shaft.scale.set(this.radius, shaftLength, this.radius);
    this.shaft.position.copy(from).add(direction.clone().multiplyScalar(shaftLength / 2));
    this.shaft.quaternion.copy(quaternion);
    if (this.shaft.material.alphaMap) {
      this.shaft.material.alphaMap.repeat.set(1, Math.max(shaftLength / this.period, 1));
    }
    if (this.hasHead) {
      const headRadius = Math.min(this.headRadius, headLength * 0.5);
      this.head.scale.set(headRadius, headLength, headRadius);
      this.head.position.copy(from).add(direction.clone().multiplyScalar(shaftLength + headLength / 2));
      this.head.quaternion.copy(quaternion);
    }
  }
}

/**
 * Text label rendered to a sprite that keeps a constant size on screen.
 * `height` is roughly the fraction of the viewport height the text occupies.
 * `parts` is a list of [text, style] pairs. Styles follow the equations:
 * 'vec' bold upright (vectors), 'var' italic (scalars), 'sub' italic
 * subscript, 'nsub' upright (numeric) subscript, or omitted for upright
 * text and numbers.
 */
export class Label {
  constructor(color = '#c3c8d0', height = 0.05) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthTest: false, sizeAttenuation: false }));
    this.sprite.renderOrder = 20;
    this.color = color;
    this.height = height;
    this.key = '';
  }

  setParts(parts) {
    const key = JSON.stringify(parts);
    if (key === this.key) return;
    this.key = key;
    const size = 56;
    const context = this.context;
    const fonts = parts.map(([, style]) => ({
      vec: `700 ${size}px ${LABEL_FONT}`,
      var: `italic 500 ${size}px ${LABEL_FONT}`,
      sub: `italic 500 ${size * 0.64}px ${LABEL_FONT}`,
      nsub: `500 ${size * 0.64}px ${LABEL_FONT}`,
    })[style] ?? `500 ${size}px ${LABEL_FONT}`);
    let width = 0;
    parts.forEach(([text], index) => {
      context.font = fonts[index];
      width += context.measureText(text).width;
    });
    const nextWidth = Math.ceil(width + 24);
    const nextHeight = Math.round(size * 1.5);
    if (nextWidth !== this.canvas.width || nextHeight !== this.canvas.height) {
      // GPU texture storage has a fixed size, so a resized canvas needs a new texture.
      this.canvas.width = nextWidth;
      this.canvas.height = nextHeight;
      this.texture.dispose();
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.sprite.material.map = this.texture;
    }
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.textBaseline = 'alphabetic';
    context.lineWidth = 8;
    context.strokeStyle = 'rgba(17, 20, 26, 0.85)';
    context.lineJoin = 'round';
    let x = 12;
    const baseline = size * 1.05;
    parts.forEach(([text, style], index) => {
      context.font = fonts[index];
      const y = style === 'sub' || style === 'nsub' ? baseline + size * 0.2 : baseline;
      context.strokeText(text, x, y);
      context.fillStyle = this.color;
      context.fillText(text, x, y);
      x += context.measureText(text).width;
    });
    this.texture.needsUpdate = true;
    // Without size attenuation a sprite scale of 1 spans about 2 / projection[1][1] of the viewport height.
    const aspect = this.canvas.width / this.canvas.height;
    const scale = this.height * 0.65;
    this.sprite.scale.set(scale * aspect, scale, 1);
  }
}

export function makeLine(points, color, { dashed = false, opacity = 1 } = {}) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.07, gapSize: 0.06, transparent: true, opacity })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.LineSegments(geometry, material);
  if (dashed) line.computeLineDistances();
  return line;
}

/** Replace an object's geometry with one built from `points` (the point count can change). */
export function setPoints(object, points) {
  object.geometry.dispose();
  object.geometry = new THREE.BufferGeometry().setFromPoints(points);
  if (object.material.isLineDashedMaterial) object.computeLineDistances();
}
