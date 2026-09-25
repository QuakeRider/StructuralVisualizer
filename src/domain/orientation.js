// Orientation of lines and planes in the geological NED frame:
// x = North, y = East, z = Down (right-handed). Angles are in degrees.
// Planes use the right-hand rule: the dip direction is 90° clockwise from strike.

const RAD = Math.PI / 180;

/** Wrap an azimuth into [0, 360). */
export function normalizeAzimuth(degrees) {
  const wrapped = ((degrees % 360) + 360) % 360;
  return Math.abs(wrapped - 360) < 1e-9 ? 0 : wrapped + 0;
}

/** Unit vector of a line with the given trend and plunge (plunge positive downward). */
export function lineVector(trend, plunge) {
  const t = trend * RAD;
  const p = plunge * RAD;
  return { x: Math.cos(p) * Math.cos(t), y: Math.cos(p) * Math.sin(t), z: Math.sin(p) };
}

export function planeFromDipDirection(dipDirection, dip) {
  const direction = normalizeAzimuth(dipDirection);
  return { strike: normalizeAzimuth(direction - 90), dip, dipDirection: direction };
}

export function planeFromStrike(strike, dip) {
  const direction = normalizeAzimuth(strike);
  return { strike: direction, dip, dipDirection: normalizeAzimuth(direction + 90) };
}

/** Downward pole to the plane: trend = dip direction + 180°, plunge = 90° − dip. */
export function planePole({ dipDirection, dip }) {
  return lineVector(dipDirection + 180, 90 - dip);
}

/**
 * Upward normal: points into the block above the plane (the hanging wall).
 * For a vertical plane it points horizontally toward the dip direction.
 */
export function planeUpwardNormal({ dipDirection, dip }) {
  const d = dip * RAD;
  const t = dipDirection * RAD;
  return { x: Math.sin(d) * Math.cos(t), y: Math.sin(d) * Math.sin(t), z: -Math.cos(d) + 0 };
}

/** Horizontal line along strike. */
export function strikeVector({ strike }) {
  return lineVector(strike, 0);
}

/** Line of steepest descent in the plane. */
export function dipVector({ dipDirection, dip }) {
  return lineVector(dipDirection, dip);
}
