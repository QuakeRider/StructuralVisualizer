import { describe, expect, it } from 'vitest';
import {
  calculateAverageTraction,
  calculateStressMpa,
  decomposeTraction,
  getStressNotation,
} from './forceStress.js';

describe('force-to-stress foundations', () => {
  it('converts force over square centimeters to megapascals', () => {
    expect(calculateStressMpa(5_000, 100)).toBeCloseTo(0.5);
  });

  it('doubles stress when the same force acts over half the area', () => {
    const original = calculateStressMpa(5_000, 100);
    const concentrated = calculateStressMpa(5_000, 50);
    expect(concentrated).toBeCloseTo(original * 2);
  });

  it('distinguishes normal and shear notation', () => {
    expect(getStressNotation('normal').symbol).toBe('σ');
    expect(getStressNotation('shear').symbol).toBe('τ');
  });

  it('rejects a zero contact area', () => {
    expect(() => calculateStressMpa(5_000, 0)).toThrow(RangeError);
  });

  it('calculates average traction as a vector', () => {
    expect(calculateAverageTraction({ x: 3_000, y: -4_000, z: 0 }, 100)).toEqual({
      x: 0.3,
      y: -0.4,
      z: 0,
    });
  });

  it('decomposes oblique traction into normal and shear components', () => {
    const result = decomposeTraction({ x: 3_000, y: -4_000, z: 0 }, 100, { x: 0, y: 1, z: 0 });
    expect(result.tractionMagnitude).toBeCloseTo(0.5);
    expect(result.normalTraction).toBeCloseTo(-0.4);
    expect(result.shearMagnitude).toBeCloseTo(0.3);
    expect(result.shearVector).toEqual({ x: 0.3, y: 0, z: 0 });
  });
});
