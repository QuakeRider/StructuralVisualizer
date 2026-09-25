import { describe, expect, it } from 'vitest';
import { add, clampVector, cross, dot, isUnitVector, magnitude, negate, normalize, scale, snapVector, subtract, xyMagnitude } from './vector.js';

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
