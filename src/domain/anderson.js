// Anderson's theory of faulting (lesson B7). NED frame, compression positive.
// Near the free surface one principal stress is vertical; which one it is
// sets the fault type, and the Coulomb angle β = 45° − φ/2 between σ1 and
// the fault sets the dip.

import { coulombAngles } from './failure.js';
import { lineVector, planeFromDipDirection, planeFromStrike, planeUpwardNormal, strikeVector } from './orientation.js';
import { applyTensor } from './tensor.js';
import { dot, magnitude, normalize, scale, subtract } from './vector.js';

export const ANDERSON_REGIMES = Object.freeze({
  normal: { vertical: 'sigma1', faultType: 'normal' },
  'strike-slip': { vertical: 'sigma2', faultType: 'strike-slip' },
  thrust: { vertical: 'sigma3', faultType: 'thrust (reverse)' },
});

const VERTICAL = { trend: 0, plunge: 90 };
const horizontal = (trend) => ({ trend: ((trend % 360) + 360) % 360, plunge: 0 });

/**
 * Principal axes (trend/plunge) for a regime. `shmaxTrend` is the trend of
 * the maximum horizontal stress: σ1 in the thrust and strike-slip regimes,
 * σ2 in the normal regime.
 */
export function andersonAxes(regime, shmaxTrend = 0) {
  const max = horizontal(shmaxTrend);
  const min = horizontal(shmaxTrend + 90);
  if (regime === 'normal') return { sigma1: VERTICAL, sigma2: max, sigma3: min };
  if (regime === 'strike-slip') return { sigma1: max, sigma2: VERTICAL, sigma3: min };
  if (regime === 'thrust') return { sigma1: max, sigma2: min, sigma3: VERTICAL };
  throw new RangeError(`Unknown regime "${regime}"`);
}

/**
 * The conjugate pair of Coulomb faults for a regime and friction coefficient.
 * Both planes contain σ2 and lie at β from σ1.
 */
export function andersonFaults(regime, mu, shmaxTrend = 0) {
  const axes = andersonAxes(regime, shmaxTrend);
  const { phi, beta, theta } = coulombAngles(mu);
  let faults;
  let dip;
  if (regime === 'normal') {
    dip = 90 - beta;
    faults = [planeFromDipDirection(shmaxTrend + 90, dip), planeFromDipDirection(shmaxTrend - 90, dip)];
  } else if (regime === 'thrust') {
    dip = beta;
    faults = [planeFromDipDirection(shmaxTrend, dip), planeFromDipDirection(shmaxTrend + 180, dip)];
  } else {
    dip = 90;
    faults = [planeFromStrike(shmaxTrend + beta, 90), planeFromStrike(shmaxTrend - beta, 90)];
  }
  return { regime, axes, phi, beta, theta, dip, faults };
}

/** Stress tensor (3×3, NED rows) with the given principal axes and magnitudes: σ = Σ σᵢ 𝐯ᵢ𝐯ᵢᵀ. */
export function principalStressTensor(axes, magnitudes) {
  const tensor = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const key of ['sigma1', 'sigma2', 'sigma3']) {
    const v = lineVector(axes[key].trend, axes[key].plunge);
    const components = [v.x, v.y, v.z];
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) tensor[row][column] += magnitudes[key] * components[row] * components[column];
    }
  }
  return tensor;
}

/**
 * Slip direction of the block on the upward-normal side (the hanging wall, or
 * the dip-direction side of a vertical plane) relative to the other block.
 * The traction exerted on the lower block by the upper one is 𝐭 = −σ𝐦
 * (compression positive, 𝐦 pointing into the upper block); its shear part
 * points the way the upper block moves.
 */
export function faultSlip(tensor, plane) {
  const m = planeUpwardNormal(plane);
  const t = scale(applyTensor(tensor, m), -1);
  const shear = subtract(t, scale(m, dot(t, m)));
  const size = magnitude(shear);
  return { normal: m, shearMagnitude: size, slip: size > 1e-9 ? normalize(shear) : null };
}

/**
 * Name the slip of the upper (hanging-wall or dip-direction-side) block:
 * normal/reverse for dipping planes, dextral/sinistral for vertical ones.
 */
export function slipSense(plane, slip) {
  if (!slip) return 'none';
  if (plane.dip < 89.5) return slip.z > 0 ? 'normal' : 'reverse';
  // Seen from the other block, motion toward −strike is to the right (dextral).
  return dot(slip, strikeVector(plane)) < 0 ? 'dextral' : 'sinistral';
}
