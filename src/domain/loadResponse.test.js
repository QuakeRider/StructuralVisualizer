import { describe, expect, it } from 'vitest';
import { calculateLoadResponse, calculateMoment, pointOnFace } from './loadResponse.js';

describe('load and equilibrium response', () => {
  it('computes a moment from force location using r cross F', () => {
    expect(calculateMoment({ x: 0, y: -1_000, z: 0 }, { x: 1, y: 0, z: 0 })).toEqual({
      x: 0,
      y: 0,
      z: -1_000,
    });
  });

  it('distinguishes free-body resultants from fixed-support reactions', () => {
    const input = {
      forceVector: { x: 2_000, y: -4_000, z: 0 },
      applicationPoint: { x: 0, y: 1.25, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
    };
    const free = calculateLoadResponse({ ...input, constraintMode: 'free' });
    const fixed = calculateLoadResponse({ ...input, constraintMode: 'fixed' });
    expect(free.isEquilibrated).toBe(false);
    expect(free.reactionForce).toEqual({ x: 0, y: 0, z: 0 });
    expect(fixed.reactionForce).toEqual({ x: -2_000, y: 4_000, z: -0 });
    expect(fixed.isEquilibrated).toBe(true);
  });

  it('resolves compression and shear relative to the loaded face', () => {
    const result = calculateLoadResponse({
      forceVector: { x: 3_000, y: -4_000, z: 0 },
      applicationPoint: { x: 0, y: 1.25, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
    });
    expect(result.normalForce).toBe(-4_000);
    expect(result.shearForce).toBe(3_000);
    expect(result.actions).toContain('compression');
    expect(result.actions).toContain('shear');
  });

  it('creates bending from an eccentric normal load', () => {
    const result = calculateLoadResponse({
      forceVector: { x: 0, y: -5_000, z: 0 },
      applicationPoint: { x: 0.8, y: 1.25, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
      cutPosition: 0,
    });
    expect(result.bendingMoment).toBeCloseTo(4_000);
    expect(result.actions).toContain('bending');
  });

  it('places a point on the selected face and removes normal offset', () => {
    expect(pointOnFace({ x: 1, y: 0, z: 0 }, { x: 4, y: 0.5, z: -0.5 })).toEqual({
      x: 1.25,
      y: 0.5,
      z: -0.5,
    });
  });
});
