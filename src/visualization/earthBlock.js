// Shared pieces of the NED Earth-block scenes (B6, B7, B8): the frame change
// to Three.js, the block size, plane–box sections, and the rock textures.

import * as THREE from 'three';
import { lineVector } from '../domain/orientation.js';
import { Arrow3D } from './sceneKit.js';

/** Half-sizes of the Earth block in world units (east–west, depth, north–south). */
export const HALF = { x: 2, y: 1, z: 2 };
export const CENTER = new THREE.Vector3(0, -HALF.y, 0);
export const BOX_MIN = new THREE.Vector3(-HALF.x, -2 * HALF.y, -HALF.z);
export const BOX_MAX = new THREE.Vector3(HALF.x, 0, HALF.z);
export const VIEW = { position: new THREE.Vector3(6.4, 4.2, 7.6), target: new THREE.Vector3(0, -0.85, 0), up: new THREE.Vector3(0, 1, 0) };

/**
 * Geological frame (north, east, down) → Three.js (y up): north is −z,
 * east is +x, down is −y. The student never sees renderer coordinates.
 */
export function toWorld(v) {
  return new THREE.Vector3(v.y, -v.z, -v.x);
}

/** Three.js → geological frame (the inverse of toWorld). */
export function toNed(v) {
  return { x: -v.z, y: v.x, z: -v.y };
}

export function axisWorld({ trend, plunge }) {
  return toWorld(lineVector(trend, plunge));
}

/** Distance from the block center to the block surface along a unit direction. */
export function exitDistance(direction) {
  let distance = Infinity;
  for (const axis of ['x', 'y', 'z']) {
    if (Math.abs(direction[axis]) > 1e-6) distance = Math.min(distance, HALF[axis] / Math.abs(direction[axis]));
  }
  return distance;
}

/**
 * Polygon where a plane (normal, point) cuts an axis-aligned box, in order
 * around its centroid. Its edges lie on the box faces. Empty if they miss.
 */
export function boxSection(normal, point, min = BOX_MIN, max = BOX_MAX) {
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
  const corners = [];
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) corners.push(new THREE.Vector3(x, y, z));
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
  const unique = points.filter((candidate, index) => points.findIndex((other) => other.distanceTo(candidate) < 1e-6) === index);
  if (unique.length < 3) return [];
  const centroid = unique.reduce((sum, candidate) => sum.add(candidate), new THREE.Vector3()).multiplyScalar(1 / unique.length);
  const u = unique[0].clone().sub(centroid).normalize();
  const w = new THREE.Vector3().crossVectors(normal, u).normalize();
  return unique
    .map((candidate) => ({ point: candidate, angle: Math.atan2(candidate.clone().sub(centroid).dot(w), candidate.clone().sub(centroid).dot(u)) }))
    .sort((a, b) => a.angle - b.angle)
    .map(({ point: sorted }) => sorted);
}

/** Section of the whole block by a plane through its center. */
export function planeSection(normal) {
  return boxSection(normal, CENTER);
}

export function fanGeometry(polygon) {
  const positions = polygon.flatMap((point) => [point.x, point.y, point.z]);
  const indices = [];
  for (let index = 1; index < polygon.length - 1; index += 1) indices.push(0, index, index + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function loopSegments(polygon) {
  return polygon.flatMap((point, index) => [point, polygon[(index + 1) % polygon.length]]);
}

/** Layer colors from the top down; the B8 block uses the full list, B6/B7 the first eight. */
export const LAYER_COLORS = ['#b99a6b', '#6f6a64', '#a8adb1', '#9a5b45', '#c2a878', '#5f6570', '#8f9a6a', '#8b6f56', '#b5a58e', '#6d5a4c', '#9aa3ab', '#7d4f3f'];

/** Horizontal beds as a canvas texture: `count` layers from the top (v = 1) down. */
export function layerTexture(count = 8) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 32 * count;
  const context = canvas.getContext('2d');
  const height = canvas.height / count;
  const layers = count === 8 ? ['#b99a6b', '#6f6a64', '#a8adb1', '#9a5b45', '#c2a878', '#5f6570', '#b99a6b', '#8b6f56'] : LAYER_COLORS.slice(0, count);
  layers.forEach((color, index) => {
    context.fillStyle = color;
    context.fillRect(0, index * height, canvas.width, height);
    context.fillStyle = 'rgba(20, 20, 20, 0.35)';
    context.fillRect(0, index * height, canvas.width, 2);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function groundTexture() {
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
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** An arrow drawn on top of the translucent block. */
export function overlayArrow(options) {
  const arrow = new Arrow3D(options);
  for (const part of [arrow.shaft, arrow.head]) {
    part.material.depthTest = false;
    part.renderOrder = 13;
  }
  return arrow;
}
