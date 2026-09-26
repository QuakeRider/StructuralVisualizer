// Brittle failure. Compression-positive stress in MPa; angles in degrees.
// θ is measured from σ1 to the plane normal, and a plane plots at 2θ on the
// Mohr circle (docs/curriculum/README.md, Conventions).

import { lineVector } from './orientation.js';
import { equalAreaLine } from './stereonet.js';
import { resolveTraction } from './tensor.js';

const RAD = Math.PI / 180;

/** Friction angle φ = tan⁻¹ μ. */
export function frictionAngle(mu) {
  return Math.atan(mu) / RAD;
}

/**
 * Orientation of the Coulomb failure plane for friction coefficient μ:
 * θ = 45° + φ/2 from σ1 to the plane normal, so the plane itself lies at
 * β = 90° − θ = 45° − φ/2 from σ1, and it plots at 2θ = 90° + φ.
 */
export function coulombAngles(mu) {
  const phi = frictionAngle(mu);
  const theta = 45 + phi / 2;
  return { phi, theta, beta: 90 - theta, twoTheta: 2 * theta };
}

/** Shear strength on the Coulomb line: τ = C + μσn. */
export function coulombShearStrength(sigmaN, { cohesion, mu }) {
  return cohesion + mu * sigmaN;
}

/**
 * σ1 at which the Mohr circle with this σ3 just touches the Coulomb line:
 * σ1 = σ3 (1 + sin φ)/(1 − sin φ) + 2C cos φ/(1 − sin φ).
 */
export function sigma1AtFailure(sigma3, { cohesion, mu }) {
  const phi = frictionAngle(mu) * RAD;
  const sin = Math.sin(phi);
  return (sigma3 * (1 + sin)) / (1 - sin) + (2 * cohesion * Math.cos(phi)) / (1 - sin);
}

export function mohrCircle(sigma1, sigma3) {
  return { center: (sigma1 + sigma3) / 2, radius: (sigma1 - sigma3) / 2 };
}

/** Normal and shear stress on a plane whose normal is θ from σ1 (planes containing σ2). */
export function mohrPoint(sigma1, sigma3, theta) {
  const { center, radius } = mohrCircle(sigma1, sigma3);
  const twoTheta = 2 * theta * RAD;
  return { sigmaN: center + radius * Math.cos(twoTheta), tau: radius * Math.sin(twoTheta) };
}

/* ---------- Friction on existing planes (lesson B6) ---------- */

/**
 * Byerlee's law for sliding on existing rock surfaces (effective normal
 * stress in MPa): τ = 0.85σn′ below 200 MPa, τ = 50 MPa + 0.6σn′ above.
 * The two lines meet at σn′ = 200 MPa, τ = 170 MPa.
 */
export const BYERLEE = Object.freeze({ mu: 0.85, transition: 200, highIntercept: 50, highMu: 0.6 });

export function byerlee(sigmaNEff) {
  return sigmaNEff < BYERLEE.transition ? BYERLEE.mu * sigmaNEff : BYERLEE.highIntercept + BYERLEE.highMu * sigmaNEff;
}

/** Principal magnitudes with σ2 a fraction `ratio` of the way from σ3 to σ1. */
export function principalMagnitudes(sigma1, sigma3, ratio = 0.5) {
  return { sigma1, sigma2: sigma3 + ratio * (sigma1 - sigma3), sigma3 };
}

/** The three Mohr circles of a 3D stress state; every plane plots on or between them. */
export function mohrCircles3D({ sigma1, sigma2, sigma3 }) {
  return [
    { between: ['sigma1', 'sigma3'], ...mohrCircle(sigma1, sigma3) },
    { between: ['sigma1', 'sigma2'], ...mohrCircle(sigma1, sigma2) },
    { between: ['sigma2', 'sigma3'], ...mohrCircle(sigma2, sigma3) },
  ];
}

/**
 * Slip tendency of a plane: Ts = τ/σn′, the ratio of shear stress to
 * effective normal stress (σn′ = σn − Pf). It is the slope of the line from
 * the origin to the plane's point on the Mohr diagram; the plane slips when
 * that slope reaches the friction line.
 */
export function slipTendency(tensor, n, pf = 0) {
  return frictionCheck(tensor, n, pf).ts;
}

/** Everything the friction lab shows for one plane: stresses, Ts, Byerlee strength, and whether it slips. */
export function frictionCheck(tensor, n, pf = 0) {
  const { sigmaN, tau, shear, traction } = resolveTraction(tensor, n);
  const sigmaNEff = sigmaN - pf;
  const strength = byerlee(sigmaNEff);
  return {
    sigmaN,
    sigmaNEff,
    tau,
    shear,
    traction,
    ts: sigmaNEff > 1e-9 ? tau / sigmaNEff : Infinity,
    strength,
    slips: tau >= strength - 1e-9,
  };
}

/** Dilation tendency Td = (σ1 − σn)/(σ1 − σ3): 1 for a plane normal to σ3 (easiest to open), 0 normal to σ1. */
export function dilationTendency(tensor, n, { sigma1, sigma3 }) {
  if (sigma1 - sigma3 < 1e-12) return 0;
  return (sigma1 - resolveTraction(tensor, n).sigmaN) / (sigma1 - sigma3);
}

/**
 * The σ1 at which an existing plane starts to slip, holding σ3, the σ2 ratio,
 * and Pf fixed. With σᵢ = σ3 + Δkᵢ (k = 1, ratio, 0) and cᵢ the direction
 * cosines of the plane normal to the principal axes, σn = σ3 + Δf and τ = Δg,
 * where f = Σkᵢcᵢ² and g² = Σkᵢ²cᵢ² − f². Each Byerlee segment τ = a + μσn′
 * then gives Δ = (a + μ(σ3 − Pf))/(g − μf). Returns Infinity when the plane
 * can never slip (it is "locked": g ≤ μf).
 */
export function reactivationSigma1(cosines, { sigma3, ratio = 0.5, pf = 0 }) {
  const k = [1, ratio, 0];
  const c2 = [cosines.c1 ** 2, cosines.c2 ** 2, cosines.c3 ** 2];
  const f = k[0] * c2[0] + k[1] * c2[1];
  const g = Math.sqrt(Math.max(0, k[0] ** 2 * c2[0] + k[1] ** 2 * c2[1] - f ** 2));
  const base = sigma3 - pf;
  for (const [intercept, mu] of [[0, BYERLEE.mu], [BYERLEE.highIntercept, BYERLEE.highMu]]) {
    const denominator = g - mu * f;
    if (denominator <= 1e-12) continue;
    const delta = (intercept + mu * base) / denominator;
    const sigmaNEff = base + delta * f;
    const onSegment = intercept === 0 ? sigmaNEff <= BYERLEE.transition + 1e-9 : sigmaNEff >= BYERLEE.transition - 1e-9;
    if (delta >= 0 && onSegment) return sigma3 + delta;
  }
  return Infinity;
}

/** σ1 at which intact rock breaks (Coulomb, in effective stress), holding σ3 and Pf fixed. */
export function newFaultSigma1(sigma3, { cohesion, mu, pf = 0 }) {
  return sigma1AtFailure(sigma3 - pf, { cohesion, mu }) + pf;
}

/** Direction cosines of a unit normal to the principal axes (each axis given as a unit vector). */
export function principalCosines(n, axisVectors) {
  const cosine = (axis) => n.x * axis.x + n.y * axis.y + n.z * axis.z;
  return { c1: cosine(axisVectors.sigma1), c2: cosine(axisVectors.sigma2), c3: cosine(axisVectors.sigma3) };
}

/**
 * Slip tendency over every plane orientation, sampled on a size × size grid
 * over the lower-hemisphere equal-area net: each cell is a pole, and its
 * value is Ts for the plane with that pole (NaN outside the primitive).
 * `slips` marks the cells whose plane reaches Byerlee's line. Rows run from
 * north (top) to south; columns from west to east.
 */
export function slipTendencyGrid(tensor, { size = 120, pf = 0 } = {}) {
  const values = new Float32Array(size * size);
  const slips = new Uint8Array(size * size);
  let max = 0;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const index = row * size + column;
      const pole = equalAreaLine(((column + 0.5) / size) * 2 - 1, 1 - ((row + 0.5) / size) * 2);
      if (!pole) {
        values[index] = Number.NaN;
        continue;
      }
      const check = frictionCheck(tensor, lineVector(pole.trend, pole.plunge), pf);
      values[index] = check.ts;
      slips[index] = check.slips ? 1 : 0;
      if (Number.isFinite(check.ts)) max = Math.max(max, check.ts);
    }
  }
  return { size, values, slips, max };
}
