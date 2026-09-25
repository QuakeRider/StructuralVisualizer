const EPSILON = 1e-9;

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(vector, scalar) {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function magnitude(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

export function normalize(vector) {
  const length = magnitude(vector);
  if (!Number.isFinite(length) || length <= EPSILON) {
    throw new RangeError('Cannot normalize a zero-length or non-finite vector.');
  }
  return scale(vector, 1 / length);
}

export function negate(vector) {
  return scale(vector, -1);
}

/** Length of the vector's shadow on the x–y plane: the first triangle of the 3D magnitude. */
export function xyMagnitude(vector) {
  return Math.hypot(vector.x, vector.y);
}

/** Round each component to the nearest multiple of `step` (avoids −0). */
export function snapVector(vector, step) {
  const snap = (value) => Math.round(value / step) * step + 0;
  return { x: snap(vector.x), y: snap(vector.y), z: snap(vector.z) };
}

export function clampVector(vector, limit) {
  const clamp = (value) => Math.min(limit, Math.max(-limit, value));
  return { x: clamp(vector.x), y: clamp(vector.y), z: clamp(vector.z) };
}

export function isUnitVector(vector, tolerance = 1e-6) {
  return Math.abs(magnitude(vector) - 1) <= tolerance;
}
