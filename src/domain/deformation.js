const DEFAULTS = {
  normalScale: 0.0065,
  shearScale: 0.008,
  poisson: 0.18,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert the displayed compression-positive stress tensor into a deliberately
 * simplified deformation gradient. This mapping prioritizes legibility and
 * preserves volume for a shear-only state. It is not a constitutive model.
 */
export function computeDeformation(stress, exaggeration = 1, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const { xx, yy, zz, xy, xz, yz } = stress;
  const k = config.normalScale * exaggeration;
  const shearK = config.shearScale * exaggeration;

  const ex = clamp((-xx + config.poisson * (yy + zz)) * k, -0.42, 0.55);
  const ey = clamp((-yy + config.poisson * (xx + zz)) * k, -0.42, 0.55);
  const ez = clamp((-zz + config.poisson * (xx + yy)) * k, -0.42, 0.55);

  const gxy = clamp(xy * shearK, -0.65, 0.65);
  const gxz = clamp(xz * shearK, -0.65, 0.65);
  const gyz = clamp(yz * shearK, -0.65, 0.65);

  // An upper-triangular shear mapping keeps det(F) independent of pure shear.
  const matrix = [
    [1 + ex, gxy, gxz],
    [0, 1 + ey, gyz],
    [0, 0, 1 + ez],
  ];

  return {
    matrix,
    strain: { xx: ex, yy: ey, zz: ez, xy: gxy, xz: gxz, yz: gyz },
    determinant: determinant3(matrix),
  };
}

export function applyDeformation(point, matrix) {
  const [x, y, z] = point;
  return [
    matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
    matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
    matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z,
  ];
}

export function determinant3(matrix) {
  const [a, b, c] = matrix[0];
  const [d, e, f] = matrix[1];
  const [g, h, i] = matrix[2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

export function volumeChangePercent(determinant) {
  return (determinant - 1) * 100;
}

export function lerpStress(current, target, amount) {
  return Object.fromEntries(
    Object.keys(target).map((key) => [key, current[key] + (target[key] - current[key]) * amount]),
  );
}

export function tensorToMatrix(stress) {
  return [
    [stress.xx, stress.xy, stress.xz],
    [stress.xy, stress.yy, stress.yz],
    [stress.xz, stress.yz, stress.zz],
  ];
}
