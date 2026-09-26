import { describe, expect, it } from 'vitest';
import { add, clampVector, cross, directionAngles, directionCosines, dot, fromPolar, isUnitVector, magnitude, negate, normalize, polarAngle, rotate2D, scale, snapVector, subtract, xyMagnitude } from './vector.js';

describe('vector helpers', () => {
  it('adds, subtracts, and scales by components', () => {
    expect(add({ x: 1, y: 2, z: 3 }, { x: 4, y: -5, z: 6 })).toEqual({ x: 5, y: -3, z: 9 });
    expect(subtract({ x: 1, y: 2, z: 3 }, { x: 4, y: -5, z: 6 })).toEqual({ x: -3, y: 7, z: -3 });
    expect(scale({ x: 1, y: -2, z: 0.5 }, 2)).toEqual({ x: 2, y: -4, z: 1 });
  });

  it('computes magnitude with the three-dimensional Pythagorean relation', () => {
    expect(magnitude({ x: 3, y: -4, z: 0 })).toBe(5);
    expect(magnitude({ x: 2, y: 3, z: 6 })).toBe(7);
  });

  it('computes dot and cross products', () => {
    expect(dot({ x: 1, y: 2, z: 3 }, { x: 4, y: -5, z: 6 })).toBe(12);
    expect(cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toEqual({ x: 0, y: 0, z: 1 });
    expect(cross({ x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: -1 });
  });

  it('normalizes to unit length and rejects zero vectors', () => {
    const unit = normalize({ x: 0, y: -3, z: 4 });
    expect(magnitude(unit)).toBeCloseTo(1, 12);
    expect(unit.y).toBeCloseTo(-0.6, 12);
    expect(() => normalize({ x: 0, y: 0, z: 0 })).toThrow(RangeError);
  });
});

describe('vector lab helpers', () => {
  it('negates a vector without changing its length', () => {
    const v = { x: 2, y: -3, z: 6 };
    expect(negate(v)).toEqual({ x: -2, y: 3, z: -6 });
    expect(magnitude(negate(v))).toBe(magnitude(v));
  });

  it('measures the x–y ("floor") diagonal used in the stacked-triangle derivation', () => {
    const v = { x: 2, y: 3, z: 6 };
    expect(xyMagnitude(v)).toBeCloseTo(Math.sqrt(13), 12);
    expect(Math.hypot(xyMagnitude(v), v.z)).toBeCloseTo(magnitude(v), 12);
  });

  it('snaps and clamps components for dragging', () => {
    expect(snapVector({ x: 2.26, y: -3.74, z: 0.1 }, 0.5)).toEqual({ x: 2.5, y: -3.5, z: 0 });
    expect(clampVector({ x: 9, y: -9, z: 3 }, 6)).toEqual({ x: 6, y: -6, z: 3 });
  });

  it('recognizes unit vectors', () => {
    expect(isUnitVector({ x: 0.6, y: 0, z: -0.8 })).toBe(true);
    expect(isUnitVector({ x: 1, y: 1, z: 0 })).toBe(false);
    expect(isUnitVector({ x: 0.5, y: 0.5, z: 0.5 })).toBe(false);
  });
});

describe('trigonometry of projection (M2)', () => {
  const expectVector = (actual, expected) => {
    for (const axis of ['x', 'y', 'z']) expect(actual[axis]).toBeCloseTo(expected[axis], 9);
  };

  it('builds a vector from its length and angle: vx = L cos α, vy = L sin α', () => {
    expectVector(fromPolar(1, 0), { x: 1, y: 0, z: 0 });
    expectVector(fromPolar(5, 30), { x: 5 * Math.sqrt(3) / 2, y: 2.5, z: 0 });
    expectVector(fromPolar(2, 120), { x: -1, y: Math.sqrt(3), z: 0 });
  });

  it('recovers the angle in the right quadrant (atan2, not plain tan⁻¹)', () => {
    expect(polarAngle({ x: 3, y: 3, z: 0 })).toBeCloseTo(45, 12);
    expect(polarAngle({ x: -3, y: 3, z: 0 })).toBeCloseTo(135, 12);
    expect(polarAngle({ x: -3, y: -3, z: 0 })).toBeCloseTo(225, 12);
    expect(polarAngle({ x: 3, y: -3, z: 0 })).toBeCloseTo(315, 12);
    expect(polarAngle({ x: 0, y: -2, z: 0 })).toBeCloseTo(270, 12);
    // Plain tan⁻¹(vy/vx) cannot tell (−3, 3) from (3, −3).
    expect((Math.atan(3 / -3) * 180) / Math.PI).toBeCloseTo(-45, 12);
  });

  it('gives direction cosines that are the components of the unit vector', () => {
    const v = { x: 2, y: 3, z: 6 };
    const cosines = directionCosines(v);
    expectVector(cosines, { x: 2 / 7, y: 3 / 7, z: 6 / 7 });
    expect(cosines.x ** 2 + cosines.y ** 2 + cosines.z ** 2).toBeCloseTo(1, 12);
    expect(directionCosines({ x: 0, y: 0, z: 0 })).toBeNull();
  });

  it('gives direction angles to each axis', () => {
    const angles = directionAngles({ x: 0, y: 0, z: 4 });
    expect(angles.x).toBeCloseTo(90, 12);
    expect(angles.y).toBeCloseTo(90, 12);
    expect(angles.z).toBeCloseTo(0, 12);
    // In the x–y plane the angle to y is 90° minus the angle to x.
    const flat = directionAngles(fromPolar(1, 30));
    expect(flat.x).toBeCloseTo(30, 9);
    expect(flat.y).toBeCloseTo(60, 9);
  });

  it('rotates the axes, not the vector: new components, same length', () => {
    const v = { x: 4, y: 2, z: 1 };
    const primed = rotate2D(v, 30);
    expect(primed.x).toBeCloseTo(4 * Math.cos(Math.PI / 6) + 2 * 0.5, 12);
    expect(primed.y).toBeCloseTo(-4 * 0.5 + 2 * Math.cos(Math.PI / 6), 12);
    expect(primed.z).toBe(1);
    for (const theta of [0, 17, 90, 180, -45]) expect(magnitude(rotate2D(v, theta))).toBeCloseTo(magnitude(v), 12);
    expectVector(rotate2D({ x: 1, y: 0, z: 0 }, 90), { x: 0, y: -1, z: 0 });
    // Turning x′ onto the vector leaves one component: v′x = |v|, v′y = 0.
    const aligned = rotate2D({ x: 3, y: 4, z: 0 }, polarAngle({ x: 3, y: 4, z: 0 }));
    expectVector(aligned, { x: 5, y: 0, z: 0 });
  });
});
