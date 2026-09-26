// Stress tensors as 3×3 row arrays, acting on {x, y, z} vectors.
// Compression positive: 𝐭 = σ𝐧 is the push on a plane with unit normal 𝐧,
// and its normal part σn = 𝐭·𝐧 is positive in compression.

import { dot, magnitude, scale, subtract } from './vector.js';

/** Matrix × vector: 𝐭 = σ𝐧. */
export function applyTensor(tensor, v) {
  const [a, b, c] = tensor;
  return {
    x: a[0] * v.x + a[1] * v.y + a[2] * v.z,
    y: b[0] * v.x + b[1] * v.y + b[2] * v.z,
    z: c[0] * v.x + c[1] * v.y + c[2] * v.z,
  };
}

/**
 * Resolve the traction on a plane with unit normal 𝐧 into its normal and
 * shear parts: σn = 𝐭·𝐧 and 𝛕 = 𝐭 − σn𝐧, with τ = |𝛕|. Flipping 𝐧 flips
 * 𝐭 and 𝛕 but leaves σn and τ unchanged.
 */
export function resolveTraction(tensor, n) {
  const traction = applyTensor(tensor, n);
  const sigmaN = dot(traction, n);
  const shear = subtract(traction, scale(n, sigmaN));
  return { traction, sigmaN, shear, tau: magnitude(shear) };
}
