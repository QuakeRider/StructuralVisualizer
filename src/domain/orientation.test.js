import { describe, expect, it } from 'vitest';
import { dot } from './vector.js';
import { dipVector, lineVector, normalizeAzimuth, planeFromDipDirection, planeFromStrike, planePole, planeUpwardNormal, strikeVector } from './orientation.js';

const expectVector = (actual, expected) => {
  for (const axis of ['x', 'y', 'z']) expect(actual[axis]).toBeCloseTo(expected[axis], 9);
};

describe('NED orientation helpers', () => {
  it('wraps azimuths into 0–360°', () => {
    expect(normalizeAzimuth(370)).toBe(10);
    expect(normalizeAzimuth(-90)).toBe(270);
    expect(normalizeAzimuth(360)).toBe(0);
  });

  it('turns trend and plunge into a unit vector in north, east, down', () => {
    expectVector(lineVector(0, 0), { x: 1, y: 0, z: 0 });
    expectVector(lineVector(90, 0), { x: 0, y: 1, z: 0 });
    expectVector(lineVector(123, 90), { x: 0, y: 0, z: 1 });
    expectVector(lineVector(180, 30), { x: -Math.cos(Math.PI / 6), y: 0, z: 0.5 });
  });

  it('uses the right-hand rule: dip direction is 90° clockwise from strike', () => {
    expect(planeFromDipDirection(90, 30)).toEqual({ strike: 0, dip: 30, dipDirection: 90 });
    expect(planeFromDipDirection(0, 60)).toEqual({ strike: 270, dip: 60, dipDirection: 0 });
    expect(planeFromStrike(330, 90)).toEqual({ strike: 330, dip: 90, dipDirection: 60 });
  });

  it('gives the downward pole, the upward normal, and the strike and dip lines', () => {
    const plane = planeFromDipDirection(90, 30);
    // Pole: trend 270, plunge 60.
    expectVector(planePole(plane), { x: 0, y: -0.5, z: Math.cos(Math.PI / 6) });
    expectVector(planeUpwardNormal(plane), { x: 0, y: 0.5, z: -Math.cos(Math.PI / 6) });
    expectVector(strikeVector(plane), { x: 1, y: 0, z: 0 });
    expectVector(dipVector(plane), { x: 0, y: Math.cos(Math.PI / 6), z: 0.5 });
    expect(dot(planePole(plane), dipVector(plane))).toBeCloseTo(0, 12);
    expect(dot(planePole(plane), strikeVector(plane))).toBeCloseTo(0, 12);
  });

  it('points a vertical plane’s normal toward its dip-direction side', () => {
    expectVector(planeUpwardNormal(planeFromStrike(0, 90)), { x: 0, y: 1, z: 0 });
  });
});
