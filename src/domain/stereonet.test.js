import { describe, expect, it } from 'vitest';
import { planeFromDipDirection, planePole } from './orientation.js';
import { equalAreaLine, equalAreaPoint, greatCirclePoints, lineFromVector, planeFromPole } from './stereonet.js';

describe('lower-hemisphere equal-area projection', () => {
  it('puts a vertical line at the center and horizontal lines on the primitive', () => {
    const center = equalAreaPoint({ trend: 123, plunge: 90 });
    expect(Math.hypot(center.x, center.y)).toBeCloseTo(0, 12);
    const north = equalAreaPoint({ trend: 0, plunge: 0 });
    expect(north.x).toBeCloseTo(0, 12);
    expect(north.y).toBeCloseTo(1, 12);
    const east = equalAreaPoint({ trend: 90, plunge: 0 });
    expect(east.x).toBeCloseTo(1, 12);
    expect(east.y).toBeCloseTo(0, 12);
  });

  it('spaces plunges by equal area: r = √2 sin((90° − p)/2)', () => {
    const point = equalAreaPoint({ trend: 90, plunge: 45 });
    expect(point.x).toBeCloseTo(Math.SQRT2 * Math.sin(Math.PI / 8), 12);
    // A line plunging 30° lands at r = √2 sin 30° = 0.707.
    const south = equalAreaPoint({ trend: 180, plunge: 30 });
    expect(south.y).toBeCloseTo(-Math.SQRT1_2, 12);
  });

  it('inverts the projection, and rejects points outside the net', () => {
    for (const line of [{ trend: 37, plunge: 12 }, { trend: 250, plunge: 71 }, { trend: 180, plunge: 0.5 }]) {
      const point = equalAreaPoint(line);
      const back = equalAreaLine(point.x, point.y);
      expect(back.trend).toBeCloseTo(line.trend, 9);
      expect(back.plunge).toBeCloseTo(line.plunge, 9);
    }
    expect(equalAreaLine(0, 0).plunge).toBeCloseTo(90, 12);
    expect(equalAreaLine(0.9, 0.9)).toBeNull();
  });

  it('always reads the lower-hemisphere end of a direction', () => {
    const up = lineFromVector({ x: -1, y: 0, z: -1 });
    expect(up.trend).toBeCloseTo(0, 12);
    expect(up.plunge).toBeCloseTo(45, 12);
    expect(lineFromVector({ x: 0, y: 0, z: -2 }).plunge).toBeCloseTo(90, 12);
  });

  it('draws a great circle from strike to strike through the dip direction', () => {
    const plane = planeFromDipDirection(90, 60);
    const points = greatCirclePoints(plane, 61);
    // Ends on the primitive at the strike (000°) and 180°.
    expect(points[0].y).toBeCloseTo(1, 9);
    expect(points.at(-1).y).toBeCloseTo(-1, 9);
    // The middle point is the dip line, plunging 60° toward 090°.
    const middle = equalAreaLine(points[30].x, points[30].y);
    expect(middle.trend).toBeCloseTo(90, 9);
    expect(middle.plunge).toBeCloseTo(60, 9);
  });

  it('recovers a plane from its pole', () => {
    const plane = planeFromDipDirection(120, 35);
    const pole = lineFromVector(planePole(plane));
    expect(pole.trend).toBeCloseTo(300, 9);
    expect(pole.plunge).toBeCloseTo(55, 9);
    const back = planeFromPole(pole);
    expect(back.dipDirection).toBeCloseTo(120, 9);
    expect(back.dip).toBeCloseTo(35, 9);
    expect(back.strike).toBeCloseTo(30, 9);
  });
});
