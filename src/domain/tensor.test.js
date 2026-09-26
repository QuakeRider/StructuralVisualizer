import { describe, expect, it } from 'vitest';
import { applyTensor, resolveTraction } from './tensor.js';

const DIAGONAL = [[100, 0, 0], [0, 60, 0], [0, 0, 20]];

describe('stress tensor helpers', () => {
  it('multiplies the tensor by a vector', () => {
    expect(applyTensor(DIAGONAL, { x: 1, y: 2, z: 3 })).toEqual({ x: 100, y: 120, z: 60 });
    expect(applyTensor([[1, 2, 3], [4, 5, 6], [7, 8, 9]], { x: 1, y: 0, z: -1 })).toEqual({ x: -2, y: -2, z: -2 });
  });

  it('gives a principal plane pure normal stress and no shear', () => {
    const result = resolveTraction(DIAGONAL, { x: 0, y: 0, z: 1 });
    expect(result.sigmaN).toBe(20);
    expect(result.tau).toBe(0);
  });

  it('resolves a plane at 45° between σ1 and σ3 to the top of the σ1–σ3 circle', () => {
    const n = { x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 };
    const result = resolveTraction(DIAGONAL, n);
    expect(result.sigmaN).toBeCloseTo(60, 12);
    expect(result.tau).toBeCloseTo(40, 12);
  });

  it('matches σn = Σσᵢcᵢ² and τ² = Σσᵢ²cᵢ² − σn² for an oblique plane', () => {
    const c = { x: 2 / 7, y: 3 / 7, z: 6 / 7 };
    const sigmaN = 100 * c.x ** 2 + 60 * c.y ** 2 + 20 * c.z ** 2;
    const tauSquared = 100 ** 2 * c.x ** 2 + 60 ** 2 * c.y ** 2 + 20 ** 2 * c.z ** 2 - sigmaN ** 2;
    const result = resolveTraction(DIAGONAL, c);
    expect(result.sigmaN).toBeCloseTo(sigmaN, 12);
    expect(result.tau).toBeCloseTo(Math.sqrt(tauSquared), 12);
    // The shear part lies in the plane.
    expect(result.shear.x * c.x + result.shear.y * c.y + result.shear.z * c.z).toBeCloseTo(0, 12);
  });
});
