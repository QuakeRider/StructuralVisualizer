// Fault anatomy and growth (lesson B9). NED frame (x = North, y = East, z = Down),
// lengths in metres, angles in degrees. All faults here are normal faults: the
// hanging wall moves down the dip relative to the footwall.
//
// Coordinates on a fault: u along strike (right-hand rule) and w down the dip,
// both measured from the fault's center; d is the distance from the fault
// along its downward pole (positive into the footwall).
//
// The displacement models are stated idealizations, exact given the model:
// - Displacement on an isolated fault falls from Dmax at the center to zero on
//   an elliptical tip line with semi-axes a (along strike) and b (down dip).
//   With r = √((u/a)² + (w/b)²), the elliptical model is D = Dmax √(1 − r²)
//   and the linear taper is D = Dmax (1 − r). Relay segments use the bell
//   shape D = Dmax (1 − r²).
// - Displacement–length scaling: D = c Lⁿ, with n ≈ 1 for real faults.
// - Each wall moves half the slip; away from the fault the motion fades with
//   a decay length (reverse drag), or follows the drag model
//   u(d) = (D/2)(1 − k(1 − e^(−|d|/λ))).
// - Linkage: the profiles of overlapping segments add.

import { dipVector, planeFromStrike, planePole, strikeVector } from './orientation.js';
import { dot, scale, subtract } from './vector.js';

const RAD = Math.PI / 180;

/** Elliptical radius of a point on the fault: 0 at the center, 1 on the tip line. */
export function tipRadius(a, b, u, w) {
  return Math.hypot(u / a, w / b);
}

/**
 * Displacement as a fraction of Dmax at elliptical radius r; zero on and
 * beyond the tip line. 'elliptical' √(1 − r²), 'linear' 1 − r, and 'bell'
 * 1 − r² (used for relay segments, whose tips taper more steeply).
 */
export function displacementShape(r, model = 'elliptical') {
  if (r >= 1) return 0;
  if (model === 'linear') return 1 - r;
  if (model === 'bell') return 1 - r * r;
  return Math.sqrt(1 - r * r);
}

/** D(u, w) = Dmax √(1 − (u/a)² − (w/b)²) inside the tip line, 0 outside. */
export function ellipticalDisplacement(a, b, dMax, u, w) {
  return dMax * displacementShape(tipRadius(a, b, u, w), 'elliptical');
}

/**
 * Displacement of a field at (u, w). field = { a, b, dMax, model } for an
 * isolated fault, or { uniform: true, dMax } for a fault whose tips are far
 * outside the view.
 */
export function displacementAt(field, u, w) {
  if (field.uniform) return field.dMax;
  return field.dMax * displacementShape(tipRadius(field.a, field.b, u, w), field.model);
}

/** Elliptical radius of the contour where D equals `level`. */
export function contourRadius(level, dMax, model = 'elliptical') {
  const fraction = Math.min(Math.max(level / dMax, 0), 1);
  return model === 'linear' ? 1 - fraction : Math.sqrt(1 - fraction * fraction);
}

/**
 * The displacement profile along strike: a horizontal line on the fault at
 * down-dip distance w, sampled from u = −a to a. Returns the half-length of
 * the faulted part of the line, its peak displacement, and the samples.
 */
export function displacementProfile(field, { w = 0, count = 81 } = {}) {
  const across = Math.max(0, 1 - (w / field.b) ** 2);
  const halfLength = field.a * Math.sqrt(across);
  const peak = displacementAt(field, 0, w);
  const points = Array.from({ length: count }, (_, index) => {
    const u = -field.a + (2 * field.a * index) / (count - 1);
    return { u, d: displacementAt(field, u, w) };
  });
  return { w, halfLength, peak, points };
}

/* ---------- Displacement–length scaling ---------- */

/** D = c Lⁿ (L and D in metres). */
export function dlScaling(length, c, n = 1) {
  return c * length ** n;
}

/** The length that D = c Lⁿ gives for a displacement D. */
export function dlLength(displacement, c, n = 1) {
  return (displacement / c) ** (1 / n);
}

/* ---------- Drag and the 3D displacement field ---------- */

/**
 * Displacement of one wall along the slip direction at distance d from the
 * fault: (D/2)(1 − k(1 − e^(−|d|/λ))). k > 0: the rock beside the fault moved
 * most (reverse drag); k < 0: it moved least (normal drag); k = 0: rigid walls.
 */
export function dragDisplacement(distance, { slip, k, width }) {
  return (slip / 2) * (1 - k * (1 - Math.exp(-Math.abs(distance) / width)));
}

/** Offset of a marker far from the fault under the drag model: D(1 − k). */
export function farFieldOffset(slip, k) {
  return slip * (1 - k);
}

export function classifyDrag(k, tolerance = 0.05) {
  if (k > tolerance) return 'reverse drag';
  if (k < -tolerance) return 'normal drag';
  return 'no drag';
}

/**
 * How a point moves because of one normal fault. fault = { center, plane,
 * field | profile(u, w), decay (m) | null, drag: { k, width } | null }. Each
 * wall carries half the local displacement D: the hanging wall down the dip,
 * the footwall up it, so the walls slide along the fault without opening.
 */
export function faultDisplacement(point, fault) {
  const q = subtract(point, fault.center);
  const downdip = dipVector(fault.plane);
  const u = dot(q, strikeVector(fault.plane));
  const w = dot(q, downdip);
  const d = dot(q, planePole(fault.plane));
  const side = d > 0 ? 'foot' : 'hanging';
  const D = fault.profile ? fault.profile(u, w) : displacementAt(fault.field, u, w);
  const distance = Math.abs(d);
  let amount = D / 2;
  if (fault.drag) amount = dragDisplacement(distance, { slip: D, ...fault.drag });
  else if (fault.decay) amount *= Math.exp(-distance / fault.decay);
  return { vector: scale(downdip, side === 'hanging' ? amount : -amount), amount, side, u, w, d, D };
}

/* ---------- Growth by linkage: two overlapping segments and a relay ramp ---------- */

/**
 * The relay model: two parallel normal-fault segments, A (west) and B (east),
 * whose outer tips stay put while their inner tips grow toward and past each
 * other. Each segment keeps D = cL. At `breachAt` the ramp between them is cut
 * by a breaching fault from A to B; after that the linked fault slips more,
 * toward the profile of one fault of the whole length.
 */
export const RELAY = Object.freeze({
  outerTip: 460,
  stepover: 150,
  ratio: 0.1,
  minOverlap: -200,
  breachOverlap: 120,
  breachAt: 0.6,
  breachHalfLength: 40,
  depth: 200,
  dip: 60,
  height: 220,
  decay: 180,
});

function segment(id, from, to, y, ratio) {
  const halfLength = Math.max((to - from) / 2, 0);
  return { id, from, to, y, center: (from + to) / 2, halfLength, dMax: ratio * 2 * halfLength };
}

/**
 * Along-strike displacement of a relay segment: a bell-shaped profile,
 * Dmax (1 − r²), whose tips taper more steeply than an ellipse, as the tips of
 * interacting segments tend to. The single-fault target uses the same shape.
 */
export function segmentProfile(part, x) {
  if (part.halfLength <= 0) return 0;
  const r = Math.abs(x - part.center) / part.halfLength;
  return part.dMax * displacementShape(r, 'bell');
}

/** Soft linkage: the displacement of overlapping segments adds. */
export function linkSegments(parts, x) {
  return parts.reduce((sum, part) => sum + segmentProfile(part, x), 0);
}

function smoothstep(from, to, x) {
  const t = Math.min(Math.max((x - from) / (to - from), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * The relay system at a growth stage from 0 to 1: the overlap (negative for
 * underlap), the stage name, the segments, the breach (after `breachAt`),
 * how far the linked fault has caught up (`linked`, 0–1), and the profile
 * along strike at any x: each segment, the extra slip on the linked fault
 * (split between A, the breach, and B), the total, and the target profile of
 * one fault of the whole length with the same c.
 */
export function relaySystem(growth, relay = RELAY) {
  const g = Math.min(Math.max(growth, 0), 1);
  const breached = g >= relay.breachAt;
  const overlap = breached ? relay.breachOverlap : relay.minOverlap + ((relay.breachOverlap - relay.minOverlap) * g) / relay.breachAt;
  const linked = breached ? (g - relay.breachAt) / (1 - relay.breachAt) : 0;
  const stage = breached ? 'breached' : overlap < 0 ? 'underlapping' : 'overlapping';
  const half = relay.stepover / 2;
  const segments = [segment('A', -relay.outerTip, overlap / 2, -half, relay.ratio), segment('B', -overlap / 2, relay.outerTip, half, relay.ratio)];
  const target = segment('target', -relay.outerTip, relay.outerTip, 0, relay.ratio);
  const reach = relay.breachHalfLength;
  const breach = breached ? { from: { x: -reach, y: -half }, to: { x: reach, y: half } } : null;
  const profile = (x) => {
    const A = segmentProfile(segments[0], x);
    const B = segmentProfile(segments[1], x);
    const targetValue = segmentProfile(target, x);
    const extra = linked * Math.max(0, targetValue - A - B);
    const shareA = 1 - smoothstep(-reach, 0, x);
    const shareB = smoothstep(0, reach, x);
    const extraA = extra * shareA;
    const extraB = extra * shareB;
    const extraBreach = extra - extraA - extraB;
    return { A, B, extraA, extraB, extraBreach, total: A + B + extra, target: targetValue };
  };
  return { growth: g, overlap, stage, linked, segments, target, breach, profile };
}

/**
 * The relay system as 3D faults for the displacement field: A and B strike
 * north and dip east, and the breach runs from A to B across the ramp. Each
 * segment has an elliptical tip line (half-height `height` down the dip), and
 * the linked fault's extra slip tapers down the dip over the same height.
 * Horizontal lines at the reference depth (w = 0) follow `system.profile`.
 */
export function relayFaults(system, relay = RELAY) {
  const taper = (w) => Math.sqrt(Math.max(0, 1 - (w / relay.height) ** 2));
  const plane = planeFromStrike(0, relay.dip);
  const faults = system.segments.map((part) => ({
    id: part.id,
    center: { x: 0, y: part.y, z: relay.depth },
    plane,
    decay: relay.decay,
    tipLine: { u0: part.center, a: part.halfLength, b: relay.height },
    profile: (u, w) => {
      const own = part.halfLength > 0 ? part.dMax * displacementShape(tipRadius(part.halfLength, relay.height, u - part.center, w), 'bell') : 0;
      const point = system.profile(u);
      return own + (part.id === 'A' ? point.extraA : point.extraB) * taper(w);
    },
  }));
  if (system.breach) {
    const { from, to } = system.breach;
    const strike = Math.atan2(to.y - from.y, to.x - from.x) / RAD;
    const halfLength = Math.hypot(to.x - from.x, to.y - from.y) / 2;
    const cosine = Math.cos(strike * RAD);
    faults.push({
      id: 'breach',
      center: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: relay.depth },
      plane: planeFromStrike(strike, relay.dip),
      decay: relay.decay,
      halfLength,
      profile: (u, w) => (Math.abs(u) > halfLength ? 0 : system.profile(u * cosine).extraBreach * taper(w)),
    });
  }
  return faults;
}
