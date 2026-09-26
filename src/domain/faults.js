// Fault kinematics (lesson B8). NED frame (x = North, y = East, z = Down),
// lengths in metres, angles in degrees, stress compression positive.
//
// Conventions on screen:
// - 𝐧 is the downward pole of the fault, pointing into the footwall (as in B6).
//   The hanging wall is the block above the fault; on a vertical fault it is
//   the block on the dip-direction side (90° clockwise from strike).
// - 𝐬 is the slip of the hanging wall relative to the footwall.
// - Rake λ of the slip vector (−180° to 180°) is measured in the fault plane
//   from the strike direction, positive toward up-dip: λ = 90° reverse,
//   λ = −90° normal, λ = 0° sinistral, λ = 180° dextral (the convention of
//   earthquake catalogs). The slickenline itself, a line with no sense, has the
//   O4 rake r (0–180°): r = −λ for λ ≤ 0 and r = 180° − λ for λ > 0.
// - Kinematic axes: P ∝ 𝐧 + 𝐬̂ and T ∝ 𝐧 − 𝐬̂ (unit vectors), B = 𝐧 × 𝐬̂.
//   The hanging wall pushes across the fault along 𝐧 and drags along 𝐬̂; P is
//   halfway between the push and the drag.

import { dipVector, lineVector, planePole, strikeVector } from './orientation.js';
import { lineFromVector, planeFromPole } from './stereonet.js';
import { resolveTraction } from './tensor.js';
import { add, cross, dot, magnitude, normalize, scale, subtract } from './vector.js';

const RAD = Math.PI / 180;

/** Unit vectors of the fault: along strike, up the dip, and the pole into the footwall. */
export function faultFrame(plane) {
  const strike = strikeVector(plane);
  const down = dipVector(plane);
  return { strike, updip: scale(down, -1), downdip: down, pole: planePole(plane) };
}

/** Unit slip vector of the hanging wall for rake λ: 𝐬̂ = cos λ 𝐞strike + sin λ 𝐞up-dip. */
export function slipFromRake(plane, rake) {
  const { strike, updip } = faultFrame(plane);
  const c = Math.cos(rake * RAD);
  const s = Math.sin(rake * RAD);
  return { x: c * strike.x + s * updip.x + 0, y: c * strike.y + s * updip.y + 0, z: c * strike.z + s * updip.z + 0 };
}

/** Rake λ (−180° to 180°] of a slip vector lying in the fault plane. */
export function rakeFromSlip(plane, slip) {
  const { strike, updip } = faultFrame(plane);
  const angle = Math.atan2(dot(slip, updip), dot(slip, strike)) / RAD;
  return Math.abs(angle + 180) < 1e-9 ? 180 : angle + 0;
}

/** The slickenline rake r (0–180°, O4) of a slip with rake λ. */
export function lineRakeFromSlipRake(rake) {
  return rake <= 0 ? -rake + 0 : 180 - rake;
}

/** Strike-slip and dip-slip parts of a slip vector (dip-slip positive up the dip). */
export function slipComponents(plane, slip) {
  const { strike, updip } = faultFrame(plane);
  return { strikeSlip: dot(slip, strike) + 0, dipSlip: dot(slip, updip) + 0 };
}

/** Rake within this many degrees of pure dip-slip or pure strike-slip counts as that kind. */
export const PURE_SLIP_WINDOW = 20;

/**
 * Name the slip from its rake: dip-slip (normal or reverse), strike-slip
 * (dextral or sinistral), or oblique (both parts named). On a vertical fault
 * the dip-slip part is named by which side goes up.
 */
export function classifySlip(plane, rake) {
  const up = Math.sin(rake * RAD);
  const along = Math.cos(rake * RAD);
  const limit = Math.sin(PURE_SLIP_WINDOW * RAD);
  const vertical = plane.dip >= 89.5;
  const dipSense = Math.abs(up) <= limit ? null : vertical ? (up > 0 ? 'hanging-up' : 'hanging-down') : up > 0 ? 'reverse' : 'normal';
  const strikeSense = Math.abs(along) <= limit ? null : along > 0 ? 'sinistral' : 'dextral';
  const kind = dipSense && strikeSense ? 'oblique' : dipSense ? 'dip-slip' : 'strike-slip';
  const dipWord = { normal: 'normal', reverse: plane.dip < 45 ? 'thrust' : 'reverse', 'hanging-up': 'dip-slip', 'hanging-down': 'dip-slip' }[dipSense];
  const name = kind === 'oblique' ? `oblique ${dipWord}–${strikeSense}` : kind === 'dip-slip' ? dipWord : strikeSense;
  return { kind, dipSense, strikeSense, name, vertical };
}

/**
 * Wallace–Bott: the hanging wall slips parallel to the shear part of the
 * traction 𝐭 = σ𝐧 (𝐧 into the footwall, so 𝐭 is the hanging wall's push on
 * the footwall). Returns the unit slip direction, or null when the plane
 * carries no shear (it is a principal plane).
 */
export function resolvedShearDirection(tensor, plane) {
  const { shear, tau } = resolveTraction(tensor, planePole(plane));
  return tau > 1e-9 ? scale(shear, 1 / tau) : null;
}

/** Kinematic P (shortening), T (extension), and B (null) axes of a fault with pole 𝐧 and unit slip 𝐬̂. */
export function kinematicAxes(n, slip) {
  const P = normalize(add(n, slip));
  const T = normalize(subtract(n, slip));
  const B = normalize(cross(n, slip));
  return { vectors: { P, T, B }, P: lineFromVector(P), T: lineFromVector(T), B: lineFromVector(B) };
}

/** The auxiliary plane: its pole is the slip vector (it contains 𝐧 and B). */
export function auxiliaryPlane(slip) {
  return planeFromPole(lineFromVector(slip));
}

/**
 * First-motion quadrant of a ray leaving the fault in direction 𝐯: the T
 * quadrants (where (𝐯·𝐧)(𝐯·𝐬̂) < 0) send out compressional first motions and
 * are shaded on a beach ball; the P quadrants are dilatational (white).
 */
export function firstMotion(v, n, slip) {
  return dot(v, n) * dot(v, slip) < 0 ? 'compressional' : 'dilatational';
}

/** Rotate σ1 and σ3 about σ2 by `angle` (right-hand rule about the σ2 line as given). */
export function tiltAxes(axes, angle) {
  const k = lineVector(axes.sigma2.trend, axes.sigma2.plunge);
  const c = Math.cos(angle * RAD);
  const s = Math.sin(angle * RAD);
  const rotate = (v) => add(add(scale(v, c), scale(cross(k, v), s)), scale(k, dot(k, v) * (1 - c)));
  const turn = (axis) => lineFromVector(rotate(lineVector(axis.trend, axis.plunge)));
  return { sigma1: turn(axes.sigma1), sigma2: { ...axes.sigma2 }, sigma3: turn(axes.sigma3) };
}

/* ---------- Slip vs separation ---------- */

/** A plane in space: unit normal and one point on it. */
export const planeThrough = (normal, point) => ({ normal, point });

/**
 * Separation of an offset planar marker, seen on a view surface (a map or a
 * section). The fault and the view plane meet along the fault trace, with
 * unit direction 𝐮. The footwall's marker crosses that trace at one point;
 * the hanging wall's marker, moved by the slip 𝐃, crosses it at another.
 * Their distance along 𝐮 is the separation, (𝐦·𝐃)/(𝐦·𝐮), where 𝐦 is the
 * marker's normal. It is zero whenever the slip lies in the marker plane,
 * however large the slip, and undefined when the marker's trace runs
 * parallel to the fault trace. `direction` orients 𝐮 (default: along strike).
 */
export function traceSeparation({ fault, marker, view, offset, direction }) {
  const f = fault.normal;
  const v = view.normal;
  const m = marker.normal;
  let u = cross(f, v);
  const length = magnitude(u);
  if (length < 1e-9) return null;
  u = scale(u, 1 / length);
  if (direction && dot(u, direction) < 0) u = scale(u, -1);
  const mu = dot(m, u);
  if (Math.abs(mu) < 1e-9) return { along: u, distance: null, points: null };
  // A point on the fault trace (fault ∩ view), nearest the origin.
  const c1 = dot(f, fault.point);
  const c2 = dot(v, view.point);
  const ff = dot(f, f);
  const vv = dot(v, v);
  const fv = dot(f, v);
  const det = ff * vv - fv * fv;
  const x0 = add(scale(f, (c1 * vv - c2 * fv) / det), scale(v, (c2 * ff - c1 * fv) / det));
  const at = (point) => add(x0, scale(u, dot(m, subtract(point, x0)) / mu));
  const footwall = at(marker.point);
  const hangingWall = at(add(marker.point, offset));
  return { along: u, distance: dot(m, offset) / mu, points: { footwall, hangingWall } };
}

/**
 * The rock a vertical well passes through. Beds are horizontal layers of
 * equal thickness counted down from the ground surface (layer 0 at the top).
 * Above the fault the well is in the hanging wall, whose rock has moved by
 * 𝐃, so a point at depth z there started at depth z − Dz. A hanging wall that
 * went down (normal slip) leaves a gap in the sequence; one that went up
 * (reverse slip) repeats part of it. Returns the pieces of the log and the
 * missing or repeated interval (its thickness is the stratigraphic separation).
 */
export function wellLog({ fault, offset, well, top, bottom, thickness }) {
  const f = fault.normal;
  const pieces = [];
  let faultDepth = null;
  if (Math.abs(f.z) > 1e-9) {
    const depth = fault.point.z - (f.x * (well.x - fault.point.x) + f.y * (well.y - fault.point.y)) / f.z;
    if (depth > top && depth < bottom) faultDepth = depth;
  }
  const addPieces = (from, to, wall, shift) => {
    let z = from;
    while (z < to - 1e-9) {
      const rock = z - shift;
      const layer = Math.floor((rock + 1e-9) / thickness);
      const next = Math.min(to, (layer + 1) * thickness + shift);
      pieces.push({ top: z, bottom: next, wall, layer });
      z = next;
    }
  };
  if (faultDepth === null) {
    addPieces(top, bottom, 'hanging', offset.z);
    return { pieces, faultDepth, gap: null };
  }
  addPieces(top, faultDepth, 'hanging', offset.z);
  addPieces(faultDepth, bottom, 'foot', 0);
  // Original depths of the rock just above and just below the fault.
  const above = faultDepth - offset.z;
  const below = faultDepth;
  const gap = Math.abs(above - below) < 1e-6 ? null : {
    kind: above < below ? 'missing' : 'repeated',
    from: Math.min(above, below),
    to: Math.max(above, below),
    thickness: Math.abs(above - below),
  };
  return { pieces, faultDepth, gap };
}

