// Brittle failure. Compression-positive stress in MPa; angles in degrees.
// θ is measured from σ1 to the plane normal, and a plane plots at 2θ on the
// Mohr circle (docs/curriculum/README.md, Conventions).

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
