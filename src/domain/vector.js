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

/* ---------- Trigonometry of projection (M2). Angles in degrees. ---------- */

const RAD = Math.PI / 180;

/** Vector in the x–y plane with length L at angle α from +x: (L cos α, L sin α, 0). */
export function fromPolar(length, angle) {
  return { x: length * Math.cos(angle * RAD) + 0, y: length * Math.sin(angle * RAD) + 0, z: 0 };
}

/** Angle of the vector's x–y part from +x, counterclockwise, in [0, 360). Uses atan2, so the quadrant is right. */
export function polarAngle(vector) {
  const angle = Math.atan2(vector.y, vector.x) / RAD;
  return angle < 0 ? angle + 360 : angle + 0;
}

/** (cos α, cos β, cos γ): the components of the unit vector. Null for the zero vector. */
export function directionCosines(vector) {
  const length = magnitude(vector);
  if (length <= EPSILON) return null;
  return scale(vector, 1 / length);
}

/** Direction angles α, β, γ between the vector and the x, y, z axes. Null for the zero vector. */
export function directionAngles(vector) {
  const cosines = directionCosines(vector);
  if (!cosines) return null;
  const angle = (cosine) => Math.acos(Math.min(1, Math.max(-1, cosine))) / RAD;
  return { x: angle(cosines.x), y: angle(cosines.y), z: angle(cosines.z) };
}

/**
 * Components of the same vector in axes turned by θ about z (counterclockwise):
 * v′x = vx cos θ + vy sin θ, v′y = −vx sin θ + vy cos θ, v′z = vz.
 */
export function rotate2D(vector, theta) {
  const c = Math.cos(theta * RAD);
  const s = Math.sin(theta * RAD);
  return { x: vector.x * c + vector.y * s, y: -vector.x * s + vector.y * c, z: vector.z };
}
