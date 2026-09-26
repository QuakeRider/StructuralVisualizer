// Lower-hemisphere equal-area (Schmidt) projection, NED frame.
// Net coordinates: x to the east, y to the north, primitive circle radius 1.
// A line with plunge p lands at r = √2·sin((90° − p)/2) from the center, in
// the direction of its trend; a vertical line is the center.

import { dipVector, normalizeAzimuth, strikeVector } from './orientation.js';

const RAD = Math.PI / 180;

/** Trend and plunge of the lower-hemisphere end of a direction (the sign of the vector does not matter). */
export function lineFromVector(v) {
  const flip = v.z < 0 ? -1 : 1;
  const x = v.x * flip;
  const y = v.y * flip;
  const z = v.z * flip;
  const length = Math.hypot(x, y, z);
  const plunge = Math.asin(Math.min(1, z / length)) / RAD;
  const trend = Math.hypot(x, y) < 1e-12 ? 0 : normalizeAzimuth(Math.atan2(y, x) / RAD);
  return { trend, plunge };
}

/** Project a line (trend, plunge in degrees) onto the net. */
export function equalAreaPoint({ trend, plunge }) {
  const r = Math.SQRT2 * Math.sin(((90 - plunge) / 2) * RAD);
  return { x: r * Math.sin(trend * RAD), y: r * Math.cos(trend * RAD) };
}

/** The line that projects to a point of the net, or null outside the primitive circle. */
export function equalAreaLine(x, y) {
  const r = Math.hypot(x, y);
  if (r > 1 + 1e-9) return null;
  const plunge = 90 - (2 * Math.asin(Math.min(r, 1) / Math.SQRT2)) / RAD;
  const trend = r < 1e-12 ? 0 : normalizeAzimuth(Math.atan2(x, y) / RAD);
  return { trend, plunge };
}

/**
 * Points along the great circle of a plane, from the strike direction through
 * the dip direction to the opposite strike (all on the lower hemisphere).
 */
export function greatCirclePoints(plane, count = 91) {
  const s = strikeVector(plane);
  const d = dipVector(plane);
  const points = [];
  for (let index = 0; index < count; index += 1) {
    const a = (index / (count - 1)) * Math.PI;
    const v = { x: Math.cos(a) * s.x + Math.sin(a) * d.x, y: Math.cos(a) * s.y + Math.sin(a) * d.y, z: Math.cos(a) * s.z + Math.sin(a) * d.z };
    points.push(equalAreaPoint(lineFromVector(v)));
  }
  return points;
}

/** The plane whose pole is the given line: dip direction opposite the pole's trend, dip = 90° − plunge. */
export function planeFromPole({ trend, plunge }) {
  const dipDirection = normalizeAzimuth(trend + 180);
  return { strike: normalizeAzimuth(dipDirection - 90), dip: 90 - plunge, dipDirection };
}
